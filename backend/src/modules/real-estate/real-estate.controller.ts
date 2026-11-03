import type { Request, Response } from "express";

/**
 * DEPRECATED: Real estate listings are now managed through the unified
 * /listings API, which enforces permissions and company ownership. These
 * legacy endpoints had neither, so they are switched off.
 *
 * Use: POST /listings with category="REAL_ESTATE"
 */
const deprecatedResponse = async (_req: Request, res: Response) => {
	res.status(410).json({
		error: "Gone",
		message:
			"This endpoint has been replaced. Use the unified /listings API with category=REAL_ESTATE.",
		newEndpoint: "/listings",
	});
};

export const createRealEstateHandler = deprecatedResponse;
export const getRealEstateListingsHandler = deprecatedResponse;
export const getRealEstateByIdHandler = deprecatedResponse;
export const updateRealEstateHandler = deprecatedResponse;
export const deleteRealEstateHandler = deprecatedResponse;
