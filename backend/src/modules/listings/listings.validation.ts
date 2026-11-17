import { z } from "zod";

// Forms submit untouched optional fields as "" — treat that as "not provided".
const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);
import {
	CompanyCategory,
	AssetType,
	OfferingType,
	ApprovalStatus,
	PublicationStatus,
	Currency,
} from "../../../generated/prisma/enums.js";
import { MAX_LISTING_PHOTOS } from "../uploads/uploads.validation.js";

const enumValues = <T extends Record<string, string>>(e: T) =>
	Object.values(e) as [string, ...string[]];

// ─── Pagination ──────────────────────────────────────────────

export const paginationSchema = z.object({
	page: z.string().optional().transform((v) => (v ? Number(v) : 1)),
	limit: z.string().optional().transform((v) => (v ? Math.min(Number(v), 100) : 10)),
});

// ─── Create Listing ──────────────────────────────────────────

export const createListingSchema = z.object({
	// Core
	title: z
		.string("Title is required")
		.min(5, "Title must be at least 5 characters")
		.max(200, "Title must be at most 200 characters"),
	description: z
		.string("Description is required")
		.min(20, "Description must be at least 20 characters"),
	category: z.enum(enumValues(CompanyCategory), "Please choose a valid category"),
	assetType: z.enum(enumValues(AssetType), "Please choose a valid asset type"),
	offeringType: z.enum(enumValues(OfferingType), "Please choose a valid offering type"),

	// Pricing (at least one price field or priceOnRequest required — validated in service)
	salePrice: z
		.number("Sale price must be a number")
		.positive("Sale price must be greater than 0")
		.optional(),
	annualRent: z
		.number("Annual rent must be a number")
		.positive("Annual rent must be greater than 0")
		.optional(),
	monthlyRent: z
		.number("Monthly rent must be a number")
		.positive("Monthly rent must be greater than 0")
		.optional(),
	dailyRate: z
		.number("Daily rate must be a number")
		.positive("Daily rate must be greater than 0")
		.optional(),
	charterRate: z
		.number("Charter rate must be a number")
		.positive("Charter rate must be greater than 0")
		.optional(),
	currency: z
		.enum(enumValues(Currency), "Please choose a valid currency")
		.default("AED"),
	priceOnRequest: z.boolean().default(false),
	negotiable: z.boolean().default(false),

	// Location
	country: z.string().optional(),
	city: z.string().optional(),
	area: z.string().optional(),
	address: z.string().optional(),
	hideExactLocation: z.boolean().default(false),
	latitude: z.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90").nullable().optional(),
	longitude: z.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180").nullable().optional(),
	operatingBase: z.string().optional(),

	// Contact
	primaryEmail: z.preprocess(emptyToUndefined, z.string().email("Enter a valid email address").optional()),
	primaryPhone: z.string().optional(),

	// Media
	photoUploadIds: z
		.array(z.string())
		.max(MAX_LISTING_PHOTOS, `A listing can have at most ${MAX_LISTING_PHOTOS} photos`)
		.default([]),
	// Edits: the current photos to keep.
	existingPhotoKeys: z.array(z.string()).max(MAX_LISTING_PHOTOS).optional(),
	// Display order of all photos (first = cover): `upload:<id>` or an existing photo URL.
	photoOrder: z
		.array(z.string().min(1))
		.max(MAX_LISTING_PHOTOS, `A listing can have at most ${MAX_LISTING_PHOTOS} photos`)
		.optional(),
	videoUrl: z.preprocess(
		emptyToUndefined,
		z.string().url("Video link must be a valid URL (including https://)").optional(),
	),
	vrTourUrl: z.preprocess(
		emptyToUndefined,
		z.string().url("VR tour link must be a valid URL (including https://)").optional(),
	),

	// Internal
	licenseNumber: z.string().optional(),
	internalReferenceCode: z.string().optional(),

	// Category-specific details (flexible, validated per category in service)
	details: z.record(z.string(), z.any()).optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;

// ─── Update Listing ──────────────────────────────────────────

export const updateListingSchema = createListingSchema.partial().omit({
	category: true, // category cannot change after creation (asset type can, within the category)
});

// ─── Approval Status Update (Admin) ──────────────────────────

export const updateApprovalStatusSchema = z.object({
	status: z.enum(enumValues(ApprovalStatus)),
	rejectionReason: z.string().optional(),
	internalNote: z.string().optional(),
	reason: z.string().optional(),
});

// ─── Admin review (reviewer assignment, notes) ───────────────

export const setReviewerSchema = z.object({
	reviewerId: z.string().min(1).nullable(),
});

export const addReviewNoteSchema = z.object({
	body: z
		.string({ error: "Note is required" })
		.trim()
		.min(2, "Note must be at least 2 characters")
		.max(2000, "Note must be at most 2000 characters"),
	isInternal: z.boolean().optional(),
});

export const confirmAvailabilitySchema = z.object({
	isAvailable: z.boolean().optional(),
});

// ─── List Listings (Query Params) ────────────────────────────

export const getListingsQuerySchema = paginationSchema.extend({
	companyId: z.string().optional(),
	creatorId: z.string().optional(),
	approvalStatus: z.enum(enumValues(ApprovalStatus)).optional(),
	publicationStatus: z.enum(enumValues(PublicationStatus)).optional(),
	category: z.enum(enumValues(CompanyCategory)).optional(),
});

export const getPublicListingsQuerySchema = paginationSchema.extend({
	category: z.enum(enumValues(CompanyCategory)).optional(),
	excludeId: z.string().optional(),
	city: z.string().optional(),
	area: z.string().optional(),
});
