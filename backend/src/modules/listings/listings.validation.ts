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
	title: z.string().min(5).max(200),
	description: z.string().min(20),
	category: z.enum(enumValues(CompanyCategory)),
	assetType: z.enum(enumValues(AssetType)),
	offeringType: z.enum(enumValues(OfferingType)),

	// Pricing (at least one price field or priceOnRequest required — validated in service)
	salePrice: z.number().positive().optional(),
	annualRent: z.number().positive().optional(),
	monthlyRent: z.number().positive().optional(),
	dailyRate: z.number().positive().optional(),
	charterRate: z.number().positive().optional(),
	currency: z.enum(enumValues(Currency)).default("AED"),
	priceOnRequest: z.boolean().default(false),
	negotiable: z.boolean().default(false),

	// Location
	country: z.string().optional(),
	city: z.string().optional(),
	area: z.string().optional(),
	address: z.string().optional(),
	hideExactLocation: z.boolean().default(false),
	latitude: z.number().optional(),
	longitude: z.number().optional(),
	operatingBase: z.string().optional(),

	// Contact
	primaryEmail: z.preprocess(emptyToUndefined, z.string().email().optional()),
	primaryPhone: z.string().optional(),

	// Media
	photoUploadIds: z.array(z.string()).default([]),
	videoUrl: z.preprocess(emptyToUndefined, z.string().url().optional()),
	vrTourUrl: z.preprocess(emptyToUndefined, z.string().url().optional()),

	// Internal
	licenseNumber: z.string().optional(),
	internalReferenceCode: z.string().optional(),

	// Category-specific details (flexible, validated per category in service)
	details: z.record(z.string(), z.any()).optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;

// ─── Update Listing ──────────────────────────────────────────

export const updateListingSchema = createListingSchema.partial().omit({
	category: true, // category cannot change after creation
	assetType: true,
});

// ─── Approval Status Update (Admin) ──────────────────────────

export const updateApprovalStatusSchema = z.object({
	status: z.enum(enumValues(ApprovalStatus)),
	rejectionReason: z.string().optional(),
	internalNote: z.string().optional(),
	reason: z.string().optional(),
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
