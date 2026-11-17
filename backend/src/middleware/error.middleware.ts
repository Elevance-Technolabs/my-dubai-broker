import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";
import { sendError } from "../utils/response.js";

export const globalErrorHandler = (
	err: any,
	_req: Request,
	res: Response,
	_next: NextFunction,
) => {
	console.error("Global Error Handler:", err);

	if (err instanceof AppError) {
		sendError(res, err.message, err.statusCode, err);
		return;
	}

	if (err instanceof ZodError) {
		const message = err.issues.map((i: any) => i.message).join(", ");
		sendError(res, `Validation Error: ${message}`, 400, err);
		return;
	}

	// Handle special better-auth error structure if it surfaces
	if (err.body && err.body.message) {
		sendError(res, err.body.message, err.statusCode || 400, err);
		return;
	}

	// Anything else is unexpected: the details (e.g. a database error with the
	// full query) stay in the server log, the client gets a plain message.
	const status = err.statusCode || 500;
	sendError(
		res,
		status >= 500 ? "Something went wrong. Please try again." : err.message || "Something went wrong",
		status,
		err,
	);
};
