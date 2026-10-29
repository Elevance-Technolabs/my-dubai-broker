import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
	createJetHandler,
	deleteJetHandler,
	getJetHandler,
	getJetsHandler,
	updateJetHandler,
} from "./jets.controller.js";
import {
	createJetSchema,
	getJetsQuerySchema,
	updateJetSchema,
} from "./jets.validation.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router: Router = Router();

router.use(requireAuth);

router.get(
	"/",
	validate({ query: getJetsQuerySchema }),
	asyncHandler(getJetsHandler),
);
router.post(
	"/",
	validate({ body: createJetSchema }),
	asyncHandler(createJetHandler),
);
router.get("/:id", asyncHandler(getJetHandler));
router.put(
	"/:id",
	validate({ body: updateJetSchema }),
	asyncHandler(updateJetHandler),
);
router.delete("/:id", asyncHandler(deleteJetHandler));

export default router;
