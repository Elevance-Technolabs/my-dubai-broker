import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
	createCarHandler,
	deleteCarHandler,
	getCarHandler,
	getCarsHandler,
	updateCarHandler,
} from "./cars.controller.js";
import {
	createCarSchema,
	getCarsQuerySchema,
	updateCarSchema,
} from "./cars.validation.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router: Router = Router();

router.use(requireAuth);

router.get(
	"/",
	validate({ query: getCarsQuerySchema }),
	asyncHandler(getCarsHandler),
);
router.post(
	"/",
	validate({ body: createCarSchema }),
	asyncHandler(createCarHandler),
);
router.get("/:id", asyncHandler(getCarHandler));
router.put(
	"/:id",
	validate({ body: updateCarSchema }),
	asyncHandler(updateCarHandler),
);
router.delete("/:id", asyncHandler(deleteCarHandler));

export default router;
