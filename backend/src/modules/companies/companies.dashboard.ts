import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../utils/AppError.js";
import { getListingMetrics, ratio } from "../scoring/metrics.service.js";
import { effectiveDocumentStatus } from "../admin/admin.service.js";

/**
 * Company owner / manager / agent dashboard (plan Sections 5–6): what is
 * live, what needs attention, how listings perform and what to do next.
 * Owners, managers and viewers see the whole company; agents and
 * coordinators see only their own listings (and agents their own leads).
 */

const DAY = 24 * 60 * 60 * 1000;
const COMPANY_WIDE_ROLES = ["company_owner", "company_manager", "viewer"];
const LEAD_ROLES = ["company_owner", "company_manager", "agent"];
const OPEN_STAGES = ["NEW", "CONTACTED", "QUALIFIED", "APPOINTMENT", "NEGOTIATION"];

type Requester = { userId: string; companyId?: string | null; role: string };

export const getCompanyDashboard = async (
	requester: Requester,
	q: { from?: Date; to?: Date; category?: string },
) => {
	if (!requester.companyId) throw new AppError("You must belong to a company.", 403);
	const companyId = requester.companyId;
	const companyWide = COMPANY_WIDE_ROLES.includes(requester.role);
	const canSeeLeads = LEAD_ROLES.includes(requester.role);
	const isManagement = requester.role === "company_owner" || requester.role === "company_manager";
	const now = Date.now();
	const to = q.to ?? new Date();
	const from = q.from ?? new Date(to.getTime() - 30 * DAY);

	const listingScope: Prisma.ListingWhereInput = {
		companyId,
		publicationStatus: { not: "DELETED" },
		...(companyWide ? {} : { creatorId: requester.userId }),
		...(q.category ? { category: q.category as any } : {}),
	};
	const leadScope: Prisma.LeadWhereInput = {
		companyId,
		isDuplicate: false,
		...(isManagement ? {} : { assignedToId: requester.userId }),
		...(q.category ? { listing: { category: q.category as any } } : {}),
	};

	const [company, listings, leads, documents, activity] = await Promise.all([
		prisma.company.findUnique({ where: { id: companyId }, select: { name: true, leadSlaMinutes: true, status: true } }),
		prisma.listing.findMany({
			where: listingScope,
			select: {
				id: true,
				title: true,
				publicRef: true,
				approvalStatus: true,
				publicationStatus: true,
				pendingChangesAt: true,
				adminRejectionReason: true,
				expiresAt: true,
				createdAt: true,
				creatorId: true,
				qualitySnapshot: { select: { score: true, breakdown: true } },
				rankSnapshot: { select: { visibilityLevel: true, percentile: true } },
				availability: { select: { nextConfirmDue: true, isAvailable: true } },
			},
		}),
		canSeeLeads
			? prisma.lead.findMany({
					where: leadScope,
					select: {
						id: true,
						createdAt: true,
						stage: true,
						customerName: true,
						firstOpenedAt: true,
						firstRespondedAt: true,
						assignedToId: true,
						assignedTo: { select: { id: true, name: true, banned: true } },
						listing: { select: { id: true, title: true } },
					},
				})
			: Promise.resolve([]),
		isManagement
			? prisma.companyDocument.findMany({
					where: { companyId },
					select: { id: true, documentType: true, status: true, expiryDate: true },
				})
			: Promise.resolve([]),
		prisma.statusHistory.findMany({
			where: companyWide
				? { OR: [{ companyId }, { listing: { companyId } }] }
				: { listing: { companyId, creatorId: requester.userId } },
			orderBy: { createdAt: "desc" },
			take: 15,
			select: { createdAt: true, entityType: true, fromStatus: true, toStatus: true, reason: true, actorId: true, listing: { select: { id: true, title: true } } },
		}),
	]);
	if (!company) throw new AppError("Company not found", 404);
	const sla = company.leadSlaMinutes ?? 60;

	const metrics = await getListingMetrics(
		listings.map((l) => l.id),
		{ from, to },
	);
	const totals = { views: 0, impressions: 0, enquiries: 0 };
	for (const m of metrics.values()) {
		totals.views += m.views;
		totals.impressions += m.impressions;
		totals.enquiries += m.enquiries;
	}

	const count = (pred: (l: (typeof listings)[number]) => boolean) => listings.filter(pred).length;
	const live = (l: (typeof listings)[number]) => l.approvalStatus === "APPROVED" && l.publicationStatus === "LIVE";
	const leadsInRange = leads.filter((l) => l.createdAt >= from && l.createdAt <= to);
	const responded = leadsInRange.filter((l) => l.firstRespondedAt);
	const overdueLeads = leads.filter(
		(l) => !l.firstRespondedAt && OPEN_STAGES.includes(l.stage) && (now - l.createdAt.getTime()) / 60000 > sla,
	);
	const listingLink = (l: { id: string; title: string }) => ({ id: l.id, label: l.title, href: `/listings/${l.id}` });

	// ── Action Required
	const lowQuality = listings.filter(
		(l) => l.approvalStatus !== "REJECTED" && (l.qualitySnapshot?.score ?? 100) < 70,
	);
	const changesRequired = listings.filter((l) => l.approvalStatus === "CHANGES_REQUIRED");
	const availabilityDue = listings.filter((l) => live(l) && l.availability && l.availability.nextConfirmDue.getTime() < now);
	const lowVisibility = listings.filter(
		(l) => live(l) && ["low", "not_eligible"].includes(l.rankSnapshot?.visibilityLevel ?? ""),
	);
	const docsAttention = documents
		.map((d) => ({ ...d, effective: effectiveDocumentStatus(d) }))
		.filter((d) => d.effective === "EXPIRING" || d.effective === "EXPIRED");

	const actionRequired = [
		{
			key: "listing_quality",
			title: "Listing quality",
			description: `${lowQuality.length} listing${lowQuality.length === 1 ? "" : "s"} need more images, details or specifications.`,
			count: lowQuality.length,
			items: lowQuality.slice(0, 5).map(listingLink),
		},
		...(canSeeLeads
			? [
					{
						key: "lead_response",
						title: "Lead response",
						description: `${overdueLeads.length} enquir${overdueLeads.length === 1 ? "y has" : "ies have"} not been answered within ${sla} minutes.`,
						count: overdueLeads.length,
						items: overdueLeads.slice(0, 5).map((l) => ({ id: l.id, label: `${l.customerName} — ${l.listing.title}`, href: "/dashboard/leads" })),
					},
				]
			: []),
		...(isManagement
			? [
					{
						key: "documents",
						title: "Documents",
						description: `${docsAttention.length} company document${docsAttention.length === 1 ? " is" : "s are"} expired or expiring within 30 days.`,
						count: docsAttention.length,
						items: docsAttention.slice(0, 5).map((d) => ({
							id: d.id,
							label: `${d.documentType.replace(/_/g, " ")} — ${d.effective === "EXPIRED" ? "expired" : "expiring"}`,
							href: "/dashboard",
						})),
					},
				]
			: []),
		{
			key: "approval_feedback",
			title: "Approval feedback",
			description: `${changesRequired.length} listing${changesRequired.length === 1 ? " was" : "s were"} returned with a reviewer comment.`,
			count: changesRequired.length,
			items: changesRequired.slice(0, 5).map((l) => ({ ...listingLink(l), detail: l.adminRejectionReason })),
		},
		{
			key: "availability",
			title: "Availability",
			description: `${availabilityDue.length} live listing${availabilityDue.length === 1 ? " needs" : "s need"} availability confirmation.`,
			count: availabilityDue.length,
			items: availabilityDue.slice(0, 5).map(listingLink),
		},
		{
			key: "low_visibility",
			title: "Low visibility",
			description: `${lowVisibility.length} listing${lowVisibility.length === 1 ? " has" : "s have"} actions available to improve search position.`,
			count: lowVisibility.length,
			items: lowVisibility.slice(0, 5).map(listingLink),
		},
	];

	// ── Performance blocks
	const ranked = listings
		.map((l) => ({ listing: l, m: metrics.get(l.id)! }))
		.filter((x) => x.m);
	const topListings = ranked
		.filter((x) => x.m.enquiries > 0 || x.m.views > 0)
		.sort((a, b) => b.m.enquiries - a.m.enquiries || b.m.views - a.m.views)
		.slice(0, 5)
		.map((x) => ({ ...listingLink(x.listing), views: x.m.views, enquiries: x.m.enquiries, conversionRate: x.m.conversionRate }));
	const highViewsLowConversion = ranked
		.filter((x) => x.m.views >= 10 && (x.m.conversionRate ?? 0) < 0.02)
		.sort((a, b) => b.m.views - a.m.views)
		.slice(0, 5)
		.map((x) => ({ ...listingLink(x.listing), views: x.m.views, enquiries: x.m.enquiries, conversionRate: x.m.conversionRate }));

	const agentResponse = isManagement
		? Object.values(
				leadsInRange.reduce<Record<string, { id: string; name: string; leads: number; due: number; responded: number; withinSla: number; totalMinutes: number }>>(
					(acc, l) => {
						if (!l.assignedTo) return acc;
						const a = (acc[l.assignedTo.id] ??= { id: l.assignedTo.id, name: l.assignedTo.name, leads: 0, due: 0, responded: 0, withinSla: 0, totalMinutes: 0 });
						a.leads++;
						// Counts toward the rate once answered or past the response window.
						if (l.firstRespondedAt || (now - l.createdAt.getTime()) / 60000 > sla) a.due++;
						if (l.firstRespondedAt) {
							const minutes = (l.firstRespondedAt.getTime() - l.createdAt.getTime()) / 60000;
							a.responded++;
							a.totalMinutes += minutes;
							if (minutes <= sla) a.withinSla++;
						}
						return acc;
					},
					{},
				),
			).map((a) => ({
				id: a.id,
				name: a.name,
				leads: a.leads,
				responseRate: ratio(a.withinSla, a.due),
				avgFirstResponseMinutes: a.responded ? Math.round(a.totalMinutes / a.responded) : null,
			}))
		: [];

	// ── Expiries in the next 7 / 30 / 60 days
	const within = (d: Date | null | undefined, days: number) => !!d && d.getTime() >= now && d.getTime() - now <= days * DAY;
	const expiries = [7, 30, 60].map((days) => ({
		days,
		listings: listings.filter((l) => within(l.expiresAt, days)).map((l) => ({ ...listingLink(l), date: l.expiresAt })),
		documents: documents
			.filter((d) => within(d.expiryDate, days))
			.map((d) => ({ id: d.id, label: d.documentType.replace(/_/g, " "), date: d.expiryDate })),
	}));

	const actorIds = [...new Set(activity.map((a) => a.actorId))];
	const actors = await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } });
	const actorName = new Map(actors.map((a) => [a.id, a.name]));
	// "CHANGES_REQUIRED" → "Changes Required"; a submitted listing reads as
	// "Pending Review", matching the listing's own status label.
	const SPECIAL_LABELS: Record<string, string> = { SUBMITTED: "Pending Review", PENDING_REVIEW: "In Review" };
	const statusLabel = (s: string) =>
		SPECIAL_LABELS[s] ??
		s
			.toLowerCase()
			.split("_")
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(" ");
	const change = (a: (typeof activity)[number]) =>
		a.fromStatus === "availability"
			? a.reason ?? "Availability updated"
			: a.fromStatus === "changes"
				? ({ PENDING: "Changes submitted for review", APPROVED: "Changes approved", REJECTED: "Changes not approved" } as Record<string, string>)[a.toStatus] ?? "Changes"
			: a.toStatus === "DELETED"
				? "Listing deleted"
				: `${a.fromStatus ? `${statusLabel(a.fromStatus)} → ` : ""}${statusLabel(a.toStatus)}`;

	const recentActivity = [
		...activity.map((a) => ({
			at: a.createdAt,
			title:
				a.entityType === "listing" && a.listing
					? `${a.listing.title}: ${change(a)}`
					: `Company ${a.entityType === "document" ? "document" : "status"}: ${statusLabel(a.toStatus)}`,
			detail: a.fromStatus === "availability" ? null : a.reason,
			actor: actorName.get(a.actorId) ?? null,
			href: a.listing ? `/listings/${a.listing.id}` : "/dashboard",
		})),
		...leads
			.slice()
			.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
			.slice(0, 10)
			.map((l) => ({
				at: l.createdAt,
				title: `New enquiry from ${l.customerName}`,
				detail: l.listing.title,
				actor: null,
				href: "/dashboard/leads",
			})),
	]
		.sort((a, b) => b.at.getTime() - a.at.getTime())
		.slice(0, 15);

	const startOfToday = new Date();
	startOfToday.setHours(0, 0, 0, 0);

	return {
		scope: companyWide ? "company" : "own",
		role: requester.role,
		company: { name: company.name, status: company.status, leadSlaMinutes: sla },
		range: { from, to },
		counts: {
			live: count(live),
			draft: count((l) => l.approvalStatus === "DRAFT"),
			pendingReview: count((l) => l.approvalStatus === "SUBMITTED" || l.approvalStatus === "PENDING_REVIEW"),
			changesRequired: changesRequired.length,
			rejected: count((l) => l.approvalStatus === "REJECTED"),
			paused: count((l) => l.publicationStatus === "PAUSED"),
			unpublished: count((l) => l.approvalStatus === "APPROVED" && l.publicationStatus === "UNPUBLISHED"),
			soldOut: count((l) => l.publicationStatus === "SOLD_OUT"),
			changesPending: count((l) => !!l.pendingChangesAt),
			expiring: listings.filter((l) => within(l.expiresAt, 30)).length,
			newEnquiries: canSeeLeads ? leads.filter((l) => l.stage === "NEW").length : null,
		},
		performance: {
			views: totals.views,
			impressions: totals.impressions,
			enquiries: totals.enquiries,
			conversionRate: ratio(totals.enquiries, totals.views),
			avgFirstResponseMinutes: responded.length
				? Math.round(responded.reduce((s, l) => s + (l.firstRespondedAt!.getTime() - l.createdAt.getTime()) / 60000, 0) / responded.length)
				: null,
		},
		actionRequired,
		topListings,
		highViewsLowConversion,
		agentResponse,
		unassignedLeads: isManagement ? leads.filter((l) => OPEN_STAGES.includes(l.stage) && (!l.assignedToId || l.assignedTo?.banned)).length : null,
		todayLeads: canSeeLeads
			? leads
					.filter((l) => l.createdAt >= startOfToday)
					.map((l) => ({ id: l.id, label: `${l.customerName} — ${l.listing.title}`, stage: l.stage, href: "/dashboard/leads" }))
			: null,
		overdueLeads: canSeeLeads
			? overdueLeads.slice(0, 10).map((l) => ({ id: l.id, label: `${l.customerName} — ${l.listing.title}`, href: "/dashboard/leads" }))
			: null,
		expiries,
		recentActivity,
	};
};
