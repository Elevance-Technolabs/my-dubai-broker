import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth.js";

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
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers),
		});

		if (!session || !session.user) {
			return res.status(401).json({ error: "Unauthorized: Please log in." });
		}

		req.user = session.user;
		req.session = session.session;
		next();
	} catch (error) {
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

