import { z } from "zod";

export const createLeadSchema = z
	.object({
		listingId: z.string().min(1, "Listing is required"),
		customerName: z.string().min(1, "Please enter your name"),
		customerPhone: z.string().optional(),
		customerEmail: z.string().email("Enter a valid email address").optional(),
		customerCountry: z.string().optional(),
		preferredContact: z
			.enum(["call", "whatsapp", "email"], "Choose call, WhatsApp or email")
			.optional(),
		consentRecorded: z.boolean().optional(),
		message: z.string().optional(),
		sourcePage: z.string().optional(),
		sourceForm: z.string().optional(),
		utmSource: z.string().optional(),
		utmMedium: z.string().optional(),
		utmCampaign: z.string().optional(),
		utmContent: z.string().optional(),
		budget: z
			.number("Budget must be a number")
			.positive("Budget must be greater than 0")
			.optional(),
		timeframe: z.string().optional(),
		intent: z
			.enum(["buy", "rent", "invest", "charter"], "Choose a valid enquiry type")
			.optional(),
	})
	.refine((data) => data.customerPhone || data.customerEmail, {
		message: "Provide at least a phone number or an email address",
		path: ["customerPhone"],
	});

export const getLeadsQuerySchema = z.object({
	page: z
		.string()
		.optional()
		.transform((v) => (v ? Number(v) : 1)),
	limit: z
		.string()
		.optional()
		.transform((v) => (v ? Number(v) : 20)),
	stage: z
		.enum([
			"NEW",
			"CONTACTED",
			"QUALIFIED",
			"APPOINTMENT",
			"NEGOTIATION",
			"WON",
			"LOST",
		])
		.optional(),
	assignedToId: z.string().optional(),
});

export const updateLeadStageSchema = z.object({
	stage: z.enum([
		"NEW",
		"CONTACTED",
		"QUALIFIED",
		"APPOINTMENT",
		"NEGOTIATION",
		"WON",
		"LOST",
	]),
	note: z.string().optional(),
});

export const addLeadActivitySchema = z.object({
	type: z.enum(["CALL", "WHATSAPP", "EMAIL", "NOTE"]),
	note: z.string().optional(),
});

export const assignLeadSchema = z.object({
	assigneeId: z.string().min(1, "Please choose who to assign this lead to"),
});
