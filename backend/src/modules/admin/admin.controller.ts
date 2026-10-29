import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { AppError } from "../../utils/AppError.js";
import * as adminService from "./admin.service.js";
import { mapCompanyMedia } from "../companies/companies.mapper.js";
import { CompanyStatus, ApprovalStatus } from "../../../generated/prisma/client.js";

// ─── Overview ─────────────────────────────────────────────────

export const getPlatformStatsHandler = async (req: Request, res: Response) => {
	const stats = await adminService.getPlatformStats();
	sendSuccess(res, stats);
};

// ─── Company Queue ─────────────────────────────────────────────

export const getCompaniesHandler = async (req: Request, res: Response) => {
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 20;
	const status = req.query.status as CompanyStatus | undefined;
	const search = req.query.search as string | undefined;

	const result = await adminService.getCompanyQueue(page, limit, { status, search });
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
		role: req.query.role as any,
		search: req.query.search as string | undefined,
	});
	sendSuccess(res, result);
};

export const updateUserRoleHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const { role } = req.body;
	const updated = await adminService.updateUserRole(id, role, req.user.id);
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
