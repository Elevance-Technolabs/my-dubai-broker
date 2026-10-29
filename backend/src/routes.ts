import { toNodeHandler } from "better-auth/node";
import { Router } from "express";
import { auth } from "./lib/auth.js";
import { rateLimit } from "./middleware/rateLimit.js";
import carsRouter from "./modules/cars/cars.routes.js";
import companiesRouter from "./modules/companies/companies.routes.js";
import helicoptersRouter from "./modules/helicopters/helicopters.routes.js";
import invitationsRouter from "./modules/invitations/invitations.routes.js";
import jetsRouter from "./modules/jets/jets.routes.js";
import leadsRouter from "./modules/leads/leads.routes.js";
import listingsRouter from "./modules/listings/listings.routes.js";
import profileRouter from "./modules/profile/profile.routes.js";
import realEstateRouter from "./modules/real-estate/real-estate.routes.js";
import uploadsRouter from "./modules/uploads/uploads.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import usersRouter from "./modules/users/users.routes.js";
import yachtsRouter from "./modules/yachts/yachts.routes.js";

const router: Router = Router();

router.use("/admin", adminRouter);
router.use("/companies", companiesRouter);
// All /auth/* traffic (sign-in, sign-up, sign-out, session, password
// reset, email verification) goes through better-auth's own handler —
// there is no custom wrapper around it.
router.all(/^\/auth\/.*/, rateLimit(20, 15 * 60 * 1000), toNodeHandler(auth));
router.use("/users", usersRouter);
router.use("/invitations", invitationsRouter);
router.use("/leads", leadsRouter);
router.use("/profile", profileRouter);
router.use("/listings", listingsRouter);
router.use("/cars", carsRouter);
router.use("/jets", jetsRouter);
router.use("/helicopters", helicoptersRouter);
router.use("/real-estate", realEstateRouter);
router.use("/yachts", yachtsRouter);
router.use("/uploads", uploadsRouter);

export default router;
