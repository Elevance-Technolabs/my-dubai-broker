import { z } from "zod";
import { photoUploadIdsSchema } from "../uploads/uploads.validation.js";
import { Currency, ApprovalStatus } from "../../../generated/prisma/enums.js";

export const createCarSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1),
	price: z.number().positive(),
	currency: z
		.enum(Object.entries(Currency).map(([, value]) => value))
		.optional(),
	photoUploadIds: photoUploadIdsSchema,
	videoUrl: z.string().optional(),
	qualityNarrative: z.string().min(1),
	internalReferenceCode: z.string().optional(),
	licenseNumber: z.string().optional(),
	primaryEmail: z.string().email(),
	primaryPhone: z.string().min(1),

	brand: z.string().min(1),
	model: z.string().min(1),
	year: z
		.number()
		.int()
		.min(1900)
		.max(new Date().getFullYear() + 1),
	variant: z.string().optional(),
	mileage: z.number().int().min(0),
	condition: z.string().min(1),
	transmission: z.string().min(1),
	engineSize: z.string().optional(),
	horsepower: z.number().int().optional(),
	color: z.string().min(1),
	interiorColor: z.string().optional(),
	warranty: z.boolean().optional(),
	options: z.array(z.string()).optional(),
	negotiable: z.boolean().optional(),
});

export const updateCarSchema = createCarSchema
	.omit({ photoUploadIds: true })
	.partial()
	.extend({
		photoUploadIds: z.array(z.string().uuid()).max(10).optional(),
		existingPhotoKeys: z.array(z.string()).max(10).optional(),
		status: z
			.enum(Object.values(ApprovalStatus) as [string, ...string[]])
			.optional(),
		adminRejectionReason: z.string().optional(),
	});

export const getCarsQuerySchema = z.object({
	page: z
		.string()
		.optional()
		.transform((val) => (val ? Number(val) : 1)),
	limit: z
		.string()
		.optional()
		.transform((val) => (val ? Number(val) : 10)),
});
