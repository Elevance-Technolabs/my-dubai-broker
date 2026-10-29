import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../utils/AppError.js";
import { sendEmail, emailTemplates } from "../../lib/email.js";
import { env } from "../../lib/env.js";

interface Requester {
	userId: string;
	companyId?: string | null;
	role?: string;
}

const isPlatformStaff = (role?: string) =>
	role === "super_admin" || role === "platform_reviewer";

const leadIncludes = {
	listing: { select: { id: true, title: true, publicRef: true, category: true } },
	assignedTo: { select: { id: true, name: true, email: true } },
} satisfies Prisma.LeadInclude;

// ─── CREATE (public capture — no account required) ────────────

export interface CreateLeadInput {
	listingId: string;
	customerName: string;
	customerPhone?: string;
	customerEmail?: string;
	customerCountry?: string;
	preferredContact?: string;
	consentRecorded?: boolean;
	message?: string;
	sourcePage?: string;
	sourceForm?: string;
	utmSource?: string;
	utmMedium?: string;
	utmCampaign?: string;
	utmContent?: string;
	budget?: number;
	timeframe?: string;
	intent?: string;
}

export const createLead = async (data: CreateLeadInput) => {
	const listing = await prisma.listing.findUnique({
		where: { id: data.listingId },
		select: { id: true, companyId: true, creatorId: true, title: true },
	});
	if (!listing) throw new AppError("Listing not found", 404);

	// Lightweight duplicate detection — same listing, same contact info,
	// not already flagged as a duplicate itself. Flagged, not blocked: the
	// plan calls for surfacing duplicates to the team, not silently dropping
	// a genuine repeat enquiry.
	const contactFilters = [
		data.customerEmail ? { customerEmail: data.customerEmail } : null,
		data.customerPhone ? { customerPhone: data.customerPhone } : null,
	].filter((f): f is NonNullable<typeof f> => f !== null);

	const existing = contactFilters.length
		? await prisma.lead.findFirst({
				where: { listingId: listing.id, isDuplicate: false, OR: contactFilters },
				orderBy: { createdAt: "desc" },
			})
		: null;

	const lead = await prisma.lead.create({
		data: {
			listingId: listing.id,
			companyId: listing.companyId,
			assignedToId: listing.creatorId, // route to the listing's primary agent
			customerName: data.customerName,
			customerPhone: data.customerPhone,
			customerEmail: data.customerEmail,
			customerCountry: data.customerCountry,
			preferredContact: data.preferredContact,
			consentRecorded: data.consentRecorded ?? false,
			message: data.message,
			sourcePage: data.sourcePage,
			sourceForm: data.sourceForm,
			utmSource: data.utmSource,
			utmMedium: data.utmMedium,
			utmCampaign: data.utmCampaign,
			utmContent: data.utmContent,
			budget: data.budget != null ? new Prisma.Decimal(data.budget) : undefined,
			timeframe: data.timeframe,
			intent: data.intent,
			isDuplicate: !!existing,
			duplicateOfId: existing?.id,
		},
		include: leadIncludes,
	});

	await prisma.notification.create({
		data: {
			userId: listing.creatorId,
			priority: "ACTION_NEEDED" as any,
			type: "lead_received",
			title: "New Enquiry",
			body: `${data.customerName} enquired about "${listing.title}"`,
			actionUrl: `/leads/${lead.id}`,
		},
	});

	const assignee = await prisma.user.findUnique({
		where: { id: listing.creatorId },
		select: { email: true },
	});
	if (assignee) {
		const { subject, html } = emailTemplates.newLead({
			listingTitle: listing.title,
			customerName: data.customerName,
			leadUrl: `${env.FRONTEND_URL}/dashboard/leads`,
		});
		await sendEmail({ to: assignee.email, subject, html });
	}

	return lead;
};

// ─── READ ────────────────────────────────────────────────────

export const getMyLeads = async (
	userId: string,
	page = 1,
	limit = 20,
	filters: { stage?: string } = {},
) => {
	const skip = (page - 1) * limit;
	const where: Prisma.LeadWhereInput = {
		assignedToId: userId,
		...(filters.stage ? { stage: filters.stage as any } : {}),
	};

	const [leads, total] = await Promise.all([
		prisma.lead.findMany({
			where,
			include: leadIncludes,
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.lead.count({ where }),
	]);

	return { leads, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getCompanyLeads = async (
	companyId: string,
	page = 1,
	limit = 20,
	filters: { stage?: string; assignedToId?: string } = {},
) => {
	const skip = (page - 1) * limit;
	const where: Prisma.LeadWhereInput = {
		companyId,
		...(filters.stage ? { stage: filters.stage as any } : {}),
		...(filters.assignedToId ? { assignedToId: filters.assignedToId } : {}),
	};

	const [leads, total] = await Promise.all([
		prisma.lead.findMany({
			where,
			include: leadIncludes,
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.lead.count({ where }),
	]);

	return { leads, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getLeadById = async (id: string, requester: Requester) => {
	const lead = await prisma.lead.findUnique({
		where: { id },
		include: {
			...leadIncludes,
			activities: {
				orderBy: { createdAt: "desc" },
				include: { actor: { select: { id: true, name: true } } },
			},
			followUps: { orderBy: { scheduledAt: "asc" } },
		},
	});
	if (!lead) throw new AppError("Lead not found", 404);

	if (!isPlatformStaff(requester.role) && requester.companyId !== lead.companyId) {
		throw new AppError("You do not have permission to view this lead", 403);
	}

	return lead;
};

// ─── UPDATE ──────────────────────────────────────────────────

const assertLeadAccess = async (id: string, requester: Requester) => {
	const lead = await prisma.lead.findUnique({ where: { id } });
	if (!lead) throw new AppError("Lead not found", 404);
	if (!isPlatformStaff(requester.role) && requester.companyId !== lead.companyId) {
		throw new AppError("You do not have permission to update this lead", 403);
	}
	return lead;
};

export const updateLeadStage = async (
	id: string,
	stage: string,
	requester: Requester,
	note?: string,
) => {
	const lead = await assertLeadAccess(id, requester);
	const previousStage = lead.stage;

	return prisma.$transaction(async (tx) => {
		const updated = await tx.lead.update({
			where: { id },
			data: {
				stage: stage as any,
				lastActivityAt: new Date(),
				...(stage === "WON" || stage === "LOST" ? { outcome: stage.toLowerCase() } : {}),
			},
			include: leadIncludes,
		});

		await tx.leadActivity.create({
			data: {
				leadId: id,
				actorId: requester.userId,
				type: "STAGE_CHANGE",
				note: note ?? `${previousStage} → ${stage}`,
			},
		});

		return updated;
	});
};

const RESPONSE_ACTIVITY_TYPES = new Set(["CALL", "WHATSAPP", "EMAIL"]);

export const addLeadActivity = async (
	id: string,
	requester: Requester,
	type: string,
	note?: string,
) => {
	const lead = await assertLeadAccess(id, requester);

	return prisma.$transaction(async (tx) => {
		const activity = await tx.leadActivity.create({
			data: { leadId: id, actorId: requester.userId, type: type as any, note },
		});

		const updateData: Prisma.LeadUpdateInput = { lastActivityAt: new Date() };
		if (!lead.firstRespondedAt && RESPONSE_ACTIVITY_TYPES.has(type)) {
			updateData.firstRespondedAt = new Date();
		}
		if (lead.stage === "NEW" && RESPONSE_ACTIVITY_TYPES.has(type)) {
			updateData.stage = "CONTACTED";
		}
		await tx.lead.update({ where: { id }, data: updateData });

		return activity;
	});
};

export const assignLead = async (id: string, assigneeId: string, requester: Requester) => {
	await assertLeadAccess(id, requester);

	return prisma.$transaction(async (tx) => {
		const updated = await tx.lead.update({
			where: { id },
			data: { assignedToId: assigneeId },
			include: leadIncludes,
		});

		await tx.leadActivity.create({
			data: { leadId: id, actorId: requester.userId, type: "ASSIGNMENT" },
		});

		return updated;
	});
};
