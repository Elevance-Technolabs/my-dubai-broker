import { z } from "zod";
import { CompanyCategory } from "../../../generated/prisma/client.js";

export const updateProfileSchema = z.object({
	displayName: z.string().min(1, "Display name is required").optional(),
	bio: z.string().optional(),
	photoUploadId: z.string().uuid("Invalid photo upload").optional(),
	phone: z.string().optional(),
	whatsapp: z.string().optional(),
	email: z.string().email("Enter a valid email address").optional(),
	languages: z.array(z.string()).optional(),
	specialities: z.array(z.enum(Object.values(CompanyCategory) as [string, ...string[]])).optional(),
	showPhone: z.boolean().optional(),
	showWhatsapp: z.boolean().optional(),
	showEmail: z.boolean().optional(),
});
