import { prisma } from "../../prisma/client.js";
import { AppError } from "../../utils/AppError.js";
import { getListingDailySeries, getListingMetrics } from "../scoring/metrics.service.js";
import { COMPONENT_LABELS, RATING_LABELS, qualityActions, type QualityBreakdown } from "../scoring/quality.service.js";
import { refreshListingScores } from "../scoring/scoring.service.js";
import {
	VISIBILITY_COMPONENT_LABELS,
	VISIBILITY_LABELS,
	percentileBand,
} from "../scoring/visibility.service.js";

/**
 * Everything behind the listing detail tabs (plan Section 8): quality,
 * visibility, performance, leads and history, shown to the listing's own
 * company and to platform staff. Internal reviewer notes are staff-only.
 */

interface Requester {
	userId: string;
	companyId?: string | null;
	role?: string;
}

const DAY = 24 * 60 * 60 * 1000;
/** Visibility depends on other listings' activity, so refresh it when older than this. */
const STALE_AFTER_MS = 6 * 60 * 60 * 1000;
const LEAD_MANAGER_ROLES = ["company_owner", "company_manager", "super_admin", "platform_reviewer"];

const isStaff = (role?: string) => role === "super_admin" || role === "platform_reviewer";

const loadForAccess = async (listingId: string, requester: Requester) => {
	const listing = await prisma.listing.findUnique({
		where: { id: listingId },
		select: {
			id: true,
			companyId: true,
			publicationStatus: true,
			updatedAt: true,
			availability: { select: { updatedAt: true } },
			rankSnapshot: { select: { calculatedAt: true } },
			qualitySnapshot: { select: { calculatedAt: true } },
		},
	});
	if (!listing) throw new AppError("Listing not found", 404);
	if (!isStaff(requester.role) && requester.companyId !== listing.companyId) {
		throw new AppError("You do not have permission to view this listing", 403);
	}
	return listing;
};

/** Readable status names for the history timeline. */
const HISTORY_LABELS: Record<string, string> = {
	DRAFT: "Draft",
	SUBMITTED: "Pending review",
	PENDING_REVIEW: "In review",
	CHANGES_REQUIRED: "Changes required",
	APPROVED: "Approved",
	REJECTED: "Rejected",
	UNPUBLISHED: "Unpublished",
	SCHEDULED: "Scheduled",
	LIVE: "Live",
	PAUSED: "Paused",
	EXPIRED: "Expired",
	DELETED: "Deleted",
	SOLD_OUT: "Sold out",
};

/** History entries for edits to an approved listing (fromStatus "changes"). */
const CHANGE_TITLES: Record<string, string> = {
	PENDING: "Changes submitted for review",
	APPROVED: "Changes approved",
	REJECTED: "Changes not approved",
};
const historyLabel = (status: string) => HISTORY_LABELS[status] ?? status;

export const getListingInsights = async (listingId: string, requester: Requester) => {
	const access = await loadForAccess(listingId, requester);
	// Recalculate when the listing (or its availability) changed after the
	// last calculation, or when other listings may have moved since.
	const lastChange = Math.max(access.updatedAt.getTime(), access.availability?.updatedAt.getTime() ?? 0);
	const stale =
		!access.qualitySnapshot ||
		!access.rankSnapshot ||
		access.rankSnapshot.calculatedAt.getTime() < lastChange ||
		Date.now() - access.rankSnapshot.calculatedAt.getTime() > STALE_AFTER_MS;
	if (stale) await refreshListingScores(listingId, { waitForVisibility: true });

	const staff = isStaff(requester.role);
	const canSeeAllLeads = LEAD_MANAGER_ROLES.includes(requester.role ?? "");
	const canSeeOwnLeads = requester.role === "agent";

	const listing = await prisma.listing.findUniqueOrThrow({
		where: { id: listingId },
		include: {
			qualitySnapshot: true,
			rankSnapshot: true,
			availability: true,
			assignedReviewer: { select: { id: true, name: true } },
			statusHistory: { orderBy: { createdAt: "desc" }, take: 50 },
			reviewNotes: {
				where: staff ? {} : { isInternal: false },
				orderBy: { createdAt: "desc" },
				include: { author: { select: { id: true, name: true } } },
			},
			approvalReviews: {
				orderBy: { createdAt: "desc" },
				include: { reviewer: { select: { id: true, name: true } } },
			},
		},
	});

	const [allTime, last30, series, leads, actors] = await Promise.all([
		getListingMetrics([listingId]),
		getListingMetrics([listingId], { from: new Date(Date.now() - 30 * DAY) }),
		getListingDailySeries(listingId, 30),
		canSeeAllLeads || canSeeOwnLeads
			? prisma.lead.findMany({
					where: { listingId, ...(canSeeAllLeads ? {} : { assignedToId: requester.userId }) },
					orderBy: { createdAt: "desc" },
					take: 100,
					select: {
						id: true,
						createdAt: true,
						customerName: true,
						stage: true,
						isDuplicate: true,
						firstRespondedAt: true,
						assignedTo: { select: { id: true, name: true } },
					},
				})
			: Promise.resolve(null),
		prisma.user.findMany({
			where: { id: { in: [...new Set(listing.statusHistory.map((h) => h.actorId))] } },
			select: { id: true, name: true },
		}),
	]);
	const actorName = new Map(actors.map((a) => [a.id, a.name]));

	const breakdown = (listing.qualitySnapshot?.breakdown ?? {}) as QualityBreakdown;
	const actions = qualityActions(breakdown);
	const rank = listing.rankSnapshot;

	const history = [
		...listing.statusHistory.map((h) => ({
			type: "status" as const,
			at: h.createdAt,
			actor: actorName.get(h.actorId) ?? "—",
			title:
				h.fromStatus === "availability"
					? h.reason ?? "Availability updated"
					: h.fromStatus === "changes"
						? CHANGE_TITLES[h.toStatus] ?? "Changes"
					: h.toStatus === "DELETED"
						? "Listing deleted"
						: h.fromStatus
							? `${historyLabel(h.fromStatus)} → ${historyLabel(h.toStatus)}`
							: `Created as ${historyLabel(h.toStatus)}`,
			detail: h.fromStatus === "availability" ? null : h.reason,
		})),
		...listing.reviewNotes.map((n) => ({
			type: n.isInternal ? ("internal_note" as const) : ("comment" as const),
			at: n.createdAt,
			actor: n.author.name,
			title: n.isInternal ? "Internal note" : "Reviewer comment",
			detail: n.body,
		})),
		...listing.approvalReviews.map((r) => ({
			type: "review" as const,
			at: r.createdAt,
			actor: r.reviewer.name,
			title: `Review decision: ${r.decision}`,
			detail: [r.partnerReason, staff && r.internalNote ? `Internal: ${r.internalNote}` : null].filter(Boolean).join(" — ") || null,
		})),
	].sort((a, b) => b.at.getTime() - a.at.getTime());

	return {
		listingId,
		reviewer: listing.assignedReviewer,
		availability: listing.availability,
		quality: listing.qualitySnapshot
			? {
					score: listing.qualitySnapshot.score,
					rating: listing.qualitySnapshot.rating,
					ratingLabel: RATING_LABELS[listing.qualitySnapshot.rating] ?? listing.qualitySnapshot.rating,
					previousScore: listing.qualitySnapshot.previousScore,
					calculatedAt: listing.qualitySnapshot.calculatedAt,
					availablePoints: Math.round(actions.reduce((s, a) => s + a.points, 0)),
					components: Object.entries(breakdown).map(([key, c]) => ({
						key,
						label: c.label ?? COMPONENT_LABELS[key] ?? key,
						score: c.score,
						maxPoints: c.maxPoints,
						checks: c.checks,
					})),
					actions,
				}
			: null,
		visibility: rank
			? {
					level: rank.visibilityLevel,
					levelLabel: VISIBILITY_LABELS[rank.visibilityLevel] ?? rank.visibilityLevel,
					percentile: rank.percentile,
					band: percentileBand(rank.percentile),
					rank: rank.rank,
					totalCompeting: rank.totalCompeting,
					eligible: rank.eligibilityPassed,
					eligibilityReasons: (rank.eligibilityReasons as string[] | null) ?? [],
					reasons: (rank.reasons as any[]) ?? [],
					components: Object.entries((rank.breakdown ?? {}) as Record<string, any>).map(([key, c]) => ({
						key,
						label: c.label ?? VISIBILITY_COMPONENT_LABELS[key] ?? key,
						value: c.value,
						weight: c.weight,
					})),
					calculatedAt: rank.calculatedAt,
					// Improve Visibility: the quality fixes are the actions the partner controls.
					improvements: actions.slice(0, 5),
				}
			: null,
		performance: {
			allTime: allTime.get(listingId),
			last30Days: last30.get(listingId),
			daily: series,
		},
		leads,
		history,
	};
};

export const confirmAvailability = async (listingId: string, requester: Requester, isAvailable = true) => {
	const listing = await loadForAccess(listingId, requester);
	if (isStaff(requester.role)) {
		throw new AppError("Availability is confirmed by the listing's company", 403);
	}
	if (listing.publicationStatus === "DELETED") {
		throw new AppError("This listing has been deleted and can no longer be changed.", 400);
	}
	const now = new Date();
	const availability = await prisma.availability.upsert({
		where: { listingId },
		update: { isAvailable, confirmedAt: now, nextConfirmDue: new Date(now.getTime() + 30 * DAY) },
		create: { listingId, isAvailable, confirmedAt: now, nextConfirmDue: new Date(now.getTime() + 30 * DAY) },
	});
	await prisma.statusHistory.create({
		data: {
			entityType: "listing",
			entityId: listingId,
			listingId,
			fromStatus: "availability",
			toStatus: isAvailable ? "AVAILABLE_CONFIRMED" : "MARKED_UNAVAILABLE",
			actorId: requester.userId,
			reason: isAvailable ? "Availability confirmed" : "Marked as not available",
		},
	});
	await refreshListingScores(listingId);
	return availability;
};
