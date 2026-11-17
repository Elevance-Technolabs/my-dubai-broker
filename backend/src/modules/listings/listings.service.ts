import slug from "slug";
import {
	ApprovalStatus,
	AssetType,
	CompanyCategory,
	OfferingType,
	PublicationStatus,
	Prisma,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../prisma/client.js";
import { withAttachedUploads, withMergedListingPhotos } from "../uploads/uploads.service.js";
import { mapToListing } from "./listings.mapper.js";
import { AppError } from "../../utils/AppError.js";
import { sendEmail, emailTemplates } from "../../lib/email.js";

// ─── Shared include definition ───────────────────────────────

const listingIncludes = {
	realEstateListing: true,
	carListing: true,
	yachtListing: true,
	privateAviationListing: true,
	collectibleListing: true,
	availability: true,
	company: {
		select: { id: true, name: true, slug: true, companyLogoUrl: true },
	},
	creator: {
		select: { id: true, name: true, email: true, image: true },
	},
	qualitySnapshot: true,
	rankSnapshot: true,
	deletedBy: { select: { id: true, name: true } },
} satisfies Prisma.ListingInclude;

// ─── Category ↔ asset type ───────────────────────────────────

const CATEGORY_ASSET_TYPES: Record<CompanyCategory, AssetType[]> = {
	REAL_ESTATE: ["APARTMENT", "VILLA", "TOWNHOUSE", "PENTHOUSE", "OFFICE", "RETAIL", "WAREHOUSE", "LAND"],
	CARS: ["SEDAN", "SUV", "SPORTS_CAR", "CONVERTIBLE", "TRUCK", "VAN", "MOTORCYCLE"],
	YACHTS: ["MOTOR_YACHT", "SAILING_YACHT", "SUPER_YACHT", "SPEED_BOAT", "CATAMARAN"],
	PRIVATE_AVIATION: ["JET", "HELICOPTER", "TURBOPROP"],
	COLLECTIBLES: ["WATCH", "ART", "JEWELLERY", "HANDBAG", "WINE_SPIRITS", "COINS_STAMPS", "OTHER_COLLECTIBLE"],
} as Record<CompanyCategory, AssetType[]>;

const assertAssetTypeFits = (category: CompanyCategory, assetType: AssetType) => {
	if (!CATEGORY_ASSET_TYPES[category]?.includes(assetType)) {
		throw new AppError(`Asset type ${assetType} does not belong to category ${category}`, 400);
	}
};

// ─── Public Reference Generator ──────────────────────────────

const CATEGORY_PREFIX: Record<CompanyCategory, string> = {
	REAL_ESTATE: "RE",
	CARS: "CR",
	YACHTS: "YT",
	PRIVATE_AVIATION: "AV",
	COLLECTIBLES: "CL",
};

// Next number after the highest existing reference. Counting listings instead
// reused a number whenever a listing had been removed (unique-key crash).
async function generatePublicRef(category: CompanyCategory): Promise<string> {
	const prefix = `MDB-${CATEGORY_PREFIX[category] ?? "XX"}-`;
	const last = await prisma.listing.findFirst({
		where: { publicRef: { startsWith: prefix } },
		orderBy: { publicRef: "desc" },
		select: { publicRef: true },
	});
	const lastSeq = last ? Number.parseInt(last.publicRef.slice(prefix.length), 10) || 0 : 0;
	return `${prefix}${String(lastSeq + 1).padStart(5, "0")}`;
}

const isPublicRefClash = (error: unknown) =>
	error instanceof Prisma.PrismaClientKnownRequestError &&
	error.code === "P2002" &&
	JSON.stringify(error.meta ?? {}).includes("publicRef");

// ─── CREATE ──────────────────────────────────────────────────

export interface CreateListingData {
	// Core
	title: string;
	description: string;
	category: CompanyCategory;
	assetType: AssetType;
	offeringType: OfferingType;

	// Pricing
	salePrice?: number;
	annualRent?: number;
	monthlyRent?: number;
	dailyRate?: number;
	charterRate?: number;
	currency?: string;
	priceOnRequest?: boolean;
	negotiable?: boolean;

	// Location
	country?: string;
	city?: string;
	area?: string;
	address?: string;
	hideExactLocation?: boolean;
	latitude?: number;
	longitude?: number;
	operatingBase?: string;

	// Contact
	primaryEmail?: string;
	primaryPhone?: string;

	// Media
	photoUploadIds: string[];
	videoUrl?: string;
	vrTourUrl?: string;

	// Internal
	licenseNumber?: string;
	internalReferenceCode?: string;

	// Category-specific details (passed through as-is, handled per-category)
	details?: Record<string, any>;
}

export const createListing = async (
	userId: string,
	data: CreateListingData,
) => {
	// Verify the user belongs to a company
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { companyId: true, company: { select: { id: true, status: true } } },
	});

	if (!user?.companyId || !user.company) {
		throw new AppError("You must belong to an approved company to create listings.", 403);
	}

	if (user.company.status !== "APPROVED") {
		throw new AppError("Your company must be approved before you can create listings.", 403);
	}

	const companyId = user.companyId;
	assertAssetTypeFits(data.category, data.assetType);

	const create = () => withAttachedUploads(userId, data.photoUploadIds, async (tx, photoKeys) => {
		const safeSlug = slug(data.title);
		const publicRef = await generatePublicRef(data.category);

		const listingData: Prisma.ListingCreateInput = {
			title: data.title,
			slug: `${safeSlug}-${Date.now()}`,
			publicRef,
			description: data.description,
			category: data.category,
			assetType: data.assetType,
			offeringType: data.offeringType,
			currency: (data.currency as any) ?? "AED",
			priceOnRequest: data.priceOnRequest ?? false,
			negotiable: data.negotiable ?? false,
			photoUrls: photoKeys,
			videoUrl: data.videoUrl,
			vrTourUrl: data.vrTourUrl,
			country: data.country,
			city: data.city,
			area: data.area,
			address: data.address,
			hideExactLocation: data.hideExactLocation ?? false,
			latitude: data.latitude,
			longitude: data.longitude,
			operatingBase: data.operatingBase,
			primaryEmail: data.primaryEmail,
			primaryPhone: data.primaryPhone,
			licenseNumber: data.licenseNumber,
			internalReferenceCode: data.internalReferenceCode,
			approvalStatus: ApprovalStatus.DRAFT,
			publicationStatus: PublicationStatus.UNPUBLISHED,
			company: { connect: { id: companyId } },
			creator: { connect: { id: userId } },
		};

		// Set pricing fields
		if (data.salePrice != null) listingData.salePrice = new Prisma.Decimal(data.salePrice);
		if (data.annualRent != null) listingData.annualRent = new Prisma.Decimal(data.annualRent);
		if (data.monthlyRent != null) listingData.monthlyRent = new Prisma.Decimal(data.monthlyRent);
		if (data.dailyRate != null) listingData.dailyRate = new Prisma.Decimal(data.dailyRate);
		if (data.charterRate != null) listingData.charterRate = new Prisma.Decimal(data.charterRate);

		// Create listing
		const listing = await tx.listing.create({
			data: listingData,
			include: listingIncludes,
		});

		// Attach category-specific sub-record if details were provided
		if (data.details && Object.keys(data.details).length > 0) {
			await attachCategoryDetails(tx, listing.id, data.category, data.details);
		}

		// Record status history
		await tx.statusHistory.create({
			data: {
				entityType: "listing",
				entityId: listing.id,
				listingId: listing.id,
				fromStatus: "",
				toStatus: ApprovalStatus.DRAFT,
				actorId: userId,
				reason: "Listing created",
			},
		});

		return mapToListing(listing);
	});

	try {
		return await create();
	} catch (error) {
		// Two listings created at the same moment can pick the same reference;
		// the transaction rolled back, so try once more with the next number.
		if (isPublicRefClash(error)) return create();
		throw error;
	}
};

// Attaches the category-specific sub-record in the same transaction
async function attachCategoryDetails(
	tx: Prisma.TransactionClient,
	listingId: string,
	category: CompanyCategory,
	details: Record<string, any>,
) {
	// Category-specific details are validated by the caller (dynamic per-category
	// schema, see plan Section 10) — Prisma's required-field typing can't express that here.
	switch (category) {
		case CompanyCategory.REAL_ESTATE:
			await tx.realEstateListing.create({ data: { listingId, ...details } as Prisma.RealEstateListingUncheckedCreateInput });
			break;
		case CompanyCategory.CARS:
			await tx.carListing.create({ data: { listingId, ...details } as Prisma.CarListingUncheckedCreateInput });
			break;
		case CompanyCategory.YACHTS:
			await tx.yachtListing.create({ data: { listingId, ...details } as Prisma.YachtListingUncheckedCreateInput });
			break;
		case CompanyCategory.PRIVATE_AVIATION:
			await tx.privateAviationListing.create({ data: { listingId, ...details } as Prisma.PrivateAviationListingUncheckedCreateInput });
			break;
		case CompanyCategory.COLLECTIBLES:
			await tx.collectibleListing.create({ data: { listingId, ...details } as Prisma.CollectibleListingUncheckedCreateInput });
			break;
	}
}

// ─── UPDATE ──────────────────────────────────────────────────

export interface UpdateListingData extends Partial<Omit<CreateListingData, "photoUploadIds">> {
	existingPhotoKeys?: string[];
	photoUploadIds?: string[];
}

interface Requester {
	userId: string;
	companyId?: string | null;
	role?: string;
}

const isPlatformStaff = (role?: string) =>
	role === "super_admin" || role === "platform_reviewer";

// Company users may only read or act on their own company's listings.
const assertListingAccess = (
	listingCompanyId: string,
	requester: Requester,
	action: string,
) => {
	if (!isPlatformStaff(requester.role) && requester.companyId !== listingCompanyId) {
		throw new AppError(`You do not have permission to ${action} this listing`, 403);
	}
};

/** Edits to an approved listing, held until a reviewer approves them. */
export type PendingChanges = {
	data: Record<string, any>;
	/** The full photo list the edit asks for, already uploaded. */
	photoKeys?: string[];
};

/**
 * Turns an update request into the listing columns it changes (photos and
 * category details are handled by the caller).
 */
const buildListingUpdate = (category: CompanyCategory, data: UpdateListingData): Prisma.ListingUpdateInput => {
	const listingData: Prisma.ListingUpdateInput = {};
	if (data.title !== undefined) {
		listingData.title = data.title;
		listingData.slug = `${slug(data.title)}-${Date.now()}`;
	}
	if (data.description !== undefined) listingData.description = data.description;
	if (data.assetType !== undefined) {
		assertAssetTypeFits(category, data.assetType);
		listingData.assetType = data.assetType;
	}
	if (data.offeringType !== undefined) listingData.offeringType = data.offeringType;
	if (data.currency !== undefined) listingData.currency = data.currency as any;
	if (data.priceOnRequest !== undefined) listingData.priceOnRequest = data.priceOnRequest;
	if (data.negotiable !== undefined) listingData.negotiable = data.negotiable;
	// A listing has one active price. When an update supplies any price
	// field, clear the others so e.g. a sale→charter switch doesn't leave
	// the old salePrice behind (it would win in every price display).
	const priceFields = ["salePrice", "annualRent", "monthlyRent", "dailyRate", "charterRate"] as const;
	if (priceFields.some((f) => data[f] != null)) {
		for (const f of priceFields) {
			listingData[f] = data[f] != null ? new Prisma.Decimal(data[f]) : null;
		}
	}
	if (data.country !== undefined) listingData.country = data.country;
	if (data.city !== undefined) listingData.city = data.city;
	if (data.area !== undefined) listingData.area = data.area;
	if (data.address !== undefined) listingData.address = data.address;
	if (data.hideExactLocation !== undefined) listingData.hideExactLocation = data.hideExactLocation;
	if (data.latitude !== undefined) listingData.latitude = data.latitude;
	if (data.longitude !== undefined) listingData.longitude = data.longitude;
	if (data.operatingBase !== undefined) listingData.operatingBase = data.operatingBase;
	if (data.primaryEmail !== undefined) listingData.primaryEmail = data.primaryEmail;
	if (data.primaryPhone !== undefined) listingData.primaryPhone = data.primaryPhone;
	if (data.videoUrl !== undefined) listingData.videoUrl = data.videoUrl;
	if (data.vrTourUrl !== undefined) listingData.vrTourUrl = data.vrTourUrl;
	if (data.licenseNumber !== undefined) listingData.licenseNumber = data.licenseNumber;
	if (data.internalReferenceCode !== undefined) listingData.internalReferenceCode = data.internalReferenceCode;
	return listingData;
};

/**
 * Edits a listing. Changes to an approved listing made by its company don't
 * go live straight away: they are held as pending changes for a reviewer,
 * and the live version stays as it is until they are approved. Anything not
 * yet approved (drafts, changes required, under review) is edited directly.
 */
export const updateListing = async (id: string, data: UpdateListingData, requester: Requester) => {
	const existing = await prisma.listing.findUnique({
		where: { id },
		select: {
			id: true,
			title: true,
			companyId: true,
			category: true,
			photoUrls: true,
			publicationStatus: true,
			approvalStatus: true,
			assignedReviewerId: true,
			pendingChanges: true,
		},
	});
	if (!existing) throw new AppError("Listing not found", 404);
	assertNotDeleted(existing);

	if (requester.role !== "super_admin" && requester.companyId !== existing.companyId) {
		throw new AppError("You do not have permission to update this listing", 403);
	}

	const holdForReview = existing.approvalStatus === ApprovalStatus.APPROVED && !isPlatformStaff(requester.role);
	if (holdForReview) buildListingUpdate(existing.category, data); // validate now, apply on approval

	const result = await withMergedListingPhotos(requester.userId, existing.photoUrls, data, async (tx, photoKeys) => {
		if (holdForReview) {
			const previous = (existing.pendingChanges as PendingChanges | null) ?? null;
			const { existingPhotoKeys: _keep, photoUploadIds: _new, details, ...fields } = data;
			const next: PendingChanges = {
				data: {
					...(previous?.data ?? {}),
					...fields,
					...(details || previous?.data?.details ? { details: { ...(previous?.data?.details ?? {}), ...(details ?? {}) } } : {}),
				},
				...(photoKeys ?? previous?.photoKeys ? { photoKeys: photoKeys ?? previous?.photoKeys } : {}),
			};
			await tx.listing.update({
				where: { id },
				data: {
					pendingChanges: JSON.parse(JSON.stringify(next)) as Prisma.InputJsonValue,
					pendingChangesAt: new Date(),
					pendingChangesById: requester.userId,
				},
			});
			await tx.statusHistory.create({
				data: {
					entityType: "listing",
					entityId: id,
					listingId: id,
					fromStatus: "changes",
					toStatus: "PENDING",
					actorId: requester.userId,
					reason: "Changes submitted for review. The live version stays as it is until they are approved.",
				},
			});
		} else {
			const listingData = buildListingUpdate(existing.category, data);
			if (photoKeys) listingData.photoUrls = photoKeys;
			if (Object.keys(listingData).length > 0) {
				await tx.listing.update({ where: { id }, data: listingData });
			}
			if (data.details && Object.keys(data.details).length > 0) {
				await upsertCategoryDetails(tx, id, existing.category, data.details);
			}
		}
		const updated = await tx.listing.findUniqueOrThrow({ where: { id }, include: listingIncludes });
		return mapToListing(updated);
	});

	if (holdForReview) {
		await notifyReviewers(existing, "changes", requester.userId).catch((error) =>
			console.error(`Reviewer notification failed for listing ${id}:`, error),
		);
	}
	return result;
};

// Updates (or creates, if missing) the category-specific sub-record — same
// "trust the caller's per-category validation" contract as attachCategoryDetails.
// Not a Prisma upsert: that validates the create half too, so a partial
// update (e.g. only bedrooms) would fail for lack of the required fields.
async function upsertCategoryDetails(
	tx: Prisma.TransactionClient,
	listingId: string,
	category: CompanyCategory,
	details: Record<string, any>,
) {
	const model = {
		[CompanyCategory.REAL_ESTATE]: tx.realEstateListing,
		[CompanyCategory.CARS]: tx.carListing,
		[CompanyCategory.YACHTS]: tx.yachtListing,
		[CompanyCategory.PRIVATE_AVIATION]: tx.privateAviationListing,
		[CompanyCategory.COLLECTIBLES]: tx.collectibleListing,
	}[category] as unknown as {
		findUnique: (args: any) => Promise<unknown>;
		update: (args: any) => Promise<unknown>;
		create: (args: any) => Promise<unknown>;
	};
	if (!model) return;
	const existing = await model.findUnique({ where: { listingId }, select: { id: true } });
	if (existing) await model.update({ where: { listingId }, data: details });
	else await model.create({ data: { listingId, ...details } });
}

// ─── READ ────────────────────────────────────────────────────

export const getListings = async (
	page = 1,
	limit = 10,
	filters: {
		companyId?: string;
		creatorId?: string;
		approvalStatus?: ApprovalStatus;
		publicationStatus?: PublicationStatus;
		category?: CompanyCategory;
		search?: string;
	} = {},
) => {
	const skip = (page - 1) * limit;

	const where: Prisma.ListingWhereInput = {
		...(filters.companyId ? { companyId: filters.companyId } : {}),
		...(filters.creatorId ? { creatorId: filters.creatorId } : {}),
		...(filters.approvalStatus ? { approvalStatus: filters.approvalStatus } : {}),
		...(filters.publicationStatus ? { publicationStatus: filters.publicationStatus } : {}),
		...(filters.category ? { category: filters.category } : {}),
		...(filters.search
			? {
					OR: [
						{ title: { contains: filters.search, mode: "insensitive" } },
						{ publicRef: { contains: filters.search, mode: "insensitive" } },
						{ company: { name: { contains: filters.search, mode: "insensitive" } } },
					],
				}
			: {}),
	};

	const [listings, total] = await Promise.all([
		prisma.listing.findMany({
			where,
			include: listingIncludes,
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.listing.count({ where }),
	]);

	return {
		listings: listings.map(mapToListing),
		pagination: {
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	};
};

export const getCompanyListings = async (
	companyId: string,
	page = 1,
	limit = 10,
	filters: {
		approvalStatus?: ApprovalStatus;
		publicationStatus?: PublicationStatus;
		category?: CompanyCategory;
		creatorId?: string;
	} = {},
) => {
	return getListings(page, limit, { companyId, ...filters });
};

export const getMyListings = async (
	userId: string,
	page = 1,
	limit = 10,
) => {
	return getListings(page, limit, { creatorId: userId });
};

export const getAdminListings = async (
	page = 1,
	limit = 10,
	filters: {
		approvalStatus?: ApprovalStatus;
		publicationStatus?: PublicationStatus;
		category?: CompanyCategory;
		companyId?: string;
		search?: string;
	} = {},
) => {
	return getListings(page, limit, filters);
};

export const getListingById = async (id: string, requester: Requester, { withPending = false } = {}) => {
	const listing = await prisma.listing.findUnique({
		where: { id },
		include: listingIncludes,
	});
	if (!listing) return null;
	assertListingAccess(listing.companyId, requester, "view");
	// withPending: as it will look once its pending changes are approved
	// (the edit form starts from there).
	return mapToListing(withPending ? withPendingApplied(listing) : listing);
};

export const getPublicListings = async (
	page = 1,
	limit = 10,
	filters: { category?: CompanyCategory; excludeId?: string } = {},
) => {
	const skip = (page - 1) * limit;

	const where: Prisma.ListingWhereInput = {
		approvalStatus: ApprovalStatus.APPROVED,
		publicationStatus: PublicationStatus.LIVE,
		...(filters.category ? { category: filters.category } : {}),
		...(filters.excludeId ? { id: { not: filters.excludeId } } : {}),
	};

	const [listings, total] = await Promise.all([
		prisma.listing.findMany({
			where,
			include: listingIncludes,
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.listing.count({ where }),
	]);

	return {
		listings: listings.map(mapToListing),
		pagination: {
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	};
};

export const getPublicListingById = async (id: string) => {
	const listing = await prisma.listing.findFirst({
		where: {
			id,
			approvalStatus: ApprovalStatus.APPROVED,
			publicationStatus: PublicationStatus.LIVE,
		},
		include: listingIncludes,
	});
	if (!listing) return null;
	return mapToListing(listing);
};

// ─── STATUS TRANSITIONS ──────────────────────────────────────

export const updateApprovalStatus = async (
	listingId: string,
	status: ApprovalStatus,
	actorId: string,
	options: {
		rejectionReason?: string;
		internalNote?: string;
		reason?: string;
	} = {},
) => {
	const listing = await prisma.listing.findUnique({ where: { id: listingId } });
	if (!listing) throw new AppError("Listing not found", 404);
	assertNotDeleted(listing);

	if (
		(status === ApprovalStatus.REJECTED || status === ApprovalStatus.CHANGES_REQUIRED) &&
		!options.reason &&
		!options.rejectionReason
	) {
		throw new AppError(`A reason is required when setting status to ${status}`, 400);
	}

	const previousStatus = listing.approvalStatus;
	const partnerReason = options.rejectionReason ?? options.reason;

	const { updated, creator } = await prisma.$transaction(async (tx) => {
		// Update listing
		const updatedListing = await tx.listing.update({
			where: { id: listingId },
			data: {
				approvalStatus: status,
				adminRejectionReason:
					status === ApprovalStatus.REJECTED || status === ApprovalStatus.CHANGES_REQUIRED
						? partnerReason
						: listing.adminRejectionReason,
				reviewedAt: new Date(),
				reviewedById: actorId,
				// Auto-publish when approved by admin
				...(status === ApprovalStatus.APPROVED
					? { publicationStatus: PublicationStatus.LIVE, publishedAt: new Date() }
					: {}),
			},
			include: listingIncludes,
		});

		// Record status history
		await tx.statusHistory.create({
			data: {
				entityType: "listing",
				entityId: listingId,
				listingId,
				fromStatus: previousStatus,
				toStatus: status,
				actorId,
				reason: options.reason ?? options.rejectionReason,
			},
		});

		// Write audit log for admin actions
		if (
			status === ApprovalStatus.APPROVED ||
			status === ApprovalStatus.REJECTED ||
			status === ApprovalStatus.CHANGES_REQUIRED
		) {
			// The reviewer's decision, with the internal note kept apart from
			// the reason the partner sees.
			await tx.approvalReview.create({
				data: {
					listingId,
					reviewerId: actorId,
					decision: status,
					internalNote: options.internalNote,
					partnerReason,
				},
			});
			if (options.internalNote?.trim()) {
				await tx.reviewNote.create({
					data: {
						entityType: "listing",
						listingId,
						authorId: actorId,
						body: options.internalNote.trim(),
						isInternal: true,
					},
				});
			}
			// A newly approved listing starts with confirmed availability.
			if (status === ApprovalStatus.APPROVED) {
				const now = new Date();
				await tx.availability.upsert({
					where: { listingId },
					update: {},
					create: {
						listingId,
						isAvailable: true,
						confirmedAt: now,
						nextConfirmDue: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
					},
				});
			}

			await tx.auditLog.create({
				data: {
					actorId,
					companyId: listing.companyId,
					action: `listing.approval.${status.toLowerCase()}`,
					entityType: "listing",
					entityId: listingId,
					previousValue: { approvalStatus: previousStatus },
					newValue: { approvalStatus: status },
					reason: options.reason ?? options.rejectionReason ?? options.internalNote,
				},
			});
		}

		const creator = await tx.user.findUnique({
			where: { id: listing.creatorId },
			select: { id: true, email: true },
		});

		return { updated: updatedListing, creator };
	});

	const NOTIFICATION_CONFIG: Partial<
		Record<ApprovalStatus, { priority: string; type: string; title: string; body: string }>
	> = {
		[ApprovalStatus.APPROVED]: {
			priority: "INFORMATION",
			type: "listing_approved",
			title: "Listing Approved",
			body: `Your listing "${listing.title}" is now live.`,
		},
		[ApprovalStatus.CHANGES_REQUIRED]: {
			priority: "ACTION_NEEDED",
			type: "listing_changes_required",
			title: "Changes Required",
			body: options.rejectionReason ?? options.reason ?? "Please review and update your listing.",
		},
		[ApprovalStatus.REJECTED]: {
			priority: "URGENT",
			type: "listing_rejected",
			title: "Listing Rejected",
			body: options.rejectionReason ?? options.reason ?? "Your listing was not approved.",
		},
	};

	const cfg = NOTIFICATION_CONFIG[status];
	if (cfg && creator) {
		await prisma.notification.create({
			data: {
				userId: creator.id,
				priority: cfg.priority as any,
				type: cfg.type,
				title: cfg.title,
				body: cfg.body,
				actionUrl: `/listings/${listingId}`,
			},
		});

		const { subject, html } = emailTemplates.listingStatusChanged({
			listingTitle: listing.title,
			status,
			reason: cfg.body,
		});
		await sendEmail({ to: creator.email, subject, html });
	}

	return mapToListing(updated);
};

type ReviewKind = "submitted" | "resubmitted" | "changes" | "republish" | "relist";

const REVIEW_MESSAGES: Record<ReviewKind, { type: string; title: string; body: (title: string, from: string, company: string) => string }> = {
	submitted: {
		type: "listing_submitted",
		title: "New listing to review",
		body: (t, from) => `"${t}" was submitted${from} and is waiting for review.`,
	},
	resubmitted: {
		type: "listing_resubmitted",
		title: "Listing updated and resubmitted",
		body: (t, from) => `"${t}" was updated${from} after your change request. Please review it again.`,
	},
	changes: {
		type: "listing_changes_submitted",
		title: "Changes to a live listing",
		body: (t, from) =>
			`"${t}" was edited${from}. Please review the changes; the current version stays as it is until you approve them.`,
	},
	republish: {
		type: "listing_republish_requested",
		title: "Listing to publish again",
		body: (t, _from, company) => `${company} asks to publish "${t}" again after unpublishing it. Please review it.`,
	},
	relist: {
		type: "listing_relist_requested",
		title: "Sold-out listing to relist",
		body: (t, _from, company) => `${company} asks to list "${t}" again after it was sold out. Please review it.`,
	},
};

/**
 * Tells platform staff a listing needs review: the assigned reviewer if there
 * is one, otherwise every active super admin and reviewer.
 */
const notifyReviewers = async (
	listing: { id: string; title: string; assignedReviewerId: string | null; companyId: string },
	kind: ReviewKind,
	submittedById: string,
) => {
	const company = await prisma.company.findUnique({ where: { id: listing.companyId }, select: { name: true } });
	let recipients: string[] = [];
	if (listing.assignedReviewerId) {
		const reviewer = await prisma.user.findFirst({
			where: { id: listing.assignedReviewerId, banned: { not: true } },
			select: { id: true },
		});
		if (reviewer) recipients = [reviewer.id];
	}
	if (recipients.length === 0) {
		// Nobody assigned yet: super admins assign it, so they are the ones told.
		const staff = await prisma.user.findMany({
			where: { role: "super_admin", banned: { not: true } },
			select: { id: true },
		});
		recipients = staff.map((u) => u.id);
	}
	recipients = recipients.filter((id) => id !== submittedById);
	if (recipients.length === 0) return;

	const msg = REVIEW_MESSAGES[kind];
	const from = company?.name ? ` by ${company.name}` : "";
	await prisma.notification.createMany({
		data: recipients.map((userId) => ({
			userId,
			priority: "ACTION_NEEDED" as const,
			type: msg.type,
			title: msg.title,
			body: msg.body(listing.title, from, company?.name ?? "The company"),
			actionUrl: `/admin/listing-approvals?listing=${listing.id}`,
		})),
	});
};

/** Tells every active super admin about a change to a listing's status. */
const notifySuperAdmins = async (
	listing: { id: string; title: string; companyId: string },
	type: string,
	title: string,
	body: (companyName: string) => string,
) => {
	const [company, admins] = await Promise.all([
		prisma.company.findUnique({ where: { id: listing.companyId }, select: { name: true } }),
		prisma.user.findMany({ where: { role: "super_admin", banned: { not: true } }, select: { id: true } }),
	]);
	if (admins.length === 0) return;
	await prisma.notification.createMany({
		data: admins.map((a) => ({
			userId: a.id,
			priority: "INFORMATION" as const,
			type,
			title,
			body: body(company?.name ?? "The company"),
			actionUrl: `/admin/listings?listing=${listing.id}`,
		})),
	});
};

/** Tells the listing's creator about a reviewer decision on their changes. */
const notifyCreator = async (
	listing: { id: string; creatorId: string },
	type: string,
	title: string,
	body: string,
	priority: "INFORMATION" | "ACTION_NEEDED" | "URGENT" = "INFORMATION",
) => {
	await prisma.notification.create({
		data: { userId: listing.creatorId, priority, type, title, body, actionUrl: `/listings/${listing.id}` },
	});
};

const loadForCompanyAction = async (listingId: string, requester: Requester, action: string) => {
	const listing = await prisma.listing.findUnique({ where: { id: listingId } });
	if (!listing) throw new AppError("Listing not found", 404);
	if (isPlatformStaff(requester.role) || requester.companyId !== listing.companyId) {
		throw new AppError(`You do not have permission to ${action} this listing`, 403);
	}
	assertNotDeleted(listing);
	return listing;
};

const recordPublicationChange = async (
	listing: { id: string; companyId: string; publicationStatus: PublicationStatus },
	to: PublicationStatus,
	actorId: string,
	reason: string,
	action: string,
) => {
	await prisma.$transaction([
		prisma.listing.update({ where: { id: listing.id }, data: { publicationStatus: to } }),
		prisma.statusHistory.create({
			data: {
				entityType: "listing",
				entityId: listing.id,
				listingId: listing.id,
				fromStatus: listing.publicationStatus,
				toStatus: to,
				actorId,
				reason,
			},
		}),
		prisma.auditLog.create({
			data: {
				actorId,
				companyId: listing.companyId,
				action,
				entityType: "listing",
				entityId: listing.id,
				previousValue: { publicationStatus: listing.publicationStatus },
				newValue: { publicationStatus: to },
				reason,
			},
		}),
	]);
};

/** Takes a live listing off the website. It can be published again (after review). */
export const unpublishListing = async (listingId: string, requester: Requester, reason?: string) => {
	const listing = await loadForCompanyAction(listingId, requester, "unpublish");
	if (listing.approvalStatus !== ApprovalStatus.APPROVED || !["LIVE", "PAUSED"].includes(listing.publicationStatus)) {
		throw new AppError("Only a live listing can be unpublished.", 400);
	}
	const note = reason?.trim();
	await recordPublicationChange(
		listing,
		PublicationStatus.UNPUBLISHED,
		requester.userId,
		note ? `Unpublished: ${note}` : "Unpublished by the company",
		"listing.unpublished",
	);
	await notifySuperAdmins(listing, "listing_unpublished", "Listing unpublished", (c) =>
		`${c} unpublished "${listing.title}". It is no longer on the website.${note ? ` Reason: ${note}` : ""}`,
	).catch((e) => console.error("Unpublish notification failed:", e));
};

/** Marks a listing as sold out; it leaves the website. It can be relisted (after review). */
export const markListingSoldOut = async (listingId: string, requester: Requester, reason?: string) => {
	const listing = await loadForCompanyAction(listingId, requester, "update");
	if (listing.approvalStatus !== ApprovalStatus.APPROVED || !["LIVE", "PAUSED", "UNPUBLISHED"].includes(listing.publicationStatus)) {
		throw new AppError("Only an approved listing can be marked as sold out.", 400);
	}
	const note = reason?.trim();
	await recordPublicationChange(
		listing,
		PublicationStatus.SOLD_OUT,
		requester.userId,
		note ? `Marked as sold out: ${note}` : "Marked as sold out",
		"listing.sold_out",
	);
	await notifySuperAdmins(listing, "listing_sold_out", "Listing sold out", (c) =>
		`${c} marked "${listing.title}" as sold out. It is no longer on the website.${note ? ` Note: ${note}` : ""}`,
	).catch((e) => console.error("Sold-out notification failed:", e));
};

/**
 * Asks to put an unpublished or sold-out listing back on the website. It goes
 * to review first and only goes live once a reviewer approves it.
 */
export const requestRepublish = async (listingId: string, requester: Requester) => {
	const listing = await loadForCompanyAction(listingId, requester, "publish");
	if (listing.approvalStatus !== ApprovalStatus.APPROVED || !["UNPUBLISHED", "SOLD_OUT", "PAUSED"].includes(listing.publicationStatus)) {
		throw new AppError("Only an unpublished or sold-out listing can be published again.", 400);
	}
	const kind: ReviewKind = listing.publicationStatus === PublicationStatus.SOLD_OUT ? "relist" : "republish";
	await prisma.$transaction([
		prisma.listing.update({
			where: { id: listingId },
			data: { approvalStatus: ApprovalStatus.SUBMITTED, submittedAt: new Date() },
		}),
		prisma.statusHistory.create({
			data: {
				entityType: "listing",
				entityId: listingId,
				listingId,
				fromStatus: ApprovalStatus.APPROVED,
				toStatus: ApprovalStatus.SUBMITTED,
				actorId: requester.userId,
				reason: kind === "relist" ? "Asked to relist after sold out" : "Asked to publish again",
			},
		}),
	]);
	await notifyReviewers(listing, kind, requester.userId).catch((e) => console.error("Republish notification failed:", e));
	const updated = await prisma.listing.findUniqueOrThrow({ where: { id: listingId }, include: listingIncludes });
	return mapToListing(updated);
};

/** A reviewer approves pending changes: they replace the live version. */
export const approvePendingChanges = async (listingId: string, actorId: string, note?: string) => {
	const listing = await prisma.listing.findUnique({ where: { id: listingId } });
	if (!listing) throw new AppError("Listing not found", 404);
	assertNotDeleted(listing);
	const pending = listing.pendingChanges as PendingChanges | null;
	if (!pending || !listing.pendingChangesAt) throw new AppError("This listing has no changes waiting for review.", 400);

	await prisma.$transaction(async (tx) => {
		const listingData = buildListingUpdate(listing.category, pending.data as UpdateListingData);
		if (pending.photoKeys?.length) listingData.photoUrls = pending.photoKeys;
		listingData.pendingChanges = Prisma.DbNull;
		listingData.pendingChangesAt = null;
		listingData.pendingChangesById = null;
		await tx.listing.update({ where: { id: listingId }, data: listingData });
		const details = pending.data?.details;
		if (details && Object.keys(details).length > 0) {
			await upsertCategoryDetails(tx, listingId, listing.category, details);
		}
		await tx.statusHistory.create({
			data: {
				entityType: "listing",
				entityId: listingId,
				listingId,
				fromStatus: "changes",
				toStatus: "APPROVED",
				actorId,
				reason: note?.trim() ? `Changes approved: ${note.trim()}` : "Changes approved and now live",
			},
		});
		await tx.auditLog.create({
			data: {
				actorId,
				companyId: listing.companyId,
				action: "listing.changes_approved",
				entityType: "listing",
				entityId: listingId,
				newValue: JSON.parse(JSON.stringify(pending)) as Prisma.InputJsonValue,
				reason: note?.trim() || undefined,
			},
		});
	});
	await notifyCreator(
		listing,
		"listing_changes_approved",
		"Changes approved",
		`Your changes to "${listing.title}" were approved${listing.publicationStatus === "LIVE" ? " and are now live" : ""}.${note?.trim() ? ` ${note.trim()}` : ""}`,
	).catch((e) => console.error("Changes-approved notification failed:", e));
};

/** A reviewer rejects pending changes: they are discarded, the live version stays. */
export const rejectPendingChanges = async (listingId: string, actorId: string, reason: string) => {
	if (!reason?.trim()) throw new AppError("A reason is required to reject changes.", 400);
	const listing = await prisma.listing.findUnique({ where: { id: listingId } });
	if (!listing) throw new AppError("Listing not found", 404);
	if (!listing.pendingChangesAt) throw new AppError("This listing has no changes waiting for review.", 400);

	await prisma.$transaction([
		prisma.listing.update({
			where: { id: listingId },
			data: { pendingChanges: Prisma.DbNull, pendingChangesAt: null, pendingChangesById: null },
		}),
		prisma.statusHistory.create({
			data: {
				entityType: "listing",
				entityId: listingId,
				listingId,
				fromStatus: "changes",
				toStatus: "REJECTED",
				actorId,
				reason: `Changes not approved: ${reason.trim()}`,
			},
		}),
		prisma.auditLog.create({
			data: {
				actorId,
				companyId: listing.companyId,
				action: "listing.changes_rejected",
				entityType: "listing",
				entityId: listingId,
				previousValue: JSON.parse(JSON.stringify(listing.pendingChanges)) as Prisma.InputJsonValue,
				reason: reason.trim(),
			},
		}),
	]);
	await notifyCreator(
		listing,
		"listing_changes_rejected",
		"Changes not approved",
		`Your changes to "${listing.title}" were not approved, so the listing stays as it was. Reason: ${reason.trim()}`,
		"ACTION_NEEDED",
	).catch((e) => console.error("Changes-rejected notification failed:", e));
};

/**
 * The listing as it will look once its pending changes are approved; used to
 * pre-fill the edit form so a second edit continues from the first.
 */
const withPendingApplied = <T extends Record<string, any>>(listing: T): T => {
	const pending = listing.pendingChanges as PendingChanges | null;
	if (!pending) return listing;
	const { details, ...fields } = pending.data ?? {};
	const merged: Record<string, any> = { ...listing };
	const priceFields = ["salePrice", "annualRent", "monthlyRent", "dailyRate", "charterRate"];
	if (priceFields.some((f) => fields[f] != null)) for (const f of priceFields) merged[f] = fields[f] ?? null;
	for (const [k, v] of Object.entries(fields)) if (!priceFields.includes(k)) merged[k] = v;
	if (pending.photoKeys?.length) merged.photoUrls = pending.photoKeys;
	if (details) {
		const key = {
			REAL_ESTATE: "realEstateListing",
			CARS: "carListing",
			YACHTS: "yachtListing",
			PRIVATE_AVIATION: "privateAviationListing",
			COLLECTIBLES: "collectibleListing",
		}[listing.category as string];
		if (key) merged[key] = { ...(listing[key] ?? {}), ...details };
	}
	return merged as T;
};

export const submitListing = async (listingId: string, requester: Requester) => {
	const actorId = requester.userId;
	const listing = await prisma.listing.findUnique({ where: { id: listingId } });
	if (!listing) throw new AppError("Listing not found", 404);
	assertListingAccess(listing.companyId, requester, "submit");
	assertNotDeleted(listing);

	if (listing.approvalStatus !== ApprovalStatus.DRAFT &&
		listing.approvalStatus !== ApprovalStatus.CHANGES_REQUIRED) {
		throw new AppError(
			`Cannot submit a listing with status: ${listing.approvalStatus}`,
			400,
		);
	}

	const updated = await prisma.$transaction(async (tx) => {
		const updatedListing = await tx.listing.update({
			where: { id: listingId },
			data: {
				approvalStatus: ApprovalStatus.SUBMITTED,
				submittedAt: new Date(),
			},
			include: listingIncludes,
		});

		await tx.statusHistory.create({
			data: {
				entityType: "listing",
				entityId: listingId,
				listingId,
				fromStatus: listing.approvalStatus,
				toStatus: ApprovalStatus.SUBMITTED,
				actorId,
				reason:
					listing.approvalStatus === ApprovalStatus.CHANGES_REQUIRED
						? "Updated and resubmitted for review"
						: "Submitted for platform review",
			},
		});

		return updatedListing;
	});

	// A failed notification must not fail the partner's submission.
	await notifyReviewers(listing, listing.approvalStatus === ApprovalStatus.CHANGES_REQUIRED ? "resubmitted" : "submitted", actorId).catch(
		(error) => console.error(`Reviewer notification failed for listing ${listingId}:`, error),
	);

	return mapToListing(updated);
};

export const pauseListing = async (listingId: string, requester: Requester) => {
	const actorId = requester.userId;
	const listing = await prisma.listing.findUnique({ where: { id: listingId } });
	if (!listing) throw new AppError("Listing not found", 404);
	assertListingAccess(listing.companyId, requester, "pause");

	if (listing.publicationStatus !== PublicationStatus.LIVE) {
		throw new AppError("Only live listings can be paused", 400);
	}

	await prisma.listing.update({
		where: { id: listingId },
		data: { publicationStatus: PublicationStatus.PAUSED },
	});

	await prisma.statusHistory.create({
		data: {
			entityType: "listing",
			entityId: listingId,
			listingId,
			fromStatus: PublicationStatus.LIVE,
			toStatus: PublicationStatus.PAUSED,
			actorId,
		},
	});
};

/**
 * Deletes a listing for the company: it leaves the website, search, the
 * approval queue and every active list, but the record, its history, leads
 * and statistics are kept so it still shows in the company's history.
 */
export const deleteListing = async (listingId: string, requester: Requester, reason?: string) => {
	const actorId = requester.userId;
	const listing = await prisma.listing.findUnique({ where: { id: listingId } });
	if (!listing) throw new AppError("Listing not found", 404);
	if (isPlatformStaff(requester.role) || requester.companyId !== listing.companyId) {
		throw new AppError("You do not have permission to delete this listing", 403);
	}
	if (listing.publicationStatus === PublicationStatus.DELETED) {
		throw new AppError("This listing has already been deleted.", 400);
	}
	const note = reason?.trim() || undefined;

	await prisma.$transaction(async (tx) => {
		await tx.listing.update({
			where: { id: listingId },
			data: { publicationStatus: PublicationStatus.DELETED, deletedAt: new Date(), deletedById: actorId },
		});
		await tx.statusHistory.create({
			data: {
				entityType: "listing",
				entityId: listingId,
				listingId,
				fromStatus: listing.publicationStatus,
				toStatus: PublicationStatus.DELETED,
				actorId,
				reason: note ? `Listing deleted: ${note}` : "Listing deleted",
			},
		});
		await tx.auditLog.create({
			data: {
				actorId,
				companyId: listing.companyId,
				action: "listing.deleted",
				entityType: "listing",
				entityId: listingId,
				previousValue: { publicationStatus: listing.publicationStatus, approvalStatus: listing.approvalStatus },
				newValue: { publicationStatus: PublicationStatus.DELETED },
				reason: note,
			},
		});
	});
};

/** Deleted listings are kept read-only as history. */
export const assertNotDeleted = (listing: { publicationStatus: PublicationStatus }) => {
	if (listing.publicationStatus === PublicationStatus.DELETED) {
		throw new AppError("This listing has been deleted and can no longer be changed.", 400);
	}
};

// Legacy alias — kept for backward compatibility with older routes
export const updateListingStatus = updateApprovalStatus;
