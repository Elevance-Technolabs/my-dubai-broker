import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
	createRealEstateHandler,
	deleteRealEstateHandler,
	getRealEstateByIdHandler,
	getRealEstateListingsHandler,
	updateRealEstateHandler,
} from "./real-estate.controller.js";
import {
	createRealEstateSchema,
	getRealEstateQuerySchema,
	updateRealEstateSchema,
} from "./real-estate.validation.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router: Router = Router();

router.use(requireAuth);

router.get(
	"/",
	validate({ query: getRealEstateQuerySchema }),
	asyncHandler(getRealEstateListingsHandler),
);
router.post(
	"/",
	validate({ body: createRealEstateSchema }),
	asyncHandler(createRealEstateHandler),
);
router.get("/:id", asyncHandler(getRealEstateByIdHandler));
router.put(
	"/:id",
	validate({ body: updateRealEstateSchema }),
	asyncHandler(updateRealEstateHandler),
);
router.delete("/:id", asyncHandler(deleteRealEstateHandler));

export default router;
