import { fromNodeHeaders } from "better-auth/node";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { auth } from "../../lib/auth.js";
import { rateLimit } from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import { prisma } from "../../prisma/client.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";

/**
 * Public performance tracking (plan Section 16). The website sends
 * impressions, detail views and contact clicks here. Views by platform
 * staff or by the listing's own company are stored but flagged so they
 * never count, and a repeated view from the same browser session within
 * 30 minutes is ignored.
 */

const TRACKED_EVENTS = [
	"IMPRESSION",
	"LISTING_VIEW",
	"PHONE_REVEAL",
	"CALL_CLICK",
	"WHATSAPP_CLICK",
	"EMAIL_CLICK",
	"FAVOURITE",
	"SHARE",
] as const;

const DEDUPE_WINDOW_MS = 30 * 60 * 1000;

const trackEventsSchema = z.object({
	events: z
		.array(
			z.object({
				listingId: z.string().min(1).max(64),
				eventType: z.enum(TRACKED_EVENTS),
				sessionRef: z.string().max(64).optional(),
				sourcePage: z.string().max(300).optional(),
				searchQuery: z.string().max(200).optional(),
			}),
		)
		.min(1, "At least one event is required")
		.max(50, "Send at most 50 events at a time"),
});

const trackEventsHandler = async (req: Request, res: Response) => {
	const { events } = req.body as z.infer<typeof trackEventsSchema>;

	let viewer: { role?: string; companyId?: string | null } | null = null;
	try {
		const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
		viewer = (session?.user as any) ?? null;
	} catch {
		viewer = null;
	}
	const viewerIsStaff = viewer?.role === "super_admin" || viewer?.role === "platform_reviewer";

	// Only approved, live listings can be tracked.
	const listings = await prisma.listing.findMany({
		where: {
			id: { in: [...new Set(events.map((e) => e.listingId))] },
			approvalStatus: "APPROVED",
			publicationStatus: "LIVE",
		},
		select: { id: true, companyId: true },
	});
	const companyOf = new Map(listings.map((l) => [l.id, l.companyId]));
	const since = new Date(Date.now() - DEDUPE_WINDOW_MS);

	let recorded = 0;
	for (const e of events) {
		const companyId = companyOf.get(e.listingId);
		if (!companyId) continue;

		if (e.sessionRef && e.eventType !== "IMPRESSION") {
			const repeat = await prisma.performanceEvent.findFirst({
				where: {
					listingId: e.listingId,
					eventType: e.eventType,
					sessionRef: e.sessionRef,
					createdAt: { gte: since },
				},
				select: { id: true },
			});
			if (repeat) continue;
		}

		await prisma.performanceEvent.create({
			data: {
				listingId: e.listingId,
				companyId,
				eventType: e.eventType,
				sessionRef: e.sessionRef,
				sourcePage: e.sourcePage,
				searchQuery: e.searchQuery,
				isAuthenticated: !!viewer,
				isStaff: viewerIsStaff || (!!viewer?.companyId && viewer.companyId === companyId),
			},
		});
		recorded++;
	}

	sendSuccess(res, { recorded }, "Events recorded", 201);
};

const router: Router = Router();

router.post(
	"/",
	rateLimit(300, 60 * 60 * 1000),
	validate({ body: trackEventsSchema }),
	asyncHandler(trackEventsHandler),
);

export default router;
