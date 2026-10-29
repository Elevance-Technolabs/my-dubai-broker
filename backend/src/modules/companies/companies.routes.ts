import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireCapability } from "../../middleware/permissions.js";
import { rateLimit } from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import {
	getOnboardingStatusHandler,
	updateOnboardingHandler,
	getMyCompanyHandler,
	getCompanyUsersHandler,
	deactivateUserHandler,
	reactivateUserHandler,
	updateUserPermissionsHandler,
} from "./companies.controller.js";
import { onboardingSchema, updateUserPermissionsSchema } from "./companies.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router: Router = Router();

router.get("/onboarding/status", asyncHandler(getOnboardingStatusHandler));
router.get("/me", requireAuth, asyncHandler(getMyCompanyHandler));

router.post(
	"/onboarding",
	rateLimit(10, 60 * 60 * 1000),
	validate({ body: onboardingSchema }),
	asyncHandler(updateOnboardingHandler),
);

router.get(
	"/me/users",
	requireAuth,
	requireCapability("team.deactivate_users"),
	asyncHandler(getCompanyUsersHandler),
);
router.post(
	"/me/users/:userId/deactivate",
	requireAuth,
	requireCapability("team.deactivate_users"),
	asyncHandler(deactivateUserHandler),
);
router.post(
	"/me/users/:userId/reactivate",
	requireAuth,
	requireCapability("team.deactivate_users"),
	asyncHandler(reactivateUserHandler),
);
router.patch(
	"/me/users/:userId/permissions",
	requireAuth,
	requireCapability("team.set_permissions"),
	validate({ body: updateUserPermissionsSchema }),
	asyncHandler(updateUserPermissionsHandler),
);

export default router;
