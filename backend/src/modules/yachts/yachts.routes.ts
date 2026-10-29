import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
	createYachtHandler,
	deleteYachtHandler,
	getYachtHandler,
	getYachtsHandler,
	updateYachtHandler,
} from "./yachts.controller.js";
import {
	createYachtSchema,
	getYachtsQuerySchema,
	updateYachtSchema,
} from "./yachts.validation.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router: Router = Router();

router.use(requireAuth);

router.get(
	"/",
	validate({ query: getYachtsQuerySchema }),
	asyncHandler(getYachtsHandler),
);
router.post(
	"/",
	validate({ body: createYachtSchema }),
	asyncHandler(createYachtHandler),
);
router.get("/:id", asyncHandler(getYachtHandler));
router.put(
	"/:id",
	validate({ body: updateYachtSchema }),
	asyncHandler(updateYachtHandler),
);
router.delete("/:id", asyncHandler(deleteYachtHandler));

export default router;
