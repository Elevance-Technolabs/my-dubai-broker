import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodIssue, type ZodSchema } from "zod";

type ValidationSchema = {
	body?: ZodSchema;
	query?: ZodSchema;
	params?: ZodSchema;
};

export type FieldError = { field: string; message: string };

// zod's built-in (developer-facing) messages all start with one of these.
// Anything else was written by the schema author and is used verbatim.
const DEFAULT_MESSAGE =
	/^(Too small:|Too big:|Invalid input|Invalid option|Invalid URL|Invalid email address|Invalid string|Invalid number|Invalid (?:input|value))/;

const issueMessage = (issue: ZodIssue): string => {
	const i = issue as any;
	const isDefault = DEFAULT_MESSAGE.test(issue.message);
	// "Invalid email address" is zod's default AND a message we use ourselves —
	// both read fine, so only translate when we have something better.
	if (!isDefault) return issue.message;

	switch (i.code) {
		case "too_small": {
			if (i.origin === "string") {
				return `must be at least ${i.minimum} character${i.minimum === 1 ? "" : "s"}`;
			}
			if (i.origin === "array" || i.origin === "set") {
				return `select at least ${i.minimum}`;
			}
			if (i.origin === "number" || i.origin === "bigint") {
				return i.inclusive === false && Number(i.minimum) === 0
					? "must be greater than 0"
					: i.inclusive === false
						? `must be greater than ${i.minimum}`
						: `must be at least ${i.minimum}`;
			}
			return issue.message;
		}
		case "too_big": {
			if (i.origin === "string") {
				return `must be at most ${i.maximum} characters`;
			}
			if (i.origin === "array" || i.origin === "set") {
				return `select at most ${i.maximum}`;
			}
			return `must be at most ${i.maximum}`;
		}
		case "invalid_format":
			if (i.format === "email") return "must be a valid email address";
			if (i.format === "url") return "must be a valid URL (including https://)";
			if (i.format === "uuid") return "is not valid";
			return "is not in the expected format";
		case "invalid_value":
			return "is not a valid option";
		case "invalid_type":
			return /received undefined/.test(issue.message)
				? "is required"
				: `must be a valid ${i.expected ?? "value"}`;
		default:
			return issue.message;
	}
};

const humanize = (segment: string) =>
	segment
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/[_-]+/g, " ")
		.trim()
		.replace(/^./, (c) => c.toUpperCase());

const labelFor = (path: PropertyKey[]) => {
	const last = [...path].reverse().find((p) => typeof p === "string");
	return last ? humanize(String(last)) : "Request";
};

export const formatZodIssues = (error: ZodError) => {
	// Custom sentences ("Company name is required") stand on their own;
	// translated fragments ("must be at least 5 characters") get the field label.
	const parts = error.issues.map((issue) => {
		const translated = DEFAULT_MESSAGE.test(issue.message);
		const text = issueMessage(issue);
		const label = labelFor(issue.path);
		return {
			field: issue.path.join("."),
			message: translated && text !== issue.message ? `${label} ${text}` : text,
		};
	});

	const errors: FieldError[] = parts;
	const summary = parts
		.slice(0, 3)
		.map((p) => p.message)
		.join("; ");
	const more = parts.length > 3 ? ` (+${parts.length - 3} more)` : "";

	return { errors, message: `Please correct: ${summary}${more}` };
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
				// Written directly (not via sendError, which strips extra detail in
				// production): field messages aren't sensitive and the client needs
				// them to highlight the offending inputs.
				const { errors, message } = formatZodIssues(error);
				return res.status(400).json({
					success: false,
					message,
					errors,
				});
			}

			next(error);
		}
	};
