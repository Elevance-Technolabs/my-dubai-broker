import type { Request, Response } from "express";
import { isReviewerOnly } from "../../middleware/permissions.js";
import { AppError } from "../../utils/AppError.js";
import { CompanyCategory } from "../../../generated/prisma/client.js";
import { sendSuccess } from "../../utils/response.js";
import * as listingsService from "./listings.service.js";
import { refreshListingScores } from "../scoring/scoring.service.js";
import {
	addListingNote,
	exportAdminListingsCsv,
	getAdminListingTable,
	setListingReviewer,
	type AdminListingQuery,
} from "./listings.admin.js";
import { confirmAvailability, getListingInsights } from "./listings.insights.js";

const requesterOf = (req: Request) => ({
	userId: req.user.id,
	companyId: req.user.companyId,
	role: req.user.role,
});

// ─── Company-scoped listing management ───────────────────────

export const createListingHandler = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const listing = await listingsService.createListing(userId, req.body);
	// Scores update after the response; the Insights tab refreshes stale ones itself.
	void refreshListingScores(listing.id);
	sendSuccess(res, listing, "Listing created successfully", 201);
};

export const getCompanyListingsHandler = async (req: Request, res: Response) => {
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 10;
	const companyId = (req.params.companyId as string | undefined) ?? req.user.companyId;

	const result = await listingsService.getCompanyListings(companyId as string, page, limit, {
		approvalStatus: req.query.approvalStatus as any,
		publicationStatus: req.query.publicationStatus as any,
		category: req.query.category as any,
		creatorId: req.query.creatorId as string | undefined,
	});
	sendSuccess(res, result);
};

export const getMyListingsHandler = async (req: Request, res: Response) => {
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 20;
	const result = await listingsService.getMyListings(req.user.id, page, limit);
	sendSuccess(res, result);
};

export const getListingByIdHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const listing = await listingsService.getListingById(
		id,
		{
			userId: req.user.id,
			companyId: req.user.companyId,
			role: req.user.role,
		},
		{ withPending: req.query.pending === "true" },
	);
	if (!listing) throw new AppError("Listing not found", 404);
	sendSuccess(res, listing);
};

export const updateListingHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const listing = await listingsService.updateListing(id, req.body, {
		userId: req.user.id,
		companyId: req.user.companyId,
		role: req.user.role,
	});
	// Scores update after the response; the Insights tab refreshes stale ones itself.
	void refreshListingScores(id);
	sendSuccess(res, listing, "Listing updated successfully");
};

export const submitListingHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const listing = await listingsService.submitListing(id, {
		userId: req.user.id,
		companyId: req.user.companyId,
		role: req.user.role,
	});
	// Scores update after the response; the Insights tab refreshes stale ones itself.
	void refreshListingScores(id);
	sendSuccess(res, listing, "Listing submitted for review");
};

export const pauseListingHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	await listingsService.pauseListing(id, {
		userId: req.user.id,
		companyId: req.user.companyId,
		role: req.user.role,
	});
	// Scores update after the response; the Insights tab refreshes stale ones itself.
	void refreshListingScores(id);
	sendSuccess(res, null, "Listing paused");
};

const reasonOf = (req: Request) => (typeof req.body?.reason === "string" ? req.body.reason : undefined);

export const unpublishListingHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	await listingsService.unpublishListing(id, requesterOf(req), reasonOf(req));
	void refreshListingScores(id);
	sendSuccess(res, null, "Listing unpublished");
};

export const soldOutListingHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	await listingsService.markListingSoldOut(id, requesterOf(req), reasonOf(req));
	void refreshListingScores(id);
	sendSuccess(res, null, "Listing marked as sold out");
};

export const republishListingHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const listing = await listingsService.requestRepublish(id, requesterOf(req));
	sendSuccess(res, listing, "Sent for review. The listing goes live once it is approved.");
};

export const approvePendingChangesHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	await listingsService.approvePendingChanges(id, req.user.id, reasonOf(req));
	// Scores update after the response; the Insights tab refreshes stale ones itself.
	void refreshListingScores(id);
	sendSuccess(res, null, "Changes approved");
};

export const rejectPendingChangesHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	await listingsService.rejectPendingChanges(id, req.user.id, reasonOf(req) ?? "");
	sendSuccess(res, null, "Changes rejected");
};

export const deleteListingHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	await listingsService.deleteListing(
		id,
		{
			userId: req.user.id,
			companyId: req.user.companyId,
			role: req.user.role,
		},
		typeof req.body?.reason === "string" ? req.body.reason : undefined,
	);
	// A deleted listing has no score to show; only the other listings'
	// positions change, so that runs after the response (it logs its own errors).
	void refreshListingScores(id);
	sendSuccess(res, null, "Listing deleted");
};

// ─── Admin ───────────────────────────────────────────────────

const parseAdminListingQuery = (req: Request): AdminListingQuery => {
	const q = req.query as Record<string, string | undefined>;
	const num = (v?: string) => (v != null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : undefined);
	const date = (v?: string, endOfDay = false) => {
		if (!v) return undefined;
		const d = new Date(endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T23:59:59.999Z` : v);
		return Number.isNaN(d.getTime()) ? undefined : d;
	};
	return {
		// A platform reviewer only sees listings assigned to them.
		assignedTo: isReviewerOnly(req.user.role) ? req.user.id : undefined,
		page: num(q.page),
		limit: num(q.limit),
		search: q.search?.trim() || undefined,
		category: q.category || undefined,
		offeringType: q.offeringType || undefined,
		assetType: q.assetType || undefined,
		companyId: q.companyId || undefined,
		creatorId: q.creatorId || undefined,
		reviewerId: q.reviewerId || undefined,
		approvalStatus: q.approvalStatus || undefined,
		publicationStatus: q.publicationStatus || undefined,
		scoreMin: num(q.scoreMin),
		scoreMax: num(q.scoreMax),
		dateFrom: date(q.dateFrom),
		dateTo: date(q.dateTo, true),
		sort: q.sort || undefined,
		queue: q.queue === "true",
		listingId: typeof q.listing === "string" && q.listing ? q.listing : undefined,
	};
};

export const getAdminListingsHandler = async (req: Request, res: Response) => {
	sendSuccess(res, await getAdminListingTable(parseAdminListingQuery(req)));
};

export const exportAdminListingsHandler = async (req: Request, res: Response) => {
	const csv = await exportAdminListingsCsv(parseAdminListingQuery(req));
	res.setHeader("Content-Type", "text/csv; charset=utf-8");
	res.setHeader("Content-Disposition", `attachment; filename="listings-${new Date().toISOString().slice(0, 10)}.csv"`);
	res.send(csv);
};

export const setListingReviewerHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	sendSuccess(res, await setListingReviewer(id, req.body.reviewerId ?? null, req.user.id), "Reviewer updated");
};

export const addListingNoteHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const note = await addListingNote(id, req.body.body, req.body.isInternal !== false, req.user.id);
	sendSuccess(res, note, "Note added", 201);
};

export const getListingInsightsHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	sendSuccess(res, await getListingInsights(id, requesterOf(req)));
};

export const confirmAvailabilityHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const availability = await confirmAvailability(id, requesterOf(req), req.body?.isAvailable !== false);
	sendSuccess(res, availability, "Availability updated");
};

export const updateApprovalStatusHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const { status, rejectionReason, internalNote, reason } = req.body;
	const listing = await listingsService.updateApprovalStatus(id, status, req.user.id, {
		rejectionReason,
		internalNote,
		reason,
	});
	// Scores update after the response; the Insights tab refreshes stale ones itself.
	void refreshListingScores(id);
	sendSuccess(res, listing, "Listing approval status updated");
};

// ─── Public ──────────────────────────────────────────────────

export const getPublicListingsHandler = async (req: Request, res: Response) => {
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 10;
	// The website sends categoryType; anything that isn't a real category is
	// a 400 (it used to reach the database and fail with a 500).
	const category = (req.query.category ?? req.query.categoryType) as string | undefined;
	if (category && !(Object.values(CompanyCategory) as string[]).includes(category)) {
		throw new AppError("Unknown listing category.", 400);
	}
	const result = await listingsService.getPublicListings(page, limit, {
		category: category as CompanyCategory | undefined,
		excludeId: req.query.excludeId as string | undefined,
	});
	sendSuccess(res, result);
};

export const getPublicListingByIdHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const listing = await listingsService.getPublicListingById(id);
	if (!listing) throw new AppError("Listing not found", 404);
	sendSuccess(res, listing);
};

// ─── Backwards compatibility aliases ─────────────────────────
export const getListingsHandler = getCompanyListingsHandler;
export const getSellerListingsHandler = getMyListingsHandler;
export const updateListingStatusHandler = updateApprovalStatusHandler;
