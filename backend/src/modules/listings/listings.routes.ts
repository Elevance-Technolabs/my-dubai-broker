import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
	requireCapability,
	requirePlatformStaff,
	requireCompanyMembership,
} from "../../middleware/permissions.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
	createListingHandler,
	updateListingHandler,
	getCompanyListingsHandler,
	getMyListingsHandler,
	getListingByIdHandler,
	submitListingHandler,
	pauseListingHandler,
	archiveListingHandler,
	getAdminListingsHandler,
	updateApprovalStatusHandler,
	getPublicListingsHandler,
	getPublicListingByIdHandler,
	// Aliases
	getListingsHandler,
	getSellerListingsHandler,
	updateListingStatusHandler,
} from "./listings.controller.js";
import {
	createListingSchema,
	updateListingSchema,
	updateApprovalStatusSchema,
	getListingsQuerySchema,
	getPublicListingsQuerySchema,
} from "./listings.validation.js";

const router: Router = Router();

// ─── Public (no auth required) ───────────────────────────────

router.get(
	"/public",
	validate({ query: getPublicListingsQuerySchema }),
	asyncHandler(getPublicListingsHandler),
);

router.get("/public/:id", asyncHandler(getPublicListingByIdHandler));

// ─── Agent / Company member routes ───────────────────────────

router.post(
	"/",
	requireAuth,
	requireCapability("listings.create_draft"),
	validate({ body: createListingSchema }),
	asyncHandler(createListingHandler),
);

router.get(
	"/my-listings",
	requireAuth,
	asyncHandler(getMyListingsHandler),
);

// Company-scoped listing list (owner/manager/coordinator can view all; agents see own)
router.get(
	"/",
	requireAuth,
	validate({ query: getListingsQuerySchema }),
	asyncHandler(getListingsHandler),
);

// Edit an existing listing's fields (core + category-specific details)
router.put(
	"/:id",
	requireAuth,
	requireCapability("listings.edit"),
	validate({ body: updateListingSchema }),
	asyncHandler(updateListingHandler),
);

// Submit a draft for platform review
router.post(
	"/:id/submit",
	requireAuth,
	requireCapability("listings.submit_to_platform"),
	asyncHandler(submitListingHandler),
);

// Pause a live listing
router.post(
	"/:id/pause",
	requireAuth,
	requireCapability("listings.pause_archive"),
	asyncHandler(pauseListingHandler),
);

// Archive a listing
router.post(
	"/:id/archive",
	requireAuth,
	requireCapability("listings.pause_archive"),
	asyncHandler(archiveListingHandler),
);

// ─── Admin routes ────────────────────────────────────────────

// Platform-wide listing queue (admin only)
router.get(
	"/admin",
	requireAuth,
	requirePlatformStaff,
	validate({ query: getListingsQuerySchema }),
	asyncHandler(getAdminListingsHandler),
);

// Approve / reject / request changes (admin)
router.patch(
	"/:id/approval",
	requireAuth,
	requirePlatformStaff,
	validate({ body: updateApprovalStatusSchema }),
	asyncHandler(updateApprovalStatusHandler),
);

// Legacy compat: kept for existing frontend calls
router.patch(
	"/:id/status",
	requireAuth,
	requirePlatformStaff,
	validate({ body: updateApprovalStatusSchema }),
	asyncHandler(updateListingStatusHandler),
);

// ─── Detail (any authenticated user can view a listing) ──────

router.get("/:id", requireAuth, asyncHandler(getListingByIdHandler));

export default router;
