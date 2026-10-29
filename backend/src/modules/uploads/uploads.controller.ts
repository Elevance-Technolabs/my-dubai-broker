import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";
import { sendSuccess } from "../../utils/response.js";
import * as uploadsService from "./uploads.service.js";

export const presignUploadHandler = async (req: Request, res: Response) => {
	const result = await uploadsService.createPresignedUpload(
		{ userId: req.user.id, companyId: req.user.companyId },
		req.body,
	);
	sendSuccess(res, result, "Upload URL created", 201);
};

export const deleteUploadHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	if (!id) {
		throw new AppError("Upload ID is required", 400);
	}
	await uploadsService.deleteUpload(req.user.id, id);
	sendSuccess(res, null, "Upload deleted");
};

export const presignPublicUploadHandler = async (
	req: Request,
	res: Response,
) => {
	const result = await uploadsService.createPresignedUpload(
		{ userId: null },
		req.body,
	);
	sendSuccess(res, result, "Upload URL created", 201);
};
