import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
	createHelicopterHandler,
	deleteHelicopterHandler,
	getHelicopterHandler,
	getHelicoptersHandler,
	updateHelicopterHandler,
} from "./helicopters.controller.js";
import {
	createHelicopterSchema,
	getHelicoptersQuerySchema,
	updateHelicopterSchema,
} from "./helicopters.validation.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router: Router = Router();

router.use(requireAuth);

router.get(
	"/",
	validate({ query: getHelicoptersQuerySchema }),
	asyncHandler(getHelicoptersHandler),
);
router.post(
	"/",
	validate({ body: createHelicopterSchema }),
	asyncHandler(createHelicopterHandler),
);
router.get("/:id", asyncHandler(getHelicopterHandler));
router.put(
	"/:id",
	validate({ body: updateHelicopterSchema }),
	asyncHandler(updateHelicopterHandler),
);
router.delete("/:id", asyncHandler(deleteHelicopterHandler));

export default router;
