import { z } from "zod";

// company_owner is created directly during onboarding, not invited; platform
// roles (super_admin, platform_reviewer) are never company-scoped invites.
export const INVITABLE_ROLES = [
	"company_manager",
	"agent",
	"listing_coordinator",
	"viewer",
] as const;

export const createInvitationSchema = z.object({
	email: z.string("Email is required").email("Enter a valid email address"),
	role: z.enum(INVITABLE_ROLES, "Please choose a valid role"),
	permissions: z.record(z.string(), z.any()).optional(),
});

export const acceptInvitationSchema = z.object({
	name: z.string("Name is required").min(1, "Name is required"),
	password: z
		.string("Password is required")
		.min(8, "Password must be at least 8 characters"),
	phoneNumber: z.string().optional(),
});
