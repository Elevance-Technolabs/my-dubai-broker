import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";
import { sendSuccess } from "../../utils/response.js";
import * as companiesService from "./companies.service.js";
import { mapCompanyMedia } from "./companies.mapper.js";

export const updateOnboardingHandler = async (req: Request, res: Response) => {
	const company = await companiesService.updateOnboarding(req.body);
	sendSuccess(res, company, "Company account created successfully");
};

export const getOnboardingStatusHandler = async (
	req: Request,
	res: Response,
) => {
	const userId = req.user?.id;
	if (!userId) {
		return sendSuccess(res, { isCompleted: false }, "No active session");
	}
	const status = await companiesService.getOnboardingStatus(userId);
	if (!status) {
		throw new AppError("Company not found for user", 404);
	}
	sendSuccess(res, status, "Onboarding status retrieved successfully");
};

export const getMyCompanyHandler = async (req: Request, res: Response) => {
	const userId = req.user?.id;
	if (!userId) {
		throw new AppError("No active session", 401);
	}
	const company = await companiesService.getCompanyByUserId(userId);
	if (!company) {
		return sendSuccess(res, null, "No company found for user");
	}
	sendSuccess(
		res,
		await mapCompanyMedia(company),
		"Company retrieved successfully",
	);
};

// ─── Team management ────────────────────────────────────────────

export const getCompanyUsersHandler = async (req: Request, res: Response) => {
	const companyId = req.user.companyId as string | undefined;
	if (!companyId) throw new AppError("You must belong to a company.", 403);

	const users = await companiesService.getCompanyUsers(companyId);
	sendSuccess(res, users);
};

export const deactivateUserHandler = async (req: Request, res: Response) => {
	const companyId = req.user.companyId as string | undefined;
	if (!companyId) throw new AppError("You must belong to a company.", 403);
	const userId = req.params.userId as string;

	const result = await companiesService.deactivateUser(
		companyId,
		userId,
		req.user.id,
		req.body?.reason,
	);
	sendSuccess(res, result, "User deactivated");
};

export const updateUserPermissionsHandler = async (req: Request, res: Response) => {
	const companyId = req.user.companyId as string | undefined;
	if (!companyId) throw new AppError("You must belong to a company.", 403);
	const userId = req.params.userId as string;

	const updated = await companiesService.updateUserPermissions(
		companyId,
		userId,
		req.user.id,
		req.body.permissions,
	);
	sendSuccess(res, updated, "Permissions updated");
};

export const reactivateUserHandler = async (req: Request, res: Response) => {
	const companyId = req.user.companyId as string | undefined;
	if (!companyId) throw new AppError("You must belong to a company.", 403);
	const userId = req.params.userId as string;

	await companiesService.reactivateUser(companyId, userId, req.user.id);
	sendSuccess(res, null, "User reactivated");
};
