import type { Response } from "express";

export const sendSuccess = (
	res: Response,
	data: any = null,
	message = "OK",
	status = 200,
) => {
	res.status(status).json({ success: true, message, data });
};

export const sendError = (
	res: Response,
	message = "Something went wrong",
	status = 500,
	error?: any,
) => {
	const isProd = process.env.NODE_ENV === "production";
	res.status(status).json({
		success: false,
		message,
		error: isProd ? undefined : error,
	});
};
