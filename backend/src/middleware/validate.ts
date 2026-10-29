import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";
import { sendError } from "../utils/response.js";

type ValidationSchema = {
	body?: ZodSchema;
	query?: ZodSchema;
	params?: ZodSchema;
};

export const validate =
	(schema: ValidationSchema) =>
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (schema.body) {
				await schema.body.parseAsync(req.body);
			}

			if (schema.query) {
				await schema.query.parseAsync(req.query);
			}

			if (schema.params) {
				await schema.params.parseAsync(req.params);
			}

			next();
		} catch (error) {
			if (error instanceof ZodError) {
				return sendError(res, "Validation error", 400, {
					fields: error.flatten().fieldErrors,
				});
			}

			next(error);
		}
	};
