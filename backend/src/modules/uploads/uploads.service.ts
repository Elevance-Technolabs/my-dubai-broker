import { randomUUID } from "node:crypto";
import {
	Prisma,
	type Upload,
	UploadStatus,
} from "../../../generated/prisma/client.js";
import {
	createPresignedPutUrl,
	deleteObject,
	headObject,
	PRESIGN_EXPIRES_IN_SECONDS,
	toPublicUrl,
} from "../../lib/r2.js";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../utils/AppError.js";
import {
	ALLOWED_CONTENT_TYPES,
	type UploadContext,
} from "./uploads.validation.js";

const MAX_PENDING_UPLOADS_PER_USER = 20;
const MAX_PENDING_ANONYMOUS_UPLOADS = 200;
const ANONYMOUS_KEY_PREFIX = "onboarding";
const PENDING_UPLOAD_TTL_MS = 60 * 60 * 1000;
const CLEANUP_BATCH_SIZE = 100;
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

interface PresignUploadData {
	fileName: string;
	contentType: string;
	size: number;
	uploadContext?: UploadContext;
}

interface UploadOwner {
	userId: string | null;
	companyId?: string | null;
}

const COMPANY_SCOPED_FOLDERS: Partial<Record<UploadContext, string>> = {
	"listing-photo": "listings",
	"company-logo": "logo",
	"company-cover": "cover",
	"company-listing-logo": "listing-logo",
	"company-document": "documents",
};

const buildUploadKey = (
	{ userId, companyId }: UploadOwner,
	uploadContext: UploadContext | undefined,
	uploadId: string,
	extension: string,
) => {
	if (!userId) return `${ANONYMOUS_KEY_PREFIX}/${uploadId}.${extension}`;

	const folder = uploadContext && COMPANY_SCOPED_FOLDERS[uploadContext];
	if (companyId && folder) {
		return `companies/${companyId}/${folder}/${uploadId}.${extension}`;
	}

	if (uploadContext === "product-image") {
		return `users/${userId}/products/${uploadId}.${extension}`;
	}

	return `uploads/${userId}/${uploadId}.${extension}`;
};

export const createPresignedUpload = async (
	owner: UploadOwner,
	data: PresignUploadData,
) => {
	const { userId } = owner;
	const pendingCount = await prisma.upload.count({
		where: { userId, status: UploadStatus.PENDING },
	});
	const limit = userId
		? MAX_PENDING_UPLOADS_PER_USER
		: MAX_PENDING_ANONYMOUS_UPLOADS;

	if (pendingCount >= limit) {
		throw new AppError("Too many pending uploads. Try again later.", 429);
	}

	const extension =
		ALLOWED_CONTENT_TYPES[
			data.contentType as keyof typeof ALLOWED_CONTENT_TYPES
		];
	const uploadId = randomUUID();
	const key = buildUploadKey(owner, data.uploadContext, uploadId, extension);

	await prisma.upload.create({
		data: {
			id: uploadId,
			userId,
			key,
			contentType: data.contentType,
			size: data.size,
			status: UploadStatus.PENDING,
		},
	});

	const uploadUrl = await createPresignedPutUrl(
		key,
		data.contentType,
		data.size,
	);

	return {
		uploadId,
		uploadUrl,
		key,
		expiresIn: PRESIGN_EXPIRES_IN_SECONDS,
	};
};

export const discardUpload = async (upload: { id: string; key: string }) => {
	await deleteObject(upload.key);
	await prisma.upload.updateMany({
		where: { id: upload.id, status: { not: UploadStatus.ATTACHED } },
		data: { status: UploadStatus.FAILED },
	});
};

export const deleteUpload = async (userId: string | null, uploadId: string) => {
	const upload = await prisma.upload.findFirst({
		where: { id: uploadId, userId },
	});

	if (!upload) {
		throw new AppError("Upload not found", 404);
	}

	if (upload.status === UploadStatus.ATTACHED) {
		throw new AppError("Upload is already attached and cannot be deleted", 409);
	}

	await discardUpload(upload);
};

const verifyUploads = async (ownerId: string | null, uploadIds: string[]) => {
	const found = await prisma.upload.findMany({
		where: { id: { in: uploadIds }, userId: ownerId },
	});

	if (found.length !== uploadIds.length) {
		throw new AppError("Upload not found", 404);
	}

	if (found.some((upload) => upload.status !== UploadStatus.PENDING)) {
		throw new AppError("Upload is no longer available", 409);
	}

	for (const upload of found) {
		const object = await headObject(upload.key);

		if (!object) {
			throw new AppError("File has not been uploaded to storage", 400);
		}

		if (
			object.size !== upload.size ||
			object.contentType !== upload.contentType
		) {
			await discardUpload(upload);
			throw new AppError("Uploaded file does not match the declared file", 400);
		}
	}

	return found;
};

export const withAttachedUploads = async <T>(
	ownerId: string | null,
	uploadIds: string[] | undefined,
	run: (tx: Prisma.TransactionClient, keys: string[]) => Promise<T>,
): Promise<T> => {
	const ids = uploadIds ?? [];

	if (new Set(ids).size !== ids.length) {
		throw new AppError("Duplicate upload IDs are not allowed", 400);
	}

	const uploads: Upload[] = ids.length ? await verifyUploads(ownerId, ids) : [];
	const keyById = new Map(uploads.map((upload) => [upload.id, upload.key]));
	const keys = ids.map((id) => keyById.get(id) as string);

	try {
		return await prisma.$transaction(async (tx) => {
			if (ids.length) {
				const claimed = await tx.upload.updateMany({
					where: {
						id: { in: ids },
						userId: ownerId,
						status: UploadStatus.PENDING,
					},
					data: { status: UploadStatus.ATTACHED },
				});

				if (claimed.count !== ids.length) {
					throw new AppError("Upload is no longer available", 409);
				}
			}

			return run(tx, keys);
		});
	} catch (error) {
		if (!(error instanceof AppError)) {
			await Promise.all(
				uploads.map((upload) =>
					discardUpload(upload).catch((cleanupError) =>
						console.error(
							`Failed to discard upload ${upload.id}:`,
							cleanupError,
						),
					),
				),
			);
		}
		throw error;
	}
};

interface PhotoUpdateData {
	existingPhotoKeys?: string[];
	photoUploadIds?: string[];
}

// Used when updating a listing: merges the photo keys the client wants to
// keep (verified against the listing's current photoUrls, so a client can
// never "adopt" a key that isn't already on this listing) with any newly
// attached uploads. Returns `undefined` for photoUrls when the client didn't
// touch photos at all, so the caller can leave the column untouched.
export const withMergedListingPhotos = async <T>(
	ownerId: string,
	currentPhotoUrls: string[],
	data: PhotoUpdateData,
	run: (
		tx: Prisma.TransactionClient,
		photoUrls: string[] | undefined,
	) => Promise<T>,
): Promise<T> => {
	const touchingPhotos =
		data.existingPhotoKeys !== undefined || data.photoUploadIds !== undefined;

	// The client only ever sees public URLs (from any listing GET response),
	// never the raw R2 key, so accept either form when matching against what
	// this listing actually has.
	const requestedKeep = new Set(data.existingPhotoKeys ?? []);
	const keptKeys = currentPhotoUrls.filter(
		(key) => requestedKeep.has(key) || requestedKeep.has(toPublicUrl(key)),
	);

	return withAttachedUploads(
		ownerId,
		data.photoUploadIds,
		async (tx, newKeys) => {
			if (!touchingPhotos) return run(tx, undefined);

			const merged = [...keptKeys, ...newKeys];
			if (merged.length === 0) {
				throw new AppError("A listing must have at least one photo", 400);
			}

			return run(tx, merged);
		},
	);
};

export const cleanupAbandonedUploads = async () => {
	const cutoff = new Date(Date.now() - PENDING_UPLOAD_TTL_MS);

	const abandoned = await prisma.upload.findMany({
		where: { status: UploadStatus.PENDING, createdAt: { lt: cutoff } },
		select: { id: true, key: true },
		take: CLEANUP_BATCH_SIZE,
	});

	let cleaned = 0;
	for (const upload of abandoned) {
		try {
			await discardUpload(upload);
			cleaned++;
		} catch (error) {
			console.error(`Failed to clean up upload ${upload.id}:`, error);
		}
	}

	return cleaned;
};

export const startUploadCleanupJob = () => {
	const run = async () => {
		try {
			await cleanupAbandonedUploads();
		} catch (error) {
			console.error("Upload cleanup failed:", error);
		}
	};

	run();
	setInterval(run, CLEANUP_INTERVAL_MS).unref();
};
