import type { Request, Response } from "express";
import { z } from "zod";
import { usersService } from "./users.service.js";

const updateVerificationSchema = z.object({
	status: z.enum(["PENDING_REVIEW", "APPROVED", "REJECTED"]),
	rejectionReason: z.string().optional(),
});

export class UsersController {
	async getSellers(_req: Request, res: Response) {
		try {
			const sellers = await usersService.getSellers();
			res.json(sellers);
		} catch (error) {
			if (error instanceof Error) {
				res.status(500).json({ error: error.message });
			} else {
				res.status(500).json({ error: "Internal server error" });
			}
		}
	}

	async updateSellerVerification(req: Request, res: Response) {
		try {
			const userId = req.params.userId as string;
			if (!userId) {
				return res.status(400).json({ error: "User ID is required" });
			}
			const data = updateVerificationSchema.parse(req.body);

			const updatedSeller = await usersService.updateSellerVerification(
				userId,
				data.status,
				data.rejectionReason,
			);

			res.json(updatedSeller);
		} catch (error) {
			if (error instanceof z.ZodError) {
				res.status(400).json({ error: error.issues });
			} else if (error instanceof Error) {
				res.status(400).json({ error: error.message });
			} else {
				res.status(500).json({ error: "Internal server error" });
			}
		}
	}
}

export const usersController = new UsersController();
