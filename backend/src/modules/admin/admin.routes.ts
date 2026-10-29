import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePlatformStaff, requireCapability } from "../../middleware/permissions.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
	getPlatformStatsHandler,
	getCompaniesHandler,
	getCompanyByIdHandler,
	updateCompanyStatusHandler,
	getListingApprovalQueueHandler,
	getAuditLogHandler,
	getAllUsersHandler,
	updateUserRoleHandler,
	adminDeactivateUserHandler,
	adminReactivateUserHandler,
} from "./admin.controller.js";

const adminRouter: Router = Router();

// All admin routes require authentication and platform staff role
adminRouter.use(requireAuth, requirePlatformStaff);

// Overview
adminRouter.get("/stats", asyncHandler(getPlatformStatsHandler));

// Company approval queue
adminRouter.get("/companies", asyncHandler(getCompaniesHandler));
adminRouter.get("/companies/:id", asyncHandler(getCompanyByIdHandler));
adminRouter.patch("/companies/:id/status", asyncHandler(updateCompanyStatusHandler));

// Listing approval queue
adminRouter.get("/listing-approvals", asyncHandler(getListingApprovalQueueHandler));

// Audit log — super_admin only (platform_reviewer lacks admin.view_audit_log)
adminRouter.get(
	"/audit-log",
	requireCapability("admin.view_audit_log"),
	asyncHandler(getAuditLogHandler),
);

// Platform-wide user management — super_admin only
adminRouter.use("/users", requireCapability("admin.manage_users"));
adminRouter.get("/users", asyncHandler(getAllUsersHandler));
adminRouter.patch("/users/:id/role", asyncHandler(updateUserRoleHandler));
adminRouter.post("/users/:id/deactivate", asyncHandler(adminDeactivateUserHandler));
adminRouter.post("/users/:id/reactivate", asyncHandler(adminReactivateUserHandler));

export { adminRouter };
