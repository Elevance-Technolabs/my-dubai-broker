import { z } from "zod";

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_CONTENT_TYPES = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
} as const;

export const ALLOWED_CONTENT_TYPES = {
	...ALLOWED_IMAGE_CONTENT_TYPES,
	"application/pdf": "pdf",
} as const;

export const UPLOAD_CONTEXTS = [
	"listing-photo",
	"company-logo",
	"company-cover",
	"company-listing-logo",
	"company-document",
	"product-image",
] as const;

export type UploadContext = (typeof UPLOAD_CONTEXTS)[number];

const createPresignSchema = (
	allowedTypes: Record<string, string>,
	typeMessage: string,
) =>
	z.object({
		fileName: z.string().min(1).max(255),
		contentType: z.enum(Object.keys(allowedTypes) as [string, ...string[]], {
			message: typeMessage,
		}),
		size: z
			.number()
			.int()
			.positive()
			.max(MAX_UPLOAD_SIZE, { message: "File must be 5 MB or smaller" }),
		uploadContext: z.enum(UPLOAD_CONTEXTS).optional(),
	});

// Signed-in uploads are images, except company documents (a registration
// resubmitted after changes were requested), which may also be PDFs.
export const presignUploadSchema = createPresignSchema(
	ALLOWED_CONTENT_TYPES,
	"Only JPEG, PNG, WebP images and PDF files are allowed",
).refine((d) => d.contentType !== "application/pdf" || d.uploadContext === "company-document", {
	message: "Only JPEG, PNG and WebP images are allowed",
	path: ["contentType"],
});

export const presignDocumentUploadSchema = createPresignSchema(
	ALLOWED_CONTENT_TYPES,
	"Only JPEG, PNG, WebP images and PDF files are allowed",
);

/** Every listing needs at least this many photos (the first one is the cover). */
export const MIN_LISTING_PHOTOS = 5;
export const MAX_LISTING_PHOTOS = 30;

export const photoUploadIdsSchema = z.array(z.string().uuid()).min(1).max(10);
