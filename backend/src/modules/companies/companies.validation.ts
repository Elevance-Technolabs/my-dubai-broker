import { z } from "zod";
import {
	CompanyCategory,
	CompanyOnboardingStep,
} from "../../../generated/prisma/client.js";

const CategoryEnum = z.enum(
	Object.values(CompanyCategory) as [string, ...string[]],
);

export const onboardingStep1Schema = z.object({
	categories: z
		.array(CategoryEnum)
		.min(1, "At least one category must be selected"),
});

export const onboardingStep2Schema = z.object({
	tradeLicenseUploadId: z.string().uuid().optional(),
	reraLicenseUploadId: z.string().uuid().optional(),
	brn: z.string().optional(),
	emiratesIdUploadId: z.string().uuid().optional(),
	passportUploadId: z.string().uuid().optional(),
	showroomRegistrationUploadId: z.string().uuid().optional(),
	carDealerLicenseUploadId: z.string().uuid().optional(),
	marineTradeLicenseUploadId: z.string().uuid().optional(),
	boatDealerCertificateUploadId: z.string().uuid().optional(),
	aviationDealerLicenseUploadId: z.string().uuid().optional(),
	aocOperatorDocumentUploadId: z.string().uuid().optional(),
});

export const onboardingStep4Schema = z.object({
	name: z.string().min(1, "Company name is required").optional(),
	description: z
		.string()
		.min(10, "Description should be at least 10 characters")
		.optional(),
	address: z.string().min(5, "Address is required").optional(),
	contactEmail: z.string().email("Invalid email address").optional(),
	contactPhone: z.string().min(5, "Invalid phone number").optional(),
	websiteUrl: z
		.string()
		.url("Invalid website URL")
		.optional()
		.or(z.literal("")),
	socialMedia: z
		.record(z.string(), z.string().url().or(z.literal("")))
		.optional(),
	companyLogoUploadId: z.string().uuid().optional(),
	coverImageUploadId: z.string().uuid().optional(),
	listingLogoUploadId: z.string().uuid().optional(),
	languages: z
		.array(z.string())
		.min(1, "At least one language must be selected")
		.optional(),
	ownerEmail: z.string().email("Invalid owner email").optional(),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.optional(),
});

export const updateUserPermissionsSchema = z.object({
	permissions: z.record(z.string(), z.boolean()),
});

export const onboardingSchema = z.object({
	// Step 1: Categories
	categories: z
		.array(CategoryEnum)
		.min(1, "At least one category must be selected"),

	// Step 2: Business Verification
	tradeLicenseUploadId: z.string().uuid().optional(),
	reraLicenseUploadId: z.string().uuid().optional(),
	brn: z.string().optional(),
	emiratesIdUploadId: z.string().uuid().optional(),
	passportUploadId: z.string().uuid().optional(),
	showroomRegistrationUploadId: z.string().uuid().optional(),
	carDealerLicenseUploadId: z.string().uuid().optional(),
	marineTradeLicenseUploadId: z.string().uuid().optional(),
	boatDealerCertificateUploadId: z.string().uuid().optional(),
	aviationDealerLicenseUploadId: z.string().uuid().optional(),
	aocOperatorDocumentUploadId: z.string().uuid().optional(),

	// Step 4: Company Profile
	name: z.string().min(1, "Company name is required"),
	description: z
		.string()
		.min(10, "Description should be at least 10 characters"),
	address: z.string().min(5, "Address is required"),
	contactEmail: z.string().email("Invalid email address"),
	contactPhone: z.string().min(5, "Invalid phone number"),
	websiteUrl: z
		.string()
		.url("Invalid website URL")
		.optional()
		.or(z.literal("")),
	socialMedia: z
		.record(z.string(), z.string().url().or(z.literal("")))
		.optional(),
	companyLogoUploadId: z.string().uuid().optional(),
	coverImageUploadId: z.string().uuid().optional(),
	listingLogoUploadId: z.string().uuid().optional(),
	languages: z
		.array(z.string())
		.min(1, "At least one language must be selected"),
	ownerEmail: z.string().email("Invalid owner email"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});
