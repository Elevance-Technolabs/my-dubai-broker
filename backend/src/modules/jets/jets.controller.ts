import type { Request, Response } from "express";

/**
 * DEPRECATED: All Private Aviation listings (jets, helicopters) are now managed
 * through the unified /listings API.
 *
 * Use: POST /listings with category="PRIVATE_AVIATION" and assetType="JET"|"HELICOPTER"
 */
const deprecatedResponse = async (_req: Request, res: Response) => {
	res.status(410).json({
		error: "Gone",
		message:
			"This endpoint has been replaced. Use the unified /listings API with category=PRIVATE_AVIATION and assetType=JET or HELICOPTER.",
		newEndpoint: "/listings",
	});
};

export const createJetHandler = deprecatedResponse;
export const getJetsHandler = deprecatedResponse;
export const getJetHandler = deprecatedResponse;
export const updateJetHandler = deprecatedResponse;
export const deleteJetHandler = deprecatedResponse;
