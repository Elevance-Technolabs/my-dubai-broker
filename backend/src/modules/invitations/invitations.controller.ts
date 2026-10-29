import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { AppError } from "../../utils/AppError.js";
import * as invitationsService from "./invitations.service.js";

export const createInvitationHandler = async (req: Request, res: Response) => {
	const companyId = req.user.companyId as string | undefined;
	if (!companyId) throw new AppError("You must belong to a company to invite team members.", 403);

	const invitation = await invitationsService.createInvitation(companyId, req.user.id, req.body);
	sendSuccess(res, invitation, "Invitation sent", 201);
};

export const listInvitationsHandler = async (req: Request, res: Response) => {
	const companyId = req.user.companyId as string | undefined;
	if (!companyId) throw new AppError("You must belong to a company to view invitations.", 403);

	const invitations = await invitationsService.listInvitations(companyId);
	sendSuccess(res, invitations);
};

export const revokeInvitationHandler = async (req: Request, res: Response) => {
	const companyId = req.user.companyId as string | undefined;
	if (!companyId) throw new AppError("You must belong to a company to manage invitations.", 403);
	const id = req.params.id as string;

	const invitation = await invitationsService.revokeInvitation(id, companyId, req.user.id);
	sendSuccess(res, invitation, "Invitation revoked");
};

// ─── Public (invited user has no account/session yet) ─────────

export const getInvitationByTokenHandler = async (req: Request, res: Response) => {
	const token = req.params.token as string;
	const invitation = await invitationsService.getInvitationByToken(token);
	sendSuccess(res, invitation);
};

export const acceptInvitationHandler = async (req: Request, res: Response) => {
	const token = req.params.token as string;
	const user = await invitationsService.acceptInvitation(token, req.body);
	sendSuccess(res, user, "Invitation accepted", 201);
};
