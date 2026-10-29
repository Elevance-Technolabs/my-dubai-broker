import type { Request, Response } from "express";
import type { CreateCarData } from "../../types/cars.types.js";
import { AppError } from "../../utils/AppError.js";
import { sendSuccess } from "../../utils/response.js";
import * as carService from "./cars.service.js";

export const createCarHandler = async (req: Request, res: Response) => {
	const body = req.body as CreateCarData;
	const companyId = req.user.companyId;
	const creatorId = req.user.id;

	const carData: CreateCarData = {
		...body,
		currency: body.currency ?? "AED",
		companyId: companyId,
		creatorId: creatorId,
		...(body.videoUrl ? { videoUrl: body.videoUrl } : {}),
		...(body.internalReferenceCode
			? { internalReferenceCode: body.internalReferenceCode }
			: {}),
		...(body.licenseNumber ? { licenseNumber: body.licenseNumber } : {}),
		...(body.variant ? { variant: body.variant } : {}),
	} as any;

	const result = await carService.createCar(carData);
	sendSuccess(res, result, "Car created successfully", 201);
};

export const getCarsHandler = async (req: Request, res: Response) => {
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 10;

	const result = await carService.getCars(page, limit);
	sendSuccess(res, result, "Cars retrieved successfully");
};

export const getCarHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	if (!id) {
		throw new AppError("Car ID is required", 400);
	}
	const result = await carService.getCarById(id);
	if (!result) {
		throw new AppError("Car not found", 404);
	}
	sendSuccess(res, result);
};

export const updateCarHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	if (!id) {
		throw new AppError("Car ID is required", 400);
	}
	const body = req.body;
	const result = await carService.updateCar(id, body as any, {
		userId: req.user.id,
		companyId: req.user.companyId,
		role: req.user.role,
	});
	sendSuccess(res, result, "Car updated successfully");
};

export const deleteCarHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	if (!id) {
		throw new AppError("Car ID is required", 400);
	}
	await carService.deleteCar(id);
	sendSuccess(res, null, "Car deleted successfully");
};
