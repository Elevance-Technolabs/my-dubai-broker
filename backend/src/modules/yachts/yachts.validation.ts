import { z } from "zod";
import { photoUploadIdsSchema } from "../uploads/uploads.validation.js";
import { Currency, ApprovalStatus } from "../../../generated/prisma/enums.js";

export const createYachtSchema = z.object({
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

	yachtType: z.string().min(1),
	year: z
		.number()
		.int()
		.min(1900)
		.max(new Date().getFullYear() + 5), // Allow slight future years for off-plan/new builds
	make: z.string().min(1),
	length: z.number().positive(),
	beam: z.number().positive().optional(),
	crewInfo: z.string().optional(),
	engineHours: z.number().int().min(0).optional(),
	cabins: z.number().int().min(0).optional(),
	materials: z.string().optional(),
	navigation: z.array(z.string()).optional(),
});

export const updateYachtSchema = createYachtSchema
	.omit({ photoUploadIds: true })
	.partial()
	.extend({
		photoUploadIds: z.array(z.string().uuid()).max(10).optional(),
		existingPhotoKeys: z.array(z.string()).max(10).optional(),
		status: z
			.enum(Object.entries(ApprovalStatus).map(([, value]) => value))
			.optional(),
		adminRejectionReason: z.string().optional(),
	});

export const getYachtsQuerySchema = z.object({
	page: z
		.string()
		.optional()
		.transform((val) => (val ? Number(val) : 1)),
	limit: z
		.string()
		.optional()
		.transform((val) => (val ? Number(val) : 10)),
});
