import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env.js";

export const PRESIGN_EXPIRES_IN_SECONDS = 300;

const r2 = new S3Client({
	region: "auto",
	endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	},
	requestChecksumCalculation: "WHEN_REQUIRED",
	responseChecksumValidation: "WHEN_REQUIRED",
});

export const createPresignedPutUrl = (
	key: string,
	contentType: string,
	size: number,
) =>
	getSignedUrl(
		r2,
		new PutObjectCommand({
			Bucket: env.R2_BUCKET_NAME,
			Key: key,
			ContentType: contentType,
			ContentLength: size,
		}),
		{ expiresIn: PRESIGN_EXPIRES_IN_SECONDS },
	);

export const headObject = async (key: string) => {
	try {
		const result = await r2.send(
			new HeadObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }),
		);
		return {
			size: result.ContentLength,
			contentType: result.ContentType,
		};
	} catch (error: any) {
		if (
			error?.name === "NotFound" ||
			error?.$metadata?.httpStatusCode === 404
		) {
			return null;
		}
		throw error;
	}
};

export const deleteObject = async (key: string) => {
	await r2.send(
		new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }),
	);
};

const DOCUMENT_URL_EXPIRES_IN_SECONDS = 3600;

const isAbsoluteUrl = (value: string) => /^(https?:|data:)/.test(value);

export const toPublicUrl = (keyOrUrl: string) =>
	isAbsoluteUrl(keyOrUrl)
		? keyOrUrl
		: `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${keyOrUrl}`;

export const createPresignedGetUrl = (keyOrUrl: string) =>
	isAbsoluteUrl(keyOrUrl)
		? Promise.resolve(keyOrUrl)
		: getSignedUrl(
				r2,
				new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: keyOrUrl }),
				{ expiresIn: DOCUMENT_URL_EXPIRES_IN_SECONDS },
			);
