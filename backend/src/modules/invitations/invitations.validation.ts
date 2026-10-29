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
	email: z.string().email(),
	role: z.enum(INVITABLE_ROLES),
	permissions: z.record(z.string(), z.any()).optional(),
});

export const acceptInvitationSchema = z.object({
	name: z.string().min(1),
	password: z.string().min(8),
	phoneNumber: z.string().optional(),
});
