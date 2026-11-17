import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { userHasCapability } from "../../middleware/permissions.js";
import { UserRole } from "../../../generated/prisma/client.js";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../utils/AppError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";

/** In-app notification centre (plan Section 17): each user sees only their own. */

const listHandler = async (req: Request, res: Response) => {
	const page = Math.max(1, Number(req.query.page) || 1);
	const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
	const unreadOnly = req.query.unreadOnly === "true";
	const where = { userId: req.user.id, ...(unreadOnly ? { readAt: null } : {}) };

	const [notifications, total, unreadCount] = await Promise.all([
		prisma.notification.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * limit,
			take: limit,
		}),
		prisma.notification.count({ where }),
		prisma.notification.count({ where: { userId: req.user.id, readAt: null } }),
	]);

	sendSuccess(res, {
		notifications,
		unreadCount,
		pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
	});
};

const markReadHandler = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const notification = await prisma.notification.findUnique({ where: { id } });
	if (!notification || notification.userId !== req.user.id) {
		throw new AppError("Notification not found", 404);
	}
	const updated = await prisma.notification.update({
		where: { id },
		data: { readAt: notification.readAt ?? new Date() },
	});
	sendSuccess(res, updated);
};

const markAllReadHandler = async (req: Request, res: Response) => {
	const result = await prisma.notification.updateMany({
		where: { userId: req.user.id, readAt: null },
		data: { readAt: new Date() },
	});
	sendSuccess(res, { updated: result.count });
};

/**
 * Counts for the sidebar badges, by role (one request for all of them):
 * - everyone: unread notifications
 * - company owner / manager: new leads (company), agent drafts waiting for them
 *   (agents whose direct submit is off can't send listings to the platform)
 * - agent: new leads assigned to them, their listings with changes required
 * - listing coordinator: their listings with changes required
 * - super admin: companies and listings waiting for review (all)
 * - reviewer: the same, only those assigned to them
 */
const badgesHandler = async (req: Request, res: Response) => {
	const user = req.user;
	const role = user.role as string;
	const isStaff = role === "super_admin" || role === "platform_reviewer";
	const mine = role === "platform_reviewer" ? { assignedReviewerId: user.id } : {};
	const unread = prisma.notification.count({ where: { userId: user.id, readAt: null } });

	if (isStaff) {
		const [notifications, companyApprovals, listingApprovals] = await Promise.all([
			unread,
			prisma.company.count({ where: { ...mine, status: { in: ["SUBMITTED", "PENDING_REVIEW"] } } }),
			prisma.listing.count({
				where: {
					...mine,
					publicationStatus: { not: "DELETED" },
					OR: [{ approvalStatus: { in: ["SUBMITTED", "PENDING_REVIEW"] } }, { pendingChangesAt: { not: null } }],
				},
			}),
		]);
		return sendSuccess(res, { notifications, companyApprovals, listingApprovals });
	}

	const companyId = user.companyId as string | undefined;
	if (!companyId) return sendSuccess(res, { notifications: await unread });

	const management = role === "company_owner" || role === "company_manager";
	const leads =
		management || role === "agent"
			? prisma.lead.count({
					where: { companyId, stage: "NEW", ...(management ? {} : { assignedToId: user.id }) },
				})
			: Promise.resolve(null);

	let listings: Promise<number | null>;
	if (management) {
		// Agents who can't submit to the platform themselves: their drafts wait for you.
		listings = prisma.user
			.findMany({ where: { companyId, role: "agent", banned: { not: true } }, select: { id: true, role: true } })
			.then(async (agents) => {
				const waiting: string[] = [];
				for (const a of agents) {
					if (!(await userHasCapability(a.id, a.role as UserRole, "listings.submit_to_platform"))) waiting.push(a.id);
				}
				if (waiting.length === 0) return 0;
				return prisma.listing.count({
					where: { companyId, creatorId: { in: waiting }, approvalStatus: "DRAFT", publicationStatus: { not: "DELETED" } },
				});
			});
	} else if (role === "agent" || role === "listing_coordinator") {
		listings = prisma.listing.count({
			where: { companyId, creatorId: user.id, approvalStatus: "CHANGES_REQUIRED", publicationStatus: { not: "DELETED" } },
		});
	} else {
		listings = Promise.resolve(null);
	}

	const [notifications, leadCount, listingCount] = await Promise.all([unread, leads, listings]);
	sendSuccess(res, {
		notifications,
		...(leadCount !== null ? { leads: leadCount } : {}),
		...(listingCount !== null ? { listings: listingCount } : {}),
	});
};

const router: Router = Router();
router.use(requireAuth);
router.get("/", asyncHandler(listHandler));
router.get("/badges", asyncHandler(badgesHandler));
router.post("/read-all", asyncHandler(markAllReadHandler));
router.patch("/:id/read", asyncHandler(markReadHandler));

export default router;
