import type { Router as ExpressRouter } from "express";
import { Router } from "express";
import { usersController } from "./users.controller.js";

const router: ExpressRouter = Router();

// GET /api/users/sellers - Get all sellers
router.get("/sellers", (req, res) => usersController.getSellers(req, res));

// PATCH /api/users/:userId/verification - Update seller verification status
router.patch("/:userId/verification", (req, res) =>
	usersController.updateSellerVerification(req, res),
);

export default router;
