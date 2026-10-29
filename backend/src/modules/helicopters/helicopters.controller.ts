import type { Request, Response } from "express";

const deprecatedResponse = async (_req: Request, res: Response) => {
	res.status(410).json({
		error: "Gone",
		message:
			"This endpoint has been replaced. Use the unified /listings API with category=PRIVATE_AVIATION and assetType=HELICOPTER.",
		newEndpoint: "/listings",
	});
};

export const createHelicopterHandler = deprecatedResponse;
export const getHelicoptersHandler = deprecatedResponse;
export const getHelicopterHandler = deprecatedResponse;
export const updateHelicopterHandler = deprecatedResponse;
export const deleteHelicopterHandler = deprecatedResponse;
