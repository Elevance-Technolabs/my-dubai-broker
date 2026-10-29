import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getMyProfileHandler, updateMyProfileHandler } from "./profile.controller.js";
import { updateProfileSchema } from "./profile.validation.js";

const router: Router = Router();

router.get("/me", requireAuth, asyncHandler(getMyProfileHandler));
router.patch(
	"/me",
	requireAuth,
	validate({ body: updateProfileSchema }),
	asyncHandler(updateMyProfileHandler),
);

export default router;
