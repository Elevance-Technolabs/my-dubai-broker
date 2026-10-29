import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";

// TEMPORARILY DISABLED for local testing — flip back to `true` to re-enable.
const RATE_LIMIT_ENABLED = false;

export const rateLimit = (maxRequests: number, windowMs: number) => {
	const hits = new Map<string, { count: number; resetAt: number }>();

	return (req: Request, _res: Response, next: NextFunction) => {
		if (!RATE_LIMIT_ENABLED) return next();

		const now = Date.now();
		if (hits.size > 10_000) {
			for (const [key, value] of hits) {
				if (value.resetAt <= now) hits.delete(key);
			}
		}
		const ip = req.ip ?? "unknown";
		const entry = hits.get(ip);

		if (!entry || entry.resetAt <= now) {
			hits.set(ip, { count: 1, resetAt: now + windowMs });
			return next();
		}

		if (entry.count >= maxRequests) {
			return next(new AppError("Too many requests. Try again later.", 429));
		}

		entry.count++;
		next();
	};
};
