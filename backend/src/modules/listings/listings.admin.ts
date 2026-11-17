import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../utils/AppError.js";
import { getListingMetrics } from "../scoring/metrics.service.js";
import { RATING_LABELS } from "../scoring/quality.service.js";
import { VISIBILITY_LABELS, percentileBand } from "../scoring/visibility.service.js";
import { toPublicUrl } from "../../lib/r2.js";

/**
 * Platform-wide listing management table and the listing approval queue
 * (plan Sections 7–8): every column, filter and sort the admin needs, with
 * export of the same filtered result.
 */

const DAY = 24 * 60 * 60 * 1000;
/** A submission waiting longer than this is flagged as overdue. */
export const REVIEW_OVERDUE_HOURS = 48;
const MAX_ROWS = 5000;

const CATEGORY_LABELS: Record<string, string> = {
	REAL_ESTATE: "Real Estate",
	CARS: "Cars",
	YACHTS: "Yachts",
	PRIVATE_AVIATION: "Private Aviation",
	COLLECTIBLES: "Collectibles",
};
const OFFERING_LABELS: Record<string, string> = {
	SALE: "For Sale",
	LONG_TERM_RENT: "Long-Term Rent",
	SHORT_TERM_RENT: "Short-Term Rent",
	OFF_PLAN: "Off-Plan",
	CHARTER: "Charter",
	PRICE_ON_REQUEST: "Price on Request",
};
const APPROVAL_LABELS: Record<string, string> = {
	DRAFT: "Draft",
	SUBMITTED: "Pending review",
	PENDING_REVIEW: "In review",
	CHANGES_REQUIRED: "Changes Required",
	APPROVED: "Approved",
	REJECTED: "Rejected",
};
const PUBLICATION_LABELS: Record<string, string> = {
	UNPUBLISHED: "Unpublished",
	SCHEDULED: "Scheduled",
	LIVE: "Live",
	PAUSED: "Paused",
	EXPIRED: "Expired",
	DELETED: "Deleted",
	SOLD_OUT: "Sold out",
};

const ASSET_TYPE_LABEL_OVERRIDES: Record<string, string> = {
	SUV: "SUV",
	WINE_SPIRITS: "Wine & Spirits",
	COINS_STAMPS: "Coins & Stamps",
};

export const assetTypeLabel = (value: string) =>
	ASSET_TYPE_LABEL_OVERRIDES[value] ??
	value
		.toLowerCase()
		.split("_")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");

export type AdminListingQuery = {
	page?: number;
	limit?: number;
	search?: string;
	category?: string;
	offeringType?: string;
	assetType?: string;
	companyId?: string;
	creatorId?: string;
	reviewerId?: string;
	approvalStatus?: string;
	publicationStatus?: string;
	scoreMin?: number;
	scoreMax?: number;
	dateFrom?: Date;
	dateTo?: Date;
	sort?: string;
	/** Approval queue: only submissions awaiting a decision, oldest first. */
	queue?: boolean;
	/** One listing, e.g. opened from a notification link. */
	listingId?: string;
	/** Platform reviewer: only listings assigned to them. */
	assignedTo?: string;
};

const AWAITING = ["SUBMITTED", "PENDING_REVIEW"];

const buildWhere = (q: AdminListingQuery): Prisma.ListingWhereInput => ({
	// A link to one listing (from a notification) always opens it, even if it
	// has since been decided or deleted.
	...(q.listingId ? { id: q.listingId } : buildListWhere(q)),
	// A reviewer only ever sees listings assigned to them.
	...(q.assignedTo ? { assignedReviewerId: q.assignedTo } : {}),
});

const buildListWhere = (q: AdminListingQuery): Prisma.ListingWhereInput => ({
	// The queue holds submissions awaiting a decision and approved listings
	// whose edits are waiting for review.
	// AND, not a bare OR: the search below is an OR too, and two OR keys in
	// one object would overwrite each other (the search used to drop the queue rule).
	...(q.queue
		? q.approvalStatus
			? { approvalStatus: q.approvalStatus as any }
			: { AND: [{ OR: [{ approvalStatus: { in: AWAITING as any } }, { pendingChangesAt: { not: null } }] }] }
		: q.approvalStatus
			? { approvalStatus: q.approvalStatus as any }
			: {}),
	...(q.publicationStatus && !q.queue
		? { publicationStatus: q.publicationStatus as any }
		: { publicationStatus: { not: "DELETED" as const } }),
	...(q.category ? { category: q.category as any } : {}),
	...(q.offeringType ? { offeringType: q.offeringType as any } : {}),
	...(q.assetType ? { assetType: q.assetType as any } : {}),
	...(q.companyId ? { companyId: q.companyId } : {}),
	...(q.creatorId ? { creatorId: q.creatorId } : {}),
	...(q.reviewerId === "unassigned"
		? { assignedReviewerId: null }
		: q.reviewerId
			? { assignedReviewerId: q.reviewerId }
			: {}),
	...(q.dateFrom || q.dateTo
		? {
				createdAt: {
					...(q.dateFrom ? { gte: q.dateFrom } : {}),
					...(q.dateTo ? { lte: q.dateTo } : {}),
				},
			}
		: {}),
	...(q.scoreMin != null || q.scoreMax != null
		? {
				qualitySnapshot: {
					score: {
						...(q.scoreMin != null ? { gte: q.scoreMin } : {}),
						...(q.scoreMax != null ? { lte: q.scoreMax } : {}),
					},
				},
			}
		: {}),
	...(q.search
		? {
				OR: [
					{ title: { contains: q.search, mode: "insensitive" } },
					{ publicRef: { contains: q.search, mode: "insensitive" } },
					{ internalReferenceCode: { contains: q.search, mode: "insensitive" } },
					{ licenseNumber: { contains: q.search, mode: "insensitive" } },
					{ city: { contains: q.search, mode: "insensitive" } },
					{ area: { contains: q.search, mode: "insensitive" } },
					{ company: { name: { contains: q.search, mode: "insensitive" } } },
					{ creator: { name: { contains: q.search, mode: "insensitive" } } },
				],
			}
		: {}),
});

const priceOf = (l: { salePrice: any; annualRent: any; monthlyRent: any; dailyRate: any; charterRate: any }) => {
	const p = l.salePrice ?? l.annualRent ?? l.monthlyRent ?? l.dailyRate ?? l.charterRate;
	return p != null ? Number(p) : null;
};

const actionRequiredFor = (l: any, now: number): string | null => {
	if (l.pendingChangesAt) return "Changes to the listing are waiting for review";
	if (l.approvalStatus === "CHANGES_REQUIRED") return "Partner must apply the requested changes";
	if (AWAITING.includes(l.approvalStatus)) return "Awaiting platform review";
	if (l.approvalStatus === "DRAFT") return "Draft — not submitted";
	if (l.approvalStatus === "REJECTED") return null;
	if (l.availability && l.availability.nextConfirmDue.getTime() < now) return "Availability confirmation overdue";
	if (l.expiresAt && l.expiresAt.getTime() - now < 30 * DAY) return "Expiring within 30 days";
	if (l.qualitySnapshot && l.qualitySnapshot.score < 50) return "Low quality score";
	return null;
};

export const getAdminListingRows = async (q: AdminListingQuery) => {
	const listings = await prisma.listing.findMany({
		where: buildWhere(q),
		take: MAX_ROWS,
		orderBy: { createdAt: "desc" },
		include: {
			company: { select: { id: true, name: true } },
			creator: { select: { id: true, name: true, email: true } },
			assignedReviewer: { select: { id: true, name: true } },
			qualitySnapshot: { select: { score: true, rating: true, calculatedAt: true } },
			rankSnapshot: { select: { visibilityLevel: true, percentile: true, calculatedAt: true } },
			availability: true,
		},
	});

	const companyIds = [...new Set(listings.map((l) => l.companyId))];
	const [metrics, owners, reviewers] = await Promise.all([
		getListingMetrics(listings.map((l) => l.id)),
		prisma.user.findMany({
			where: { companyId: { in: companyIds }, role: "company_owner" },
			select: { companyId: true, name: true },
		}),
		// Who last decided each listing, for listings with no assigned reviewer.
		prisma.user.findMany({
			where: { id: { in: [...new Set(listings.map((l) => l.reviewedById).filter((v): v is string => !!v))] } },
			select: { id: true, name: true },
		}),
	]);
	const ownerOf = new Map(owners.map((o) => [o.companyId, o.name]));
	const reviewerName = new Map(reviewers.map((r) => [r.id, r.name]));
	const now = Date.now();

	const rows = listings.map((l) => {
		const m = metrics.get(l.id);
		// Waiting since: the submission, or for an approved listing the edit.
		const waitingSince = !AWAITING.includes(l.approvalStatus) && l.pendingChangesAt ? l.pendingChangesAt : l.submittedAt ?? l.createdAt;
		const ageHours = Math.floor((now - waitingSince.getTime()) / 3600000);
		return {
			id: l.id,
			thumbnail: l.coverImageUrl ? toPublicUrl(l.coverImageUrl) : l.photoUrls[0] ? toPublicUrl(l.photoUrls[0]) : null,
			title: l.title,
			publicRef: l.publicRef,
			internalRef: l.internalReferenceCode,
			location: [l.area || l.operatingBase, l.city, l.country].filter(Boolean).join(", ") || null,
			category: l.category,
			categoryLabel: CATEGORY_LABELS[l.category] ?? l.category,
			offeringType: l.offeringType,
			offeringLabel: OFFERING_LABELS[l.offeringType] ?? l.offeringType,
			assetType: l.assetType,
			assetTypeLabel: assetTypeLabel(l.assetType),
			price: priceOf(l),
			priceOnRequest: l.priceOnRequest,
			currency: l.currency,
			company: l.company,
			owner: ownerOf.get(l.companyId) ?? null,
			assignedUser: l.creator,
			reviewer: l.assignedReviewer ?? (l.reviewedById ? { id: l.reviewedById, name: reviewerName.get(l.reviewedById) ?? "—" } : null),
			reviewerAssigned: !!l.assignedReviewer,
			approvalStatus: l.approvalStatus,
			approvalLabel: APPROVAL_LABELS[l.approvalStatus] ?? l.approvalStatus,
			publicationStatus: l.publicationStatus,
			publicationLabel: PUBLICATION_LABELS[l.publicationStatus] ?? l.publicationStatus,
			adminRejectionReason: l.adminRejectionReason,
			actionRequired: actionRequiredFor(l, now),
			views: m?.views ?? 0,
			enquiries: m?.enquiries ?? 0,
			conversionRate: m?.conversionRate ?? null,
			qualityScore: l.qualitySnapshot?.score ?? null,
			qualityRating: l.qualitySnapshot ? RATING_LABELS[l.qualitySnapshot.rating] ?? l.qualitySnapshot.rating : null,
			visibilityLevel: l.rankSnapshot ? VISIBILITY_LABELS[l.rankSnapshot.visibilityLevel] ?? l.rankSnapshot.visibilityLevel : null,
			visibilityBand: percentileBand(l.rankSnapshot?.percentile),
			lastCalculatedAt: l.qualitySnapshot?.calculatedAt ?? l.rankSnapshot?.calculatedAt ?? null,
			availability: l.availability
				? {
						isAvailable: l.availability.isAvailable,
						confirmedAt: l.availability.confirmedAt,
						nextConfirmDue: l.availability.nextConfirmDue,
					}
				: null,
			expiresAt: l.expiresAt,
			submittedAt: l.submittedAt,
			ageHours,
			overdue: (AWAITING.includes(l.approvalStatus) || !!l.pendingChangesAt) && ageHours > REVIEW_OVERDUE_HOURS,
			pendingChanges: !!l.pendingChangesAt,
			createdAt: l.createdAt,
			updatedAt: l.updatedAt,
		};
	});

	type Row = (typeof rows)[number];
	const num = (v: number | null) => (v == null ? -Infinity : v);
	const time = (d: Date | null) => (d ? d.getTime() : Infinity);
	const sorters: Record<string, (a: Row, b: Row) => number> = {
		newest: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
		oldest: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
		price_high: (a, b) => num(b.price) - num(a.price),
		price_low: (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
		quality: (a, b) => num(b.qualityScore) - num(a.qualityScore),
		visibility: (a, b) => {
			const order: Record<string, number> = { High: 3, Medium: 2, Low: 1, "Not Eligible": 0 };
			return (order[b.visibilityLevel ?? ""] ?? -1) - (order[a.visibilityLevel ?? ""] ?? -1);
		},
		views: (a, b) => b.views - a.views,
		enquiries: (a, b) => b.enquiries - a.enquiries,
		expiry: (a, b) => time(a.expiresAt) - time(b.expiresAt),
		waiting: (a, b) => time(a.submittedAt ?? a.createdAt) - time(b.submittedAt ?? b.createdAt),
	};
	rows.sort(sorters[q.sort ?? (q.queue ? "waiting" : "newest")] ?? sorters.newest);
	return rows;
};

export const getAdminListingTable = async (q: AdminListingQuery) => {
	const rows = await getAdminListingRows(q);
	const page = Math.max(1, q.page ?? 1);
	const limit = Math.min(100, Math.max(1, q.limit ?? 25));
	return {
		listings: rows.slice((page - 1) * limit, page * limit),
		summary: {
			overdue: rows.filter((r) => r.overdue).length,
			unassigned: rows.filter((r) => !r.reviewerAssigned).length,
		},
		pagination: { total: rows.length, page, limit, totalPages: Math.ceil(rows.length / limit) },
	};
};

const csvCell = (value: unknown) => {
	if (value == null) return "";
	const s = value instanceof Date ? value.toISOString() : String(value);
	return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (headers: string[], rows: unknown[][]) =>
	[headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");

export const exportAdminListingsCsv = async (q: AdminListingQuery) => {
	const rows = await getAdminListingRows(q);
	return toCsv(
		[
			"Reference", "Title", "Location", "Category", "Offering", "Asset type", "Price", "Currency",
			"Company", "Owner", "Assigned user", "Approval", "Publication", "Reviewer", "Action required",
			"Views", "Enquiries", "Conversion %", "Quality score", "Visibility", "Last calculated",
			"Available", "Availability due", "Expiry", "Created", "Updated",
		],
		rows.map((r) => [
			r.publicRef, r.title, r.location, r.categoryLabel, r.offeringLabel, r.assetTypeLabel,
			r.priceOnRequest ? "On request" : r.price, r.currency, r.company?.name, r.owner, r.assignedUser?.name,
			r.approvalLabel, r.publicationLabel, r.reviewer?.name, r.actionRequired, r.views, r.enquiries,
			r.conversionRate != null ? Math.round(r.conversionRate * 1000) / 10 : null, r.qualityScore,
			r.visibilityLevel, r.lastCalculatedAt, r.availability ? (r.availability.isAvailable ? "Yes" : "No") : null,
			r.availability?.nextConfirmDue, r.expiresAt, r.createdAt, r.updatedAt,
		]),
	);
};

const assertStaffReviewer = async (reviewerId: string) => {
	const reviewer = await prisma.user.findUnique({ where: { id: reviewerId }, select: { role: true, banned: true } });
	if (!reviewer || !["super_admin", "platform_reviewer"].includes(reviewer.role) || reviewer.banned) {
		throw new AppError("The reviewer must be an active platform staff member", 400);
	}
};

export const setListingReviewer = async (listingId: string, reviewerId: string | null, actorId: string) => {
	const listing = await prisma.listing.findUnique({ where: { id: listingId } });
	if (!listing) throw new AppError("Listing not found", 404);
	if (reviewerId) await assertStaffReviewer(reviewerId);
	const updated = await prisma.listing.update({
		where: { id: listingId },
		data: { assignedReviewerId: reviewerId },
		select: { id: true, assignedReviewer: { select: { id: true, name: true } } },
	});
	// Tell the newly assigned reviewer (not when assigning yourself).
	if (reviewerId && reviewerId !== actorId && reviewerId !== listing.assignedReviewerId) {
		await prisma.notification
			.create({
				data: {
					userId: reviewerId,
					priority: "ACTION_NEEDED",
					type: "listing_assigned",
					title: "Listing assigned to you",
					body: `"${listing.title}" was assigned to you for review.`,
					actionUrl: `/admin/listing-approvals?listing=${listingId}`,
				},
			})
			.catch((e) => console.error("Assignment notification failed:", e));
	}
	await prisma.auditLog.create({
		data: {
			actorId,
			companyId: listing.companyId,
			action: "listing.reviewer_assigned",
			entityType: "listing",
			entityId: listingId,
			previousValue: { assignedReviewerId: listing.assignedReviewerId },
			newValue: { assignedReviewerId: reviewerId },
		},
	});
	return updated;
};

export const addListingNote = async (listingId: string, body: string, isInternal: boolean, authorId: string) => {
	const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true, creatorId: true, title: true } });
	if (!listing) throw new AppError("Listing not found", 404);
	const note = await prisma.reviewNote.create({
		data: { entityType: "listing", listingId, authorId, body: body.trim(), isInternal },
		include: { author: { select: { id: true, name: true } } },
	});
	// A comment meant for the partner reaches them in the notification centre.
	if (!isInternal) {
		await prisma.notification.create({
			data: {
				userId: listing.creatorId,
				priority: "ACTION_NEEDED",
				type: "listing_review_comment",
				title: "Reviewer comment",
				body: `On "${listing.title}": ${body.trim()}`,
				actionUrl: `/listings/${listingId}`,
			},
		});
	}
	return note;
};
