import type { Request, Response } from "express";
import { isReviewerOnly } from "../../middleware/permissions.js";
import { sendSuccess } from "../../utils/response.js";
import { AppError } from "../../utils/AppError.js";
import * as adminService from "./admin.service.js";
import * as adminInsights from "./admin.insights.js";
import { recalculateAllScores } from "../scoring/scoring.service.js";
import { mapCompanyMedia } from "../companies/companies.mapper.js";
import { CompanyStatus, ApprovalStatus } from "../../../generated/prisma/client.js";

// ─── Overview ─────────────────────────────────────────────────

/** A platform reviewer only sees what is assigned to them. */
const assignedToOf = (req: Request) => (isReviewerOnly(req.user.role) ? req.user.id : undefined);

export const getPlatformStatsHandler = async (req: Request, res: Response) => {
	const stats = await adminService.getPlatformStats(assignedToOf(req));
	sendSuccess(res, stats);
};

// ─── Company Queue ─────────────────────────────────────────────

export const getCompaniesHandler = async (req: Request, res: Response) => {
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 20;
	const result = await adminService.getCompanyQueue(page, limit, {
		assignedTo: assignedToOf(req),
		status: queryString(req, "status") as CompanyStatus | undefined,
		search: queryString(req, "search"),
		category: queryString(req, "category"),
		reviewerId: queryString(req, "reviewerId"),
		dateFrom: queryDate(req, "dateFrom"),
		dateTo: queryDate(req, "dateTo", true),
		sort: queryString(req, "sort"),
	});
	const companies = await Promise.all(result.companies.map(mapCompanyMedia));
	sendSuccess(res, { ...result, companies });
};

export const getCompanyByIdHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const company = await adminService.getCompanyById(id);
	if (!company) throw new AppError("Company not found", 404);
	sendSuccess(res, await mapCompanyMedia(company));
};

export const updateCompanyStatusHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const { status, rejectionReason, reason, internalNote } = req.body;
	const actorId = req.user.id;

	const company = await adminService.updateCompanyStatus(id, status, actorId, {
		rejectionReason,
		reason,
		internalNote,
	});
	sendSuccess(res, company, `Company status updated to ${status}`);
};

// ─── Listing Approval Queue ────────────────────────────────────

export const getListingApprovalQueueHandler = async (req: Request, res: Response) => {
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 20;

	const result = await adminService.getListingApprovalQueue(page, limit, {
		assignedTo: assignedToOf(req),
		approvalStatus: req.query.approvalStatus as ApprovalStatus | undefined,
		category: req.query.category as string | undefined,
		companyId: req.query.companyId as string | undefined,
		search: req.query.search as string | undefined,
	});
	sendSuccess(res, result);
};

// ─── Audit Log ─────────────────────────────────────────────────

export const getAuditLogHandler = async (req: Request, res: Response) => {
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 50;

	const result = await adminService.getAuditLog(page, limit, {
		entityType: req.query.entityType as string | undefined,
		actorId: req.query.actorId as string | undefined,
		companyId: req.query.companyId as string | undefined,
		from: req.query.from ? new Date(req.query.from as string) : undefined,
		to: req.query.to ? new Date(req.query.to as string) : undefined,
	});
	sendSuccess(res, result);
};

// ─── Platform-wide User Management ────────────────────────────

export const getAllUsersHandler = async (req: Request, res: Response) => {
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 50;

	const result = await adminService.getAllUsers(page, limit, {
		companyId: req.query.companyId as string | undefined,
		role: queryString(req, "role") as any,
		search: queryString(req, "search"),
		type: queryString(req, "type"),
		status: queryString(req, "status"),
	});
	sendSuccess(res, result);
};

export const updateUserRoleHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const { role, reason } = req.body;
	const updated = await adminService.updateUserRole(id, role, req.user.id, reason);
	sendSuccess(res, updated, "User role updated");
};

export const adminDeactivateUserHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const { reason } = req.body;
	const result = await adminService.adminDeactivateUser(id, req.user.id, reason);
	sendSuccess(res, result, "User deactivated");
};

export const adminReactivateUserHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	await adminService.adminReactivateUser(id, req.user.id);
	sendSuccess(res, null, "User reactivated");
};

// ─── Shared query parsing ─────────────────────────────────────

const queryString = (req: Request, key: string) => {
	const v = req.query[key];
	return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
};
const queryDate = (req: Request, key: string, endOfDay = false) => {
	const v = queryString(req, key);
	if (!v) return undefined;
	const d = new Date(endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T23:59:59.999Z` : v);
	return Number.isNaN(d.getTime()) ? undefined : d;
};

// ─── Reviewers, notes, documents ──────────────────────────────

export const getReviewersHandler = async (_req: Request, res: Response) => {
	sendSuccess(res, await adminService.getReviewers());
};

export const setCompanyReviewerHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	sendSuccess(res, await adminService.setCompanyReviewer(id, req.body.reviewerId ?? null, req.user.id), "Reviewer updated");
};

export const addCompanyNoteHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const note = await adminService.addCompanyNote(id, req.body.body, req.body.isInternal !== false, req.user.id);
	sendSuccess(res, note, "Note added", 201);
};

export const updateCompanyDocumentHandler = async (req: Request, res: Response) => {
	const { id, documentId } = req.params as { id: string; documentId: string };
	sendSuccess(res, await adminService.updateCompanyDocument(id, documentId, req.body, req.user.id), "Document updated");
};

// ─── Users: invite ────────────────────────────────────────────

export const adminInviteUserHandler = async (req: Request, res: Response) => {
	sendSuccess(res, await adminService.adminInviteUser(req.user.id, req.body), "Invitation sent", 201);
};

// ─── Leads, Reports, Configuration ────────────────────────────

export const getAdminLeadsHandler = async (req: Request, res: Response) => {
	sendSuccess(
		res,
		await adminInsights.getAdminLeads({
			page: Number(req.query.page) || 1,
			limit: Number(req.query.limit) || 25,
			companyId: queryString(req, "companyId"),
			stage: queryString(req, "stage"),
			assignedToId: queryString(req, "assignedToId"),
			overdueOnly: req.query.overdueOnly === "true",
			search: queryString(req, "search"),
			dateFrom: queryDate(req, "dateFrom"),
			dateTo: queryDate(req, "dateTo", true),
		}),
	);
};

const reportQuery = (req: Request) => ({
	from: queryDate(req, "from"),
	to: queryDate(req, "to", true),
	category: queryString(req, "category"),
	companyId: queryString(req, "companyId"),
});

export const getReportSummaryHandler = async (req: Request, res: Response) => {
	sendSuccess(res, await adminInsights.getReportSummary(reportQuery(req)));
};

export const exportReportHandler = async (req: Request, res: Response) => {
	const type = req.params.type as string;
	const csv = await adminInsights.exportReportCsv(type, reportQuery(req));
	res.setHeader("Content-Type", "text/csv; charset=utf-8");
	res.setHeader("Content-Disposition", `attachment; filename="${type}-report-${new Date().toISOString().slice(0, 10)}.csv"`);
	res.send(csv);
};

export const getConfigurationHandler = async (_req: Request, res: Response) => {
	sendSuccess(res, await adminInsights.getConfiguration());
};

export const updateQualityConfigHandler = async (req: Request, res: Response) => {
	const result = await adminInsights.updateQualityConfig(req.body.components, req.body.reason, req.user.id);
	sendSuccess(res, result, "Quality rules updated and scores recalculated");
};

export const updateRankingConfigHandler = async (req: Request, res: Response) => {
	const result = await adminInsights.updateRankingConfig(req.body.components, req.body.reason, req.user.id);
	sendSuccess(res, result, "Ranking rules updated and visibility recalculated");
};

export const recalculateScoresHandler = async (_req: Request, res: Response) => {
	sendSuccess(res, await recalculateAllScores(), "Scores recalculated");
};
