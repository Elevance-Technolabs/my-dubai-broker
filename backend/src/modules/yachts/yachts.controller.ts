import type { Request, Response } from "express";
import type { CreateYachtData } from "../../types/yachts.types.js";
import { AppError } from "../../utils/AppError.js";
import { sendSuccess } from "../../utils/response.js";
import * as yachtService from "./yachts.service.js";

export const createYachtHandler = async (req: Request, res: Response) => {
	const body = req.body as CreateYachtData;

	const companyId = req.user.companyId;
	const creatorId = req.user.id;

	const yachtData: CreateYachtData = {
		...body,
		currency: body.currency ?? "AED",
		companyId: companyId,
		creatorId: creatorId,
		...(body.videoUrl ? { videoUrl: body.videoUrl } : {}),
		...(body.internalReferenceCode
			? { internalReferenceCode: body.internalReferenceCode }
			: {}),
		...(body.licenseNumber ? { licenseNumber: body.licenseNumber } : {}),
		...(body.beam ? { beam: body.beam } : {}),
		...(body.crewInfo ? { crewInfo: body.crewInfo } : {}),
		...(body.engineHours ? { engineHours: body.engineHours } : {}),
		...(body.cabins ? { cabins: body.cabins } : {}),
		...(body.materials ? { materials: body.materials } : {}),
		...(body.navigation ? { navigation: body.navigation } : {}),
	} as any;

	const result = await yachtService.createYacht(yachtData);
	sendSuccess(res, result, "Yacht created successfully", 201);
};

export const getYachtsHandler = async (req: Request, res: Response) => {
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 10;

	const result = await yachtService.getYachts(page, limit);
	sendSuccess(res, result, "Yachts retrieved successfully");
};

export const getYachtHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	if (!id) {
		throw new AppError("Yacht ID is required", 400);
	}
	const result = await yachtService.getYachtById(id);
	if (!result) {
		throw new AppError("Yacht not found", 404);
	}
	sendSuccess(res, result);
};

export const updateYachtHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	if (!id) {
		throw new AppError("Yacht ID is required", 400);
	}
	const body = req.body;
	const result = await yachtService.updateYacht(id, body as any, {
		userId: req.user.id,
		companyId: req.user.companyId,
		role: req.user.role,
	});
	sendSuccess(res, result, "Yacht updated successfully");
};

export const deleteYachtHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	if (!id) {
		throw new AppError("Yacht ID is required", 400);
	}
	await yachtService.deleteYacht(id);
	sendSuccess(res, null, "Yacht deleted successfully");
};
