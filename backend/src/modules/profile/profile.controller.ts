import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import * as profileService from "./profile.service.js";

export const getMyProfileHandler = async (req: Request, res: Response) => {
	const result = await profileService.getMyProfile(req.user.id);
	sendSuccess(res, result);
};

export const updateMyProfileHandler = async (req: Request, res: Response) => {
	const profile = await profileService.updateMyProfile(req.user.id, req.body);
	sendSuccess(res, profile, "Profile updated");
};
