import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
	requireCapability,
	requireAssignedToReviewer,
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
	deleteListingHandler,
	unpublishListingHandler,
	soldOutListingHandler,
	republishListingHandler,
	approvePendingChangesHandler,
	rejectPendingChangesHandler,
	getAdminListingsHandler,
	updateApprovalStatusHandler,
	getPublicListingsHandler,
	getPublicListingByIdHandler,
	exportAdminListingsHandler,
	setListingReviewerHandler,
	addListingNoteHandler,
	getListingInsightsHandler,
	confirmAvailabilityHandler,
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
	setReviewerSchema,
	addReviewNoteSchema,
	confirmAvailabilitySchema,
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
	requireCapability("listings.pause"),
	asyncHandler(pauseListingHandler),
);

// Company: take a live listing off the website, mark it sold out, or ask to
// publish it again (that goes to review before it is live).
router.post("/:id/unpublish", requireAuth, requireCapability("listings.pause"), asyncHandler(unpublishListingHandler));
router.post("/:id/sold-out", requireAuth, requireCapability("listings.pause"), asyncHandler(soldOutListingHandler));
router.post("/:id/republish", requireAuth, requireCapability("listings.pause"), asyncHandler(republishListingHandler));

// Delete a listing (kept as history; see deleteListing)
router.delete(
	"/:id",
	requireAuth,
	requireCapability("listings.delete"),
	asyncHandler(deleteListingHandler),
);

// ─── Admin routes ────────────────────────────────────────────

// Platform-wide listing table and approval queue (?queue=true), admin only
router.get("/admin", requireAuth, requirePlatformStaff, asyncHandler(getAdminListingsHandler));
router.get("/admin/export", requireAuth, requirePlatformStaff, asyncHandler(exportAdminListingsHandler));

router.patch(
	"/:id/reviewer",
	requireAuth,
	requirePlatformStaff,
	requireCapability("admin.assign_reviewers"),
	validate({ body: setReviewerSchema }),
	asyncHandler(setListingReviewerHandler),
);

router.post(
	"/:id/notes",
	requireAuth,
	requirePlatformStaff,
	requireAssignedToReviewer("listing"),
	validate({ body: addReviewNoteSchema }),
	asyncHandler(addListingNoteHandler),
);

// Approve / reject / request changes (admin)
router.patch(
	"/:id/approval",
	requireAuth,
	requirePlatformStaff,
	requireAssignedToReviewer("listing"),
	validate({ body: updateApprovalStatusSchema }),
	asyncHandler(updateApprovalStatusHandler),
);

// Edits to an approved listing, held for review
router.post(
	"/:id/changes/approve",
	requireAuth,
	requirePlatformStaff,
	requireAssignedToReviewer("listing"),
	requireCapability("admin.approve_listings"),
	asyncHandler(approvePendingChangesHandler),
);
router.post(
	"/:id/changes/reject",
	requireAuth,
	requirePlatformStaff,
	requireAssignedToReviewer("listing"),
	requireCapability("admin.approve_listings"),
	asyncHandler(rejectPendingChangesHandler),
);

// Legacy compat: kept for existing frontend calls
router.patch(
	"/:id/status",
	requireAuth,
	requirePlatformStaff,
	requireAssignedToReviewer("listing"),
	validate({ body: updateApprovalStatusSchema }),
	asyncHandler(updateListingStatusHandler),
);

// ─── Detail (any authenticated user can view a listing) ──────

router.get("/:id/insights", requireAuth, requireAssignedToReviewer("listing"), asyncHandler(getListingInsightsHandler));

// Confirm (or withdraw) availability — keeps the listing fresh in search
router.post(
	"/:id/availability",
	requireAuth,
	requireCapability("listings.edit"),
	validate({ body: confirmAvailabilitySchema }),
	asyncHandler(confirmAvailabilityHandler),
);

router.get("/:id", requireAuth, requireAssignedToReviewer("listing"), asyncHandler(getListingByIdHandler));

export default router;
