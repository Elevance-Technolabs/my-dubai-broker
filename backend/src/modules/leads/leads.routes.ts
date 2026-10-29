import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireCapability } from "../../middleware/permissions.js";
import { rateLimit } from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
	createLeadHandler,
	getMyLeadsHandler,
	getCompanyLeadsHandler,
	getLeadByIdHandler,
	updateLeadStageHandler,
	addLeadActivityHandler,
	assignLeadHandler,
} from "./leads.controller.js";
import {
	createLeadSchema,
	updateLeadStageSchema,
	addLeadActivitySchema,
	assignLeadSchema,
} from "./leads.validation.js";

const router: Router = Router();

// ─── Public capture — no auth, this is what listing enquiry forms call ──

router.post(
	"/",
	rateLimit(20, 60 * 60 * 1000),
	validate({ body: createLeadSchema }),
	asyncHandler(createLeadHandler),
);

// ─── Company-scoped ─────────────────────────────────────────────

router.get("/my-leads", requireAuth, requireCapability("leads.view_own"), asyncHandler(getMyLeadsHandler));

router.get(
	"/",
	requireAuth,
	requireCapability("leads.view_all_company"),
	asyncHandler(getCompanyLeadsHandler),
);

router.get("/:id", requireAuth, asyncHandler(getLeadByIdHandler));

router.patch(
	"/:id/stage",
	requireAuth,
	validate({ body: updateLeadStageSchema }),
	asyncHandler(updateLeadStageHandler),
);

router.post(
	"/:id/activities",
	requireAuth,
	validate({ body: addLeadActivitySchema }),
	asyncHandler(addLeadActivityHandler),
);

router.post(
	"/:id/assign",
	requireAuth,
	requireCapability("leads.assign"),
	validate({ body: assignLeadSchema }),
	asyncHandler(assignLeadHandler),
);

export default router;
