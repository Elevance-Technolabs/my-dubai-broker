import { z } from "zod";

export const setReviewerSchema = z.object({
	reviewerId: z.string().min(1).nullable(),
});

export const addNoteSchema = z.object({
	body: z
		.string({ error: "Note is required" })
		.trim()
		.min(2, "Note must be at least 2 characters")
		.max(2000, "Note must be at most 2000 characters"),
	isInternal: z.boolean().optional(),
});

const optionalDate = z
	.string()
	.refine((v) => v === "" || !Number.isNaN(new Date(v).getTime()), "Enter a valid date")
	.nullable()
	.optional();

export const updateDocumentSchema = z
	.object({
		documentNumber: z.string().trim().max(100, "Document number must be at most 100 characters").nullable().optional(),
		issuingAuthority: z.string().trim().max(150, "Issuing authority must be at most 150 characters").nullable().optional(),
		issueDate: optionalDate,
		expiryDate: optionalDate,
		status: z.enum(["MISSING", "UPLOADED", "UNDER_REVIEW", "VALID", "EXPIRING", "EXPIRED"]).optional(),
		reviewNote: z.string().trim().max(1000, "Review note must be at most 1000 characters").nullable().optional(),
	})
	.refine(
		(d) => !d.issueDate || !d.expiryDate || new Date(d.expiryDate) > new Date(d.issueDate),
		{ message: "Expiry date must be after the issue date", path: ["expiryDate"] },
	);

export const updateRoleSchema = z.object({
	role: z.enum(
		["super_admin", "platform_reviewer", "company_owner", "company_manager", "agent", "listing_coordinator", "viewer"],
		"Please choose a valid role",
	),
	reason: z
		.string({ error: "Reason is required" })
		.trim()
		.min(3, "Reason must be at least 3 characters")
		.max(500, "Reason must be at most 500 characters"),
});

const COMPANY_INVITE_ROLES = ["company_owner", "company_manager", "agent", "listing_coordinator", "viewer"] as const;
const STAFF_INVITE_ROLES = ["super_admin", "platform_reviewer"] as const;

export const inviteUserSchema = z
	.object({
		companyId: z.string().trim().optional(),
		email: z.string({ error: "Email is required" }).trim().email("Enter a valid email address"),
		role: z.enum([...COMPANY_INVITE_ROLES, ...STAFF_INVITE_ROLES], "Please choose a valid role"),
	})
	.refine(
		(d) => (STAFF_INVITE_ROLES as readonly string[]).includes(d.role) || !!d.companyId,
		{ message: "Company is required", path: ["companyId"] },
	);

const reason = z
	.string({ error: "Reason is required" })
	.trim()
	.min(3, "Reason must be at least 3 characters")
	.max(500, "Reason must be at most 500 characters");

export const qualityConfigSchema = z.object({
	reason,
	components: z
		.array(
			z.object({
				component: z.string().min(1),
				maxPoints: z.number().int("Points must be a whole number").min(0, "Points cannot be negative").max(100, "Points must be at most 100"),
				isActive: z.boolean(),
			}),
		)
		.min(1),
});

export const rankingConfigSchema = z.object({
	reason,
	components: z
		.array(
			z.object({
				component: z.string().min(1),
				weight: z.number().min(0, "Weight cannot be negative").max(100, "Weight must be at most 100"),
				isActive: z.boolean(),
			}),
		)
		.min(1),
});
