import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireCapability } from "../../middleware/permissions.js";
import { rateLimit } from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
	createInvitationHandler,
	listInvitationsHandler,
	revokeInvitationHandler,
	getInvitationByTokenHandler,
	acceptInvitationHandler,
} from "./invitations.controller.js";
import { createInvitationSchema, acceptInvitationSchema } from "./invitations.validation.js";

const router: Router = Router();

// ─── Public — the invited person has no account yet ───────────

router.get("/token/:token", asyncHandler(getInvitationByTokenHandler));
router.post(
	"/token/:token/accept",
	rateLimit(10, 60 * 60 * 1000),
	validate({ body: acceptInvitationSchema }),
	asyncHandler(acceptInvitationHandler),
);

// ─── Company team management ───────────────────────────────────

router.post(
	"/",
	requireAuth,
	requireCapability("team.invite_users"),
	validate({ body: createInvitationSchema }),
	asyncHandler(createInvitationHandler),
);

router.get("/", requireAuth, requireCapability("team.invite_users"), asyncHandler(listInvitationsHandler));

router.post(
	"/:id/revoke",
	requireAuth,
	requireCapability("team.invite_users"),
	asyncHandler(revokeInvitationHandler),
);

export default router;
