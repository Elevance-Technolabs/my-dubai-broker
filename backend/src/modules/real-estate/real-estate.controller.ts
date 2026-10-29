import type { Request, Response } from "express";
import type { CreateRealEstateData } from "../../types/real-estate.types.js";
import { AppError } from "../../utils/AppError.js";
import { sendSuccess } from "../../utils/response.js";
import * as realEstateService from "./real-estate.service.js";

export const createRealEstateHandler = async (req: Request, res: Response) => {
	const body = req.body as CreateRealEstateData;

	const companyId = req.user.companyId;
	const creatorId = req.user.id;

	const realEstateData: CreateRealEstateData = {
		...body,
		currency: body.currency ?? "AED",
		companyId: companyId,
		creatorId: creatorId,
		...(body.videoUrl ? { videoUrl: body.videoUrl } : {}),
		...(body.internalReferenceCode
			? { internalReferenceCode: body.internalReferenceCode }
			: {}),
		...(body.licenseNumber ? { licenseNumber: body.licenseNumber } : {}),

		// Real Estate Fields - optional ones need explicit handling if not in body
		...(body.permitNumber ? { permitNumber: body.permitNumber } : {}),
		...(body.bedrooms ? { bedrooms: body.bedrooms } : {}),
		...(body.bathrooms ? { bathrooms: body.bathrooms } : {}),
		...(body.builtUpArea ? { builtUpArea: body.builtUpArea } : {}),
		...(body.plotArea ? { plotArea: body.plotArea } : {}),
		...(body.floor ? { floor: body.floor } : {}),
		...(body.parking ? { parking: body.parking } : {}),
		...(body.developer ? { developer: body.developer } : {}),
		...(body.furnished !== undefined ? { furnished: body.furnished } : {}),
		...(body.paymentPlan ? { paymentPlan: body.paymentPlan } : {}),
		...(body.views ? { views: body.views } : {}),
		...(body.outdoor ? { outdoor: body.outdoor } : {}),
		...(body.indoor ? { indoor: body.indoor } : {}),
		...(body.community ? { community: body.community } : {}),
		...(body.propertyTags ? { propertyTags: body.propertyTags } : {}),
	} as any;

	const result = await realEstateService.createRealEstate(realEstateData);
	sendSuccess(res, result, "Real Estate listing created successfully", 201);
};

export const getRealEstateListingsHandler = async (
	req: Request,
	res: Response,
) => {
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 10;

	// Extract filters from query if needed (validation handles transformation)
	const filters: { propertyType?: string; bedrooms?: number } = {};
	if (req.query.propertyType)
		filters.propertyType = req.query.propertyType as string;
	if (req.query.bedrooms) filters.bedrooms = Number(req.query.bedrooms);

	const result = await realEstateService.getRealEstateListings(
		page,
		limit,
		filters,
	);
	sendSuccess(res, result, "Real Estate listings retrieved successfully");
};

export const getRealEstateByIdHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	if (!id) {
		throw new AppError("Listing ID is required", 400);
	}
	const result = await realEstateService.getRealEstateById(id);
	if (!result) {
		throw new AppError("Listing not found", 404);
	}
	sendSuccess(res, result);
};

export const updateRealEstateHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	if (!id) {
		throw new AppError("Listing ID is required", 400);
	}
	const body = req.body;
	const result = await realEstateService.updateRealEstate(id, body as any, {
		userId: req.user.id,
		companyId: req.user.companyId,
		role: req.user.role,
	});
	sendSuccess(res, result, "Listing updated successfully");
};

export const deleteRealEstateHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	if (!id) {
		throw new AppError("Listing ID is required", 400);
	}
	await realEstateService.deleteRealEstate(id);
	sendSuccess(res, null, "Listing deleted successfully");
};
