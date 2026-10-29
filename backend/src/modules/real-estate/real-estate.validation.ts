import { z } from "zod";
import { photoUploadIdsSchema } from "../uploads/uploads.validation.js";
import {
	Currency,
	ApprovalStatus,
	OfferingType,
} from "../../../generated/prisma/enums.js";

export const createRealEstateSchema = z.object({
	// Core Listing Fields
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

	// Real Estate Specific Fields
	propertyType: z.string().min(1),
	status: z.enum(Object.entries(OfferingType).map(([, value]) => value)),
	permitNumber: z.string().optional(),
	bedrooms: z.number().int().min(0).optional(),
	bathrooms: z.number().int().min(0).optional(),
	builtUpArea: z.number().positive().optional(),
	plotArea: z.number().positive().optional(),
	floor: z.number().int().optional(),
	parking: z.number().int().min(0).optional(),
	developer: z.string().optional(),
	furnished: z.boolean().optional(),
	paymentPlan: z.string().optional(),
	views: z.array(z.string()).optional(),
	outdoor: z.array(z.string()).optional(),
	indoor: z.array(z.string()).optional(),
	community: z.array(z.string()).optional(),
	propertyTags: z.array(z.string()).optional(),
});

export const updateRealEstateSchema = createRealEstateSchema
	.omit({ photoUploadIds: true })
	.partial()
	.extend({
		photoUploadIds: z.array(z.string().uuid()).max(10).optional(),
		existingPhotoKeys: z.array(z.string()).max(10).optional(),
		listingStatus: z
			.enum(Object.entries(ApprovalStatus).map(([, value]) => value))
			.optional(),
		adminRejectionReason: z.string().optional(),
	});

export const getRealEstateQuerySchema = z.object({
	page: z
		.string()
		.optional()
		.transform((val) => (val ? Number(val) : 1)),
	limit: z
		.string()
		.optional()
		.transform((val) => (val ? Number(val) : 10)),
	propertyType: z.string().optional(),
	bedrooms: z
		.string()
		.optional()
		.transform((val) => (val ? Number(val) : undefined)),
});
