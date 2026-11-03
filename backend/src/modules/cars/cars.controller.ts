import type { Request, Response } from "express";

/**
 * DEPRECATED: Car listings are now managed through the unified /listings API,
 * which enforces permissions and company ownership. These legacy endpoints
 * had neither, so they are switched off.
 *
 * Use: POST /listings with category="CARS"
 */
const deprecatedResponse = async (_req: Request, res: Response) => {
	res.status(410).json({
		error: "Gone",
		message:
			"This endpoint has been replaced. Use the unified /listings API with category=CARS.",
		newEndpoint: "/listings",
	});
};

export const createCarHandler = deprecatedResponse;
export const getCarsHandler = deprecatedResponse;
export const getCarHandler = deprecatedResponse;
export const updateCarHandler = deprecatedResponse;
export const deleteCarHandler = deprecatedResponse;
