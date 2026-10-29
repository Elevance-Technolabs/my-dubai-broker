import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import * as leadsService from "./leads.service.js";

export const createLeadHandler = async (req: Request, res: Response) => {
	const lead = await leadsService.createLead(req.body);
	sendSuccess(res, { id: lead.id }, "Enquiry submitted", 201);
};

export const getMyLeadsHandler = async (req: Request, res: Response) => {
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 20;
	const result = await leadsService.getMyLeads(req.user.id, page, limit, {
		stage: req.query.stage as string | undefined,
	});
	sendSuccess(res, result);
};

export const getCompanyLeadsHandler = async (req: Request, res: Response) => {
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 20;
	const companyId = req.user.companyId as string | undefined;
	if (!companyId) return sendSuccess(res, { leads: [], pagination: { total: 0, page, limit, totalPages: 0 } });

	const result = await leadsService.getCompanyLeads(companyId, page, limit, {
		stage: req.query.stage as string | undefined,
		assignedToId: req.query.assignedToId as string | undefined,
	});
	sendSuccess(res, result);
};

export const getLeadByIdHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const lead = await leadsService.getLeadById(id, {
		userId: req.user.id,
		companyId: req.user.companyId,
		role: req.user.role,
	});
	sendSuccess(res, lead);
};

export const updateLeadStageHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const { stage, note } = req.body;
	const lead = await leadsService.updateLeadStage(
		id,
		stage,
		{ userId: req.user.id, companyId: req.user.companyId, role: req.user.role },
		note,
	);
	sendSuccess(res, lead, "Lead stage updated");
};

export const addLeadActivityHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const { type, note } = req.body;
	const activity = await leadsService.addLeadActivity(
		id,
		{ userId: req.user.id, companyId: req.user.companyId, role: req.user.role },
		type,
		note,
	);
	sendSuccess(res, activity, "Activity logged", 201);
};

export const assignLeadHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const { assigneeId } = req.body;
	const lead = await leadsService.assignLead(id, assigneeId, {
		userId: req.user.id,
		companyId: req.user.companyId,
		role: req.user.role,
	});
	sendSuccess(res, lead, "Lead reassigned");
};
