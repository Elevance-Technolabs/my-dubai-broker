import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth.js";
import { cacheSession, getCachedSession, sessionKeyOf } from "../lib/accessCache.js";

declare global {
	namespace Express {
		interface Request {
			user?: any;
			session?: any;
		}
	}
}

export const requireAuth = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		// The session lookup costs database round trips on every request; a
		// result from the last few seconds is reused (see lib/accessCache.ts).
		const key = sessionKeyOf(req.headers);
		const cached = getCachedSession(key);
		if (cached) {
			req.user = cached.user;
			req.session = cached.session;
			return next();
		}

		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers),
		});

		if (!session || !session.user) {
			return res.status(401).json({ error: "Unauthorized: Please log in." });
		}

		cacheSession(key, session.user, session.session);
		req.user = session.user;
		req.session = session.session;
		next();
	} catch (error) {
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

