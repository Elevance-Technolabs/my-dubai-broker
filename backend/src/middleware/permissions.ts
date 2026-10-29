import type { NextFunction, Request, Response } from "express";
import { UserRole } from "../../generated/prisma/enums.js";
import { prisma } from "../prisma/client.js";

// ============================================================
// PERMISSION MATRIX
// Based on Section 19 of the MDB functional plan
// ============================================================

/**
 * Capability keys — every feature the platform can gate.
 */
export type Capability =
	// Company
	| "company.view_all"
	| "company.manage_users"
	| "company.manage_settings"
	| "company.view_documents"
	// Listings
	| "listings.view_all_company"
	| "listings.create_draft"
	| "listings.submit_to_platform"
	| "listings.edit"
	| "listings.pause_archive"
	| "listings.view_admin_all"
	// Leads
	| "leads.view_all_company"
	| "leads.assign"
	| "leads.export"
	| "leads.view_own"
	// Performance
	| "performance.view_company"
	| "performance.view_own"
	| "performance.export"
	// Team
	| "team.invite_users"
	| "team.deactivate_users"
	| "team.set_permissions"
	// Platform Admin
	| "admin.approve_companies"
	| "admin.approve_listings"
	| "admin.view_all_companies"
	| "admin.view_all_listings"
	| "admin.manage_config"
	| "admin.manage_ranking"
	| "admin.view_audit_log"
	| "admin.manage_users"
	// User profile
	| "profile.view_own"
	| "profile.edit_own";

/**
 * Role → capability map.
 * Each role gets an explicit set of what it can do.
 */
const ROLE_CAPABILITIES: Record<UserRole, Set<Capability>> = {
	[UserRole.super_admin]: new Set<Capability>([
		"company.view_all",
		"company.manage_users",
		"company.manage_settings",
		"company.view_documents",
		"listings.view_all_company",
		"listings.create_draft",
		"listings.submit_to_platform",
		"listings.edit",
		"listings.pause_archive",
		"listings.view_admin_all",
		"leads.view_all_company",
		"leads.assign",
		"leads.export",
		"leads.view_own",
		"performance.view_company",
		"performance.view_own",
		"performance.export",
		"team.invite_users",
		"team.deactivate_users",
		"team.set_permissions",
		"admin.approve_companies",
		"admin.approve_listings",
		"admin.view_all_companies",
		"admin.view_all_listings",
		"admin.manage_config",
		"admin.manage_ranking",
		"admin.view_audit_log",
		"admin.manage_users",
		"profile.view_own",
		"profile.edit_own",
	]),

	[UserRole.platform_reviewer]: new Set<Capability>([
		"admin.approve_companies",
		"admin.approve_listings",
		"admin.view_all_companies",
		"admin.view_all_listings",
		"company.view_documents",
		"profile.view_own",
		"profile.edit_own",
	]),

	[UserRole.company_owner]: new Set<Capability>([
		"company.view_all",
		"company.manage_users",
		"company.manage_settings",
		"company.view_documents",
		"listings.view_all_company",
		"listings.create_draft",
		"listings.submit_to_platform",
		"listings.edit",
		"listings.pause_archive",
		"leads.view_all_company",
		"leads.assign",
		"leads.export",
		"performance.view_company",
		"performance.view_own",
		"performance.export",
		"team.invite_users",
		"team.deactivate_users",
		"team.set_permissions",
		"profile.view_own",
		"profile.edit_own",
	]),

	[UserRole.company_manager]: new Set<Capability>([
		"listings.view_all_company",
		"listings.create_draft",
		"listings.submit_to_platform", // can be toggled off per company
		"listings.edit",
		"listings.pause_archive",
		"leads.view_all_company",
		"leads.assign",
		"performance.view_company",
		"performance.view_own",
		"team.invite_users", // can be toggled off per company
		"profile.view_own",
		"profile.edit_own",
	]),

	[UserRole.agent]: new Set<Capability>([
		"listings.create_draft",    // if granted by owner
		"listings.edit",
		"leads.view_own",
		"performance.view_own",
		"profile.view_own",
		"profile.edit_own",
	]),

	[UserRole.listing_coordinator]: new Set<Capability>([
		"listings.create_draft",
		"listings.edit",
		"profile.view_own",
		"profile.edit_own",
	]),

	[UserRole.viewer]: new Set<Capability>([
		"performance.view_company",
		"profile.view_own",
	]),
};

/**
 * Check if a role has a given capability.
 */
export const roleHas = (role: UserRole, capability: Capability): boolean => {
	return ROLE_CAPABILITIES[role]?.has(capability) ?? false;
};

// ============================================================
// MIDDLEWARE
// ============================================================

/**
 * requireRole — allow only specific roles through.
 * Use after requireAuth.
 */
export const requireRole = (...roles: UserRole[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			return res.status(401).json({ error: "Unauthorized" });
		}
		const userRole = req.user.role as UserRole;
		if (!roles.includes(userRole)) {
			return res.status(403).json({
				error: "Forbidden",
				message: `This action requires one of the following roles: ${roles.join(", ")}`,
			});
		}
		return next();
	};
};

/**
 * Resolves whether a user has a capability, layering their per-user
 * `permissions` override (if any) on top of the role default:
 *   - override === true  -> always allowed, regardless of role
 *   - override === false -> always denied, regardless of role
 *   - no override        -> falls back to the role default
 *
 * Always re-reads from the DB rather than trusting session data, so a
 * permission change (or deactivation) takes effect on the very next request.
 */
export const userHasCapability = async (userId: string, role: UserRole, capability: Capability) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { permissions: true, banned: true },
	});
	if (!user || user.banned) return false;

	const override = (user.permissions as Record<string, boolean> | null)?.[capability];
	if (typeof override === "boolean") return override;

	return roleHas(role, capability);
};

/**
 * requireCapability — gate on a specific capability rather than a role.
 * This is the preferred approach; roles are mapped to capabilities internally.
 */
export const requireCapability = (capability: Capability) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			return res.status(401).json({ error: "Unauthorized" });
		}
		const userRole = req.user.role as UserRole;
		const allowed = await userHasCapability(req.user.id, userRole, capability);
		if (!allowed) {
			return res.status(403).json({
				error: "Forbidden",
				message: "You do not have permission to perform this action.",
				requiredCapability: capability,
			});
		}
		return next();
	};
};

/**
 * requireCompanyMembership — ensures the authenticated user belongs to
 * the companyId being accessed (from req.params or req.body).
 * Admins and reviewers bypass this check.
 */
export const requireCompanyMembership = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (!req.user) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const userRole = req.user.role as UserRole;

	// Platform staff can access any company
	if (
		userRole === UserRole.super_admin ||
		userRole === UserRole.platform_reviewer
	) {
		return next();
	}

	const companyId =
		req.params.companyId ||
		req.body?.companyId ||
		req.query?.companyId as string;

	if (!companyId) {
		return next(); // no company scoping on this route
	}

	const userCompanyId = req.user.companyId;
	if (!userCompanyId || userCompanyId !== companyId) {
		return res.status(403).json({
			error: "Forbidden",
			message: "You do not have access to this company's resources.",
		});
	}

	return next();
};

/**
 * requirePlatformStaff — shorthand for super_admin | platform_reviewer.
 */
export const requirePlatformStaff = requireRole(
	UserRole.super_admin,
	UserRole.platform_reviewer,
);

/**
 * requireCompanyOwnerOrManager — shorthand for roles that manage a company.
 */
export const requireCompanyOwnerOrManager = requireRole(
	UserRole.super_admin,
	UserRole.company_owner,
	UserRole.company_manager,
);
