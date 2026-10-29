import {
	ApprovalStatus,
	CompanyStatus,
	UserRole,
	type Prisma,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../utils/AppError.js";
import { sendEmail, emailTemplates } from "../../lib/email.js";
import { deactivateUser as deactivateCompanyUser, reactivateUser as reactivateCompanyUser } from "../companies/companies.service.js";

// ─── Company Queue ────────────────────────────────────────────

export const getCompanyQueue = async (
	page = 1,
	limit = 20,
	filters: {
		status?: CompanyStatus;
		reviewerId?: string;
		search?: string;
	} = {},
) => {
	const skip = (page - 1) * limit;

	const where: Prisma.CompanyWhereInput = {
		...(filters.status ? { status: filters.status } : {}),
		...(filters.search
			? {
					OR: [
						{ name: { contains: filters.search, mode: "insensitive" } },
						{ contactEmail: { contains: filters.search, mode: "insensitive" } },
					],
				}
			: {}),
	};

	const [companies, total] = await Promise.all([
		prisma.company.findMany({
			where,
			orderBy: { updatedAt: "asc" }, // oldest first — overdue at top
			skip,
			take: limit,
			include: {
				users: {
					where: { role: "company_owner" },
					select: { id: true, email: true, name: true, phone: true },
				},
				documents: {
					orderBy: { documentType: "asc" },
				},
				_count: {
					select: { listings: true },
				},
			},
		}),
		prisma.company.count({ where }),
	]);

	return {
		companies,
		pagination: {
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	};
};

export const getAllCompanies = async (status?: CompanyStatus) =>
	getCompanyQueue(1, 100, { status });

export const getCompanyById = async (id: string) => {
	const company = await prisma.company.findUnique({
		where: { id },
		include: {
			users: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					phone: true,
					createdAt: true,
					banned: true,
				},
			},
			documents: true,
			invitations: {
				where: { acceptedAt: null, revokedAt: null },
				orderBy: { createdAt: "desc" },
			},
			statusHistory: {
				orderBy: { createdAt: "desc" },
				take: 20,
			},
			_count: {
				select: {
					listings: true,
					leads: true,
				},
			},
		},
	});
	if (!company) return null;
	return company;
};

// ─── Company Status Decisions ─────────────────────────────────

export const updateCompanyStatus = async (
	id: string,
	status: CompanyStatus,
	actorId: string,
	options: {
		rejectionReason?: string;
		reason?: string;
		internalNote?: string;
	} = {},
) => {
	const company = await prisma.company.findUnique({ where: { id } });
	if (!company) throw new AppError("Company not found", 404);

	if (
		(status === CompanyStatus.REJECTED ||
			status === CompanyStatus.SUSPENDED ||
			status === CompanyStatus.CHANGES_REQUIRED) &&
		!options.reason &&
		!options.rejectionReason
	) {
		throw new AppError(
			`A reason is required when setting status to ${status}`,
			400,
		);
	}

	const previousStatus = company.status;

	const { updated, ownerEmail, notificationBody } = await prisma.$transaction(async (tx) => {
		const updated = await tx.company.update({
			where: { id },
			data: {
				status,
				rejectionReason:
					status === CompanyStatus.REJECTED ||
					status === CompanyStatus.CHANGES_REQUIRED
						? options.rejectionReason ?? options.reason ?? null
						: company.rejectionReason,
			},
		});

		await tx.statusHistory.create({
			data: {
				entityType: "company",
				entityId: id,
				companyId: id,
				fromStatus: previousStatus,
				toStatus: status,
				actorId,
				reason: options.reason ?? options.rejectionReason ?? options.internalNote,
			},
		});

		await tx.auditLog.create({
			data: {
				actorId,
				companyId: id,
				action: `company.status.${status.toLowerCase()}`,
				entityType: "company",
				entityId: id,
				previousValue: { status: previousStatus },
				newValue: { status },
				reason: options.reason ?? options.rejectionReason,
			},
		});

		// Notify the company owner
		const owner = await tx.user.findFirst({
			where: { companyId: id, role: "company_owner" },
			select: { id: true, email: true },
		});

		let notificationBody: string | undefined;

		if (owner) {
			const notificationConfig: Record<
				string,
				{ priority: string; type: string; title: string; body: string }
			> = {
				[CompanyStatus.APPROVED]: {
					priority: "INFORMATION",
					type: "company_approved",
					title: "Company Approved",
					body: "Your company has been approved. You can now create and submit listings.",
				},
				[CompanyStatus.CHANGES_REQUIRED]: {
					priority: "ACTION_NEEDED",
					type: "company_changes_required",
					title: "Changes Required",
					body: `Please review and update your company documents: ${options.rejectionReason ?? options.reason ?? ""}`,
				},
				[CompanyStatus.REJECTED]: {
					priority: "URGENT",
					type: "company_rejected",
					title: "Company Application Rejected",
					body: options.rejectionReason ?? options.reason ?? "Your application has been rejected.",
				},
				[CompanyStatus.SUSPENDED]: {
					priority: "URGENT",
					type: "company_suspended",
					title: "Company Suspended",
					body: options.reason ?? "Your company account has been suspended.",
				},
			};

			const cfg = notificationConfig[status];
			if (cfg) {
				notificationBody = cfg.body;
				await tx.notification.create({
					data: {
						userId: owner.id,
						priority: cfg.priority as any,
						type: cfg.type,
						title: cfg.title,
						body: cfg.body,
						actionUrl: "/dashboard/company",
					},
				});
			}
		}

		return { updated, ownerEmail: owner?.email, notificationBody };
	});

	if (ownerEmail && notificationBody) {
		const { subject, html } = emailTemplates.companyStatusChanged({
			companyName: company.name,
			status,
			reason: notificationBody,
		});
		await sendEmail({ to: ownerEmail, subject, html });
	}

	return updated;
};

// ─── Listing Approval Queue ───────────────────────────────────

export const getListingApprovalQueue = async (
	page = 1,
	limit = 20,
	filters: {
		approvalStatus?: ApprovalStatus;
		category?: string;
		companyId?: string;
		search?: string;
	} = {},
) => {
	const skip = (page - 1) * limit;

	const where: Prisma.ListingWhereInput = {
		// Default to submissions awaiting review
		...(filters.approvalStatus
			? { approvalStatus: filters.approvalStatus }
			: { approvalStatus: { in: [ApprovalStatus.SUBMITTED, ApprovalStatus.PENDING_REVIEW] } }),
		...(filters.category ? { category: filters.category as any } : {}),
		...(filters.companyId ? { companyId: filters.companyId } : {}),
		...(filters.search
			? {
					OR: [
						{ title: { contains: filters.search, mode: "insensitive" } },
						{ publicRef: { contains: filters.search, mode: "insensitive" } },
					],
				}
			: {}),
	};

	const [listings, total] = await Promise.all([
		prisma.listing.findMany({
			where,
			orderBy: { submittedAt: "asc" }, // oldest submission first
			skip,
			take: limit,
			include: {
				company: { select: { id: true, name: true } },
				creator: { select: { id: true, name: true, email: true } },
				approvalReviews: {
					orderBy: { createdAt: "desc" },
					take: 1,
				},
			},
		}),
		prisma.listing.count({ where }),
	]);

	return {
		listings,
		pagination: {
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	};
};

// ─── Platform Stats (for Admin Overview) ─────────────────────

export const getPlatformStats = async () => {
	const [
		totalCompanies,
		pendingCompanies,
		totalListings,
		liveListings,
		pendingListings,
		totalLeads,
		unresolvedLeads,
	] = await Promise.all([
		prisma.company.count(),
		prisma.company.count({
			where: {
				status: {
					in: [CompanyStatus.SUBMITTED, CompanyStatus.PENDING_REVIEW],
				},
			},
		}),
		prisma.listing.count(),
		prisma.listing.count({ where: { publicationStatus: "LIVE" } }),
		prisma.listing.count({
			where: {
				approvalStatus: {
					in: [ApprovalStatus.SUBMITTED, ApprovalStatus.PENDING_REVIEW],
				},
			},
		}),
		prisma.lead.count(),
		prisma.lead.count({
			where: {
				stage: { notIn: ["WON", "LOST"] },
				firstRespondedAt: null,
			},
		}),
	]);

	return {
		companies: { total: totalCompanies, pendingReview: pendingCompanies },
		listings: {
			total: totalListings,
			live: liveListings,
			pendingReview: pendingListings,
		},
		leads: { total: totalLeads, unresolved: unresolvedLeads },
	};
};

// ─── Audit Log ─────────────────────────────────────────────────

export const getAuditLog = async (
	page = 1,
	limit = 50,
	filters: {
		entityType?: string;
		actorId?: string;
		companyId?: string;
		from?: Date;
		to?: Date;
	} = {},
) => {
	const skip = (page - 1) * limit;

	const where: Prisma.AuditLogWhereInput = {
		...(filters.entityType ? { entityType: filters.entityType } : {}),
		...(filters.actorId ? { actorId: filters.actorId } : {}),
		...(filters.companyId ? { companyId: filters.companyId } : {}),
		...(filters.from || filters.to
			? {
					createdAt: {
						...(filters.from ? { gte: filters.from } : {}),
						...(filters.to ? { lte: filters.to } : {}),
					},
				}
			: {}),
	};

	const [entries, total] = await Promise.all([
		prisma.auditLog.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
			include: {
				actor: {
					select: { id: true, name: true, email: true, role: true },
				},
			},
		}),
		prisma.auditLog.count({ where }),
	]);

	return {
		entries,
		pagination: {
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	};
};

// ─── Platform-wide User Management ──────────────────────────────

export const getAllUsers = async (
	page = 1,
	limit = 50,
	filters: {
		companyId?: string;
		role?: UserRole;
		search?: string;
	} = {},
) => {
	const skip = (page - 1) * limit;

	const where: Prisma.UserWhereInput = {
		...(filters.companyId ? { companyId: filters.companyId } : {}),
		...(filters.role ? { role: filters.role } : {}),
		...(filters.search
			? {
					OR: [
						{ name: { contains: filters.search, mode: "insensitive" } },
						{ email: { contains: filters.search, mode: "insensitive" } },
					],
				}
			: {}),
	};

	const [users, total] = await Promise.all([
		prisma.user.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				companyId: true,
				banned: true,
				banReason: true,
				createdAt: true,
				company: { select: { id: true, name: true } },
			},
		}),
		prisma.user.count({ where }),
	]);

	return {
		users,
		pagination: {
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	};
};

export const updateUserRole = async (
	userId: string,
	newRole: UserRole,
	actorId: string,
) => {
	if (userId === actorId) {
		throw new AppError("You cannot change your own role.", 400);
	}

	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new AppError("User not found", 404);

	const updated = await prisma.user.update({
		where: { id: userId },
		data: { role: newRole },
		select: { id: true, name: true, email: true, role: true, companyId: true },
	});

	await prisma.auditLog.create({
		data: {
			actorId,
			companyId: user.companyId,
			action: "user.role_changed",
			entityType: "user",
			entityId: userId,
			previousValue: { role: user.role },
			newValue: { role: newRole },
		},
	});

	return updated;
};

// Platform-wide deactivate/reactivate — delegates to the same
// company-scoped logic (lead reassignment, audit log, better-auth
// ban/unban) used by an owner managing their own team, just resolving
// the target's companyId first instead of trusting the caller's own.
export const adminDeactivateUser = async (userId: string, actorId: string, reason?: string) => {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new AppError("User not found", 404);
	if (!user.companyId) {
		throw new AppError("Platform staff accounts cannot be deactivated here.", 400);
	}
	return deactivateCompanyUser(user.companyId, userId, actorId, reason);
};

export const adminReactivateUser = async (userId: string, actorId: string) => {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new AppError("User not found", 404);
	if (!user.companyId) {
		throw new AppError("Platform staff accounts cannot be reactivated here.", 400);
	}
	return reactivateCompanyUser(user.companyId, userId, actorId);
};
