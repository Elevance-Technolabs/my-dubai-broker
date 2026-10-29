import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";
import { sendSuccess } from "../../utils/response.js";
import * as listingsService from "./listings.service.js";

// ─── Company-scoped listing management ───────────────────────

export const createListingHandler = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const listing = await listingsService.createListing(userId, req.body);
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
	const listing = await listingsService.getListingById(id);
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
	sendSuccess(res, listing, "Listing updated successfully");
};

export const submitListingHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const listing = await listingsService.submitListing(id, req.user.id);
	sendSuccess(res, listing, "Listing submitted for review");
};

export const pauseListingHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	await listingsService.pauseListing(id, req.user.id);
	sendSuccess(res, null, "Listing paused");
};

export const archiveListingHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const { reason } = req.body;
	await listingsService.archiveListing(id, req.user.id, reason);
	sendSuccess(res, null, "Listing archived");
};

// ─── Admin ───────────────────────────────────────────────────

export const getAdminListingsHandler = async (req: Request, res: Response) => {
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 50;
	const result = await listingsService.getAdminListings(page, limit, {
		approvalStatus: req.query.approvalStatus as any,
		publicationStatus: req.query.publicationStatus as any,
		category: req.query.category as any,
		companyId: req.query.companyId as string | undefined,
		search: req.query.search as string | undefined,
	});
	sendSuccess(res, result);
};

export const updateApprovalStatusHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const { status, rejectionReason, internalNote, reason } = req.body;
	const listing = await listingsService.updateApprovalStatus(id, status, req.user.id, {
		rejectionReason,
		internalNote,
		reason,
	});
	sendSuccess(res, listing, "Listing approval status updated");
};

// ─── Public ──────────────────────────────────────────────────

export const getPublicListingsHandler = async (req: Request, res: Response) => {
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 10;
	const result = await listingsService.getPublicListings(page, limit, {
		category: (req.query.category ?? req.query.categoryType) as any,
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
