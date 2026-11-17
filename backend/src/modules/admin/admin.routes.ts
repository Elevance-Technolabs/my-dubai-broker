import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePlatformStaff, requireCapability, requireAssignedToReviewer } from "../../middleware/permissions.js";
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
	getReviewersHandler,
	setCompanyReviewerHandler,
	addCompanyNoteHandler,
	updateCompanyDocumentHandler,
	adminInviteUserHandler,
	getAdminLeadsHandler,
	getReportSummaryHandler,
	exportReportHandler,
	getConfigurationHandler,
	updateQualityConfigHandler,
	updateRankingConfigHandler,
	recalculateScoresHandler,
} from "./admin.controller.js";
import { validate } from "../../middleware/validate.js";
import {
	addNoteSchema,
	inviteUserSchema,
	qualityConfigSchema,
	rankingConfigSchema,
	setReviewerSchema,
	updateDocumentSchema,
	updateRoleSchema,
} from "./admin.validation.js";

const adminRouter: Router = Router();

// All admin routes require authentication and platform staff role
adminRouter.use(requireAuth, requirePlatformStaff);
// A reviewer can open or act on a company only when it is assigned to them.
adminRouter.use("/companies/:id", requireAssignedToReviewer("company"));

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
adminRouter.patch("/users/:id/role", validate({ body: updateRoleSchema }), asyncHandler(updateUserRoleHandler));
adminRouter.post("/users/invite", validate({ body: inviteUserSchema }), asyncHandler(adminInviteUserHandler));
adminRouter.post("/users/:id/deactivate", asyncHandler(adminDeactivateUserHandler));
adminRouter.post("/users/:id/reactivate", asyncHandler(adminReactivateUserHandler));

// Review workflow: reviewers, assignment, notes, document details
adminRouter.get("/reviewers", asyncHandler(getReviewersHandler));
adminRouter.patch(
	"/companies/:id/reviewer",
	requireCapability("admin.assign_reviewers"),
	validate({ body: setReviewerSchema }),
	asyncHandler(setCompanyReviewerHandler),
);
adminRouter.post("/companies/:id/notes", validate({ body: addNoteSchema }), asyncHandler(addCompanyNoteHandler));
adminRouter.patch(
	"/companies/:id/documents/:documentId",
	validate({ body: updateDocumentSchema }),
	asyncHandler(updateCompanyDocumentHandler),
);

// Leads, reports and configuration
adminRouter.get("/leads", requireCapability("leads.view_all_company"), asyncHandler(getAdminLeadsHandler));
adminRouter.get("/reports/summary", requireCapability("performance.view_company"), asyncHandler(getReportSummaryHandler));
adminRouter.get("/reports/export/:type", requireCapability("performance.export"), asyncHandler(exportReportHandler));
adminRouter.get("/config", requireCapability("admin.manage_config"), asyncHandler(getConfigurationHandler));
adminRouter.put(
	"/config/quality",
	requireCapability("admin.manage_config"),
	validate({ body: qualityConfigSchema }),
	asyncHandler(updateQualityConfigHandler),
);
adminRouter.put(
	"/config/ranking",
	requireCapability("admin.manage_ranking"),
	validate({ body: rankingConfigSchema }),
	asyncHandler(updateRankingConfigHandler),
);
adminRouter.post("/config/recalculate", requireCapability("admin.manage_config"), asyncHandler(recalculateScoresHandler));
export { adminRouter };
