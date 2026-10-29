import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { rateLimit } from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
	deleteUploadHandler,
	presignPublicUploadHandler,
	presignUploadHandler,
} from "./uploads.controller.js";
import {
	presignDocumentUploadSchema,
	presignUploadSchema,
} from "./uploads.validation.js";

const router: Router = Router();

router.post(
	"/public/presign",
	rateLimit(30, 60 * 60 * 1000),
	validate({ body: presignDocumentUploadSchema }),
	asyncHandler(presignPublicUploadHandler),
);

router.use(requireAuth);

router.post(
	"/presign",
	validate({ body: presignUploadSchema }),
	asyncHandler(presignUploadHandler),
);

router.delete("/:id", asyncHandler(deleteUploadHandler));

export default router;
