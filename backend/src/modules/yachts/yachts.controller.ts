import type { Request, Response } from "express";

/**
 * DEPRECATED: Yacht listings are now managed through the unified /listings
 * API, which enforces permissions and company ownership. These legacy
 * endpoints had neither, so they are switched off.
 *
 * Use: POST /listings with category="YACHTS"
 */
const deprecatedResponse = async (_req: Request, res: Response) => {
	res.status(410).json({
		error: "Gone",
		message:
			"This endpoint has been replaced. Use the unified /listings API with category=YACHTS.",
		newEndpoint: "/listings",
	});
};

export const createYachtHandler = deprecatedResponse;
export const getYachtsHandler = deprecatedResponse;
export const getYachtHandler = deprecatedResponse;
export const updateYachtHandler = deprecatedResponse;
export const deleteYachtHandler = deprecatedResponse;
