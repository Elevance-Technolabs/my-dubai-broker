import {
	ApprovalStatus,
	CompanyStatus,
	UserRole,
	type Prisma,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../prisma/client.js";
import { invalidateUserAccess } from "../../lib/accessCache.js";
import { AppError } from "../../utils/AppError.js";
import { sendEmail, emailTemplates } from "../../lib/email.js";
import { deactivateUser as deactivateCompanyUser, reactivateUser as reactivateCompanyUser } from "../companies/companies.service.js";
import { createInvitation, createStaffInvitation } from "../invitations/invitations.service.js";
import { env } from "../../lib/env.js";

// ─── Company Queue ────────────────────────────────────────────

/** A company application waiting longer than this is flagged as overdue. */
export const COMPANY_REVIEW_OVERDUE_HOURS = 48;
const COMPANY_AWAITING: CompanyStatus[] = [CompanyStatus.SUBMITTED, CompanyStatus.PENDING_REVIEW];
const DAY_MS = 24 * 60 * 60 * 1000;

/** Document status as of today: an expiry date overrides the stored status. */
export const effectiveDocumentStatus = (doc: { status: string; expiryDate: Date | null }) => {
	if (doc.expiryDate) {
		const left = doc.expiryDate.getTime() - Date.now();
		if (left < 0) return "EXPIRED";
		if (left < 30 * DAY_MS) return "EXPIRING";
	}
	return doc.status;
};

export const getCompanyQueue = async (
	page = 1,
	limit = 20,
	filters: {
		/** Platform reviewer: only companies assigned to them. */
		assignedTo?: string;
		status?: CompanyStatus;
		reviewerId?: string;
		search?: string;
		category?: string;
		dateFrom?: Date;
		dateTo?: Date;
		sort?: string;
	} = {},
) => {
	const skip = (page - 1) * limit;

	const where: Prisma.CompanyWhereInput = {
		...(filters.status ? { status: filters.status } : {}),
		...(filters.category ? { categories: { has: filters.category as any } } : {}),
		...(filters.assignedTo
			? { assignedReviewerId: filters.assignedTo }
			: filters.reviewerId === "unassigned"
				? { assignedReviewerId: null }
				: filters.reviewerId
					? { assignedReviewerId: filters.reviewerId }
					: {}),
		...(filters.dateFrom || filters.dateTo
			? {
					createdAt: {
						...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
						...(filters.dateTo ? { lte: filters.dateTo } : {}),
					},
				}
			: {}),
		...(filters.search
			? {
					OR: [
						{ name: { contains: filters.search, mode: "insensitive" } },
						{ contactEmail: { contains: filters.search, mode: "insensitive" } },
						{ users: { some: { email: { contains: filters.search, mode: "insensitive" } } } },
					],
				}
			: {}),
	};

	const orderBy: Prisma.CompanyOrderByWithRelationInput =
		filters.sort === "newest"
			? { createdAt: "desc" }
			: filters.sort === "name"
				? { name: "asc" }
				: { createdAt: "asc" }; // oldest first — overdue at top

	const [companies, total, overdueCount] = await Promise.all([
		prisma.company.findMany({
			where,
			orderBy,
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
				assignedReviewer: { select: { id: true, name: true } },
				_count: {
					select: { listings: true },
				},
			},
		}),
		prisma.company.count({ where }),
		prisma.company.count({
			where: {
				AND: [
					where,
					{
						status: { in: COMPANY_AWAITING },
						createdAt: { lte: new Date(Date.now() - COMPANY_REVIEW_OVERDUE_HOURS * 3600000) },
					},
				],
			},
		}),
	]);

	const now = Date.now();
	return {
		companies: companies.map((c) => {
			const waitingSince = c.onboardingCompletedAt ?? c.createdAt;
			const ageHours = Math.floor((now - waitingSince.getTime()) / 3600000);
			return {
				...c,
				documents: c.documents.map((d) => ({ ...d, storedStatus: d.status, status: effectiveDocumentStatus(d) })),
				ageHours,
				overdue: COMPANY_AWAITING.includes(c.status) && ageHours > COMPANY_REVIEW_OVERDUE_HOURS,
			};
		}),
		summary: { overdue: overdueCount },
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
			documents: { orderBy: { documentType: "asc" } },
			invitations: {
				where: { acceptedAt: null, revokedAt: null },
				orderBy: { createdAt: "desc" },
			},
			statusHistory: {
				orderBy: { createdAt: "desc" },
				take: 50,
			},
			reviewNotes: {
				orderBy: { createdAt: "desc" },
				include: { author: { select: { id: true, name: true } } },
			},
			assignedReviewer: { select: { id: true, name: true } },
			_count: {
				select: {
					listings: true,
					leads: true,
				},
			},
		},
	});
	if (!company) return null;
	const actors = await prisma.user.findMany({
		where: { id: { in: [...new Set(company.statusHistory.map((h) => h.actorId))] } },
		select: { id: true, name: true },
	});
	const actorName = new Map(actors.map((a) => [a.id, a.name]));
	return {
		...company,
		documents: company.documents.map((d) => ({ ...d, storedStatus: d.status, status: effectiveDocumentStatus(d) })),
		statusHistory: company.statusHistory.map((h) => ({ ...h, actorName: actorName.get(h.actorId) ?? null })),
	};
};

/** Active platform staff who can be assigned as reviewers. */
export const getReviewers = async () =>
	prisma.user.findMany({
		where: { role: { in: [UserRole.super_admin, UserRole.platform_reviewer] }, banned: false },
		select: { id: true, name: true, email: true, role: true },
		orderBy: { name: "asc" },
	});

const assertReviewer = async (reviewerId: string) => {
	const reviewer = await prisma.user.findUnique({ where: { id: reviewerId }, select: { role: true, banned: true } });
	if (!reviewer || reviewer.banned || !["super_admin", "platform_reviewer"].includes(reviewer.role)) {
		throw new AppError("The reviewer must be an active platform staff member", 400);
	}
};

export const setCompanyReviewer = async (companyId: string, reviewerId: string | null, actorId: string) => {
	const company = await prisma.company.findUnique({ where: { id: companyId } });
	if (!company) throw new AppError("Company not found", 404);
	if (reviewerId) await assertReviewer(reviewerId);
	const updated = await prisma.company.update({
		where: { id: companyId },
		data: { assignedReviewerId: reviewerId },
		select: { id: true, assignedReviewer: { select: { id: true, name: true } } },
	});
	// Tell the newly assigned reviewer (not when assigning yourself).
	if (reviewerId && reviewerId !== actorId && reviewerId !== company.assignedReviewerId) {
		await prisma.notification
			.create({
				data: {
					userId: reviewerId,
					priority: "ACTION_NEEDED",
					type: "company_assigned",
					title: "Company assigned to you",
					body: `${company.name} was assigned to you for review.`,
					actionUrl: `/admin/companies?company=${companyId}`,
				},
			})
			.catch((e) => console.error("Assignment notification failed:", e));
	}
	await prisma.auditLog.create({
		data: {
			actorId,
			companyId,
			action: "company.reviewer_assigned",
			entityType: "company",
			entityId: companyId,
			previousValue: { assignedReviewerId: company.assignedReviewerId },
			newValue: { assignedReviewerId: reviewerId },
		},
	});
	return updated;
};

export const addCompanyNote = async (companyId: string, body: string, isInternal: boolean, authorId: string) => {
	const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true } });
	if (!company) throw new AppError("Company not found", 404);
	const note = await prisma.reviewNote.create({
		data: { entityType: "company", companyId, authorId, body: body.trim(), isInternal },
		include: { author: { select: { id: true, name: true } } },
	});
	if (!isInternal) {
		const owner = await prisma.user.findFirst({ where: { companyId, role: "company_owner" }, select: { id: true } });
		if (owner) {
			await prisma.notification.create({
				data: {
					userId: owner.id,
					priority: "ACTION_NEEDED",
					type: "company_review_comment",
					title: "Reviewer comment",
					body: body.trim(),
					// Read-only: the message is the whole notification.
					actionUrl: null,
				},
			});
		}
	}
	return note;
};

export const updateCompanyDocument = async (
	companyId: string,
	documentId: string,
	data: {
		documentNumber?: string | null;
		issuingAuthority?: string | null;
		issueDate?: string | null;
		expiryDate?: string | null;
		status?: string;
		reviewNote?: string | null;
	},
	actorId: string,
) => {
	const doc = await prisma.companyDocument.findUnique({ where: { id: documentId } });
	if (!doc || doc.companyId !== companyId) throw new AppError("Document not found", 404);
	const toDate = (v?: string | null) => (v === undefined ? undefined : v ? new Date(v) : null);
	const reviewed = data.status !== undefined && data.status !== doc.status;
	const updated = await prisma.companyDocument.update({
		where: { id: documentId },
		data: {
			...(data.documentNumber !== undefined ? { documentNumber: data.documentNumber || null } : {}),
			...(data.issuingAuthority !== undefined ? { issuingAuthority: data.issuingAuthority || null } : {}),
			...(data.issueDate !== undefined ? { issueDate: toDate(data.issueDate) } : {}),
			...(data.expiryDate !== undefined ? { expiryDate: toDate(data.expiryDate) } : {}),
			...(data.status !== undefined ? { status: data.status as any } : {}),
			...(data.reviewNote !== undefined ? { reviewNote: data.reviewNote || null } : {}),
			...(reviewed ? { reviewedAt: new Date(), reviewedById: actorId } : {}),
		},
	});
	await prisma.auditLog.create({
		data: {
			actorId,
			companyId,
			action: "company.document_updated",
			entityType: "document",
			entityId: documentId,
			previousValue: {
				status: doc.status,
				documentNumber: doc.documentNumber,
				issuingAuthority: doc.issuingAuthority,
				issueDate: doc.issueDate?.toISOString() ?? null,
				expiryDate: doc.expiryDate?.toISOString() ?? null,
			},
			newValue: {
				status: updated.status,
				documentNumber: updated.documentNumber,
				issuingAuthority: updated.issuingAuthority,
				issueDate: updated.issueDate?.toISOString() ?? null,
				expiryDate: updated.expiryDate?.toISOString() ?? null,
			},
			reason: data.reviewNote ?? undefined,
		},
	});
	if (reviewed) {
		await prisma.statusHistory.create({
			data: {
				entityType: "document",
				entityId: documentId,
				companyId,
				fromStatus: doc.status,
				toStatus: updated.status,
				actorId,
				reason: data.reviewNote ?? `Document: ${doc.documentType.replace(/_/g, " ")}`,
			},
		});
	}
	return { ...updated, storedStatus: updated.status, status: effectiveDocumentStatus(updated) };
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
				// Shown to the partner on their status screen.
				rejectionReason:
					status === CompanyStatus.REJECTED ||
					status === CompanyStatus.CHANGES_REQUIRED ||
					status === CompanyStatus.SUSPENDED
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
				// Partner-visible reason only — the internal note is stored separately.
				reason: options.reason ?? options.rejectionReason,
			},
		});

		// Internal note stays with staff; the reason is the partner-visible comment.
		if (options.internalNote?.trim()) {
			await tx.reviewNote.create({
				data: { entityType: "company", companyId: id, authorId: actorId, body: options.internalNote.trim(), isInternal: true },
			});
		}
		const partnerReason = options.rejectionReason ?? options.reason;
		if (partnerReason?.trim()) {
			await tx.reviewNote.create({
				data: { entityType: "company", companyId: id, authorId: actorId, body: partnerReason.trim(), isInternal: false },
			});
		}

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
						actionUrl: null,
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
		assignedTo?: string;
		approvalStatus?: ApprovalStatus;
		category?: string;
		companyId?: string;
		search?: string;
	} = {},
) => {
	const skip = (page - 1) * limit;

	const where: Prisma.ListingWhereInput = {
		...(filters.assignedTo ? { assignedReviewerId: filters.assignedTo } : {}),
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

/** Platform-wide counts; for a reviewer (assignedTo) only what is assigned to them. */
export const getPlatformStats = async (assignedTo?: string) => {
	const mine = assignedTo ? { assignedReviewerId: assignedTo } : {};
	const [
		totalCompanies,
		pendingCompanies,
		totalListings,
		liveListings,
		pendingListings,
		totalLeads,
		unresolvedLeads,
	] = await Promise.all([
		prisma.company.count({ where: mine }),
		prisma.company.count({
			where: {
				...mine,
				status: {
					in: [CompanyStatus.SUBMITTED, CompanyStatus.PENDING_REVIEW],
				},
			},
		}),
		prisma.listing.count({ where: { ...mine, publicationStatus: { not: "DELETED" } } }),
		prisma.listing.count({ where: { ...mine, publicationStatus: "LIVE" } }),
		prisma.listing.count({
			where: {
				...mine,
				publicationStatus: { not: "DELETED" },
				approvalStatus: {
					in: [ApprovalStatus.SUBMITTED, ApprovalStatus.PENDING_REVIEW],
				},
			},
		}),
		prisma.lead.count({ where: assignedTo ? { listing: mine } : {} }),
		prisma.lead.count({
			where: {
				...(assignedTo ? { listing: mine } : {}),
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

const STAFF_ROLES: UserRole[] = [UserRole.super_admin, UserRole.platform_reviewer];
const COMPANY_ROLES: UserRole[] = [
	UserRole.company_owner,
	UserRole.company_manager,
	UserRole.agent,
	UserRole.listing_coordinator,
	UserRole.viewer,
];

export const getAllUsers = async (
	page = 1,
	limit = 50,
	filters: {
		companyId?: string;
		role?: UserRole;
		search?: string;
		/** "staff" = platform staff, "partner" = company users */
		type?: string;
		/** "active" | "deactivated" */
		status?: string;
	} = {},
) => {
	const skip = (page - 1) * limit;

	const where: Prisma.UserWhereInput = {
		...(filters.companyId ? { companyId: filters.companyId } : {}),
		...(filters.role ? { role: filters.role } : {}),
		...(filters.type === "staff" ? { role: { in: STAFF_ROLES } } : {}),
		...(filters.type === "partner" ? { role: { in: COMPANY_ROLES } } : {}),
		...(filters.status === "active" ? { banned: false } : {}),
		...(filters.status === "deactivated" ? { banned: true } : {}),
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
		users: users.map((u) => ({ ...u, isPlatformStaff: STAFF_ROLES.includes(u.role) })),
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
	reason: string,
) => {
	if (userId === actorId) {
		throw new AppError("You cannot change your own role.", 400);
	}
	if (!reason?.trim()) {
		throw new AppError("A reason is required to change a role.", 400);
	}

	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new AppError("User not found", 404);

	// Platform staff and partner users are separate: a role change can't move
	// someone between the two.
	const isStaff = STAFF_ROLES.includes(user.role);
	if (isStaff && !STAFF_ROLES.includes(newRole)) {
		throw new AppError("Platform staff can only have a platform role.", 400);
	}
	if (!isStaff && !COMPANY_ROLES.includes(newRole)) {
		throw new AppError("Partner users can only have a company role.", 400);
	}
	if (user.role === UserRole.company_owner && newRole !== UserRole.company_owner && user.companyId) {
		const owners = await prisma.user.count({
			where: { companyId: user.companyId, role: UserRole.company_owner, banned: false },
		});
		if (owners <= 1) {
			throw new AppError("A company must keep at least one owner. Make someone else owner first.", 400);
		}
	}

	const updated = await prisma.user.update({
		where: { id: userId },
		data: { role: newRole },
		select: { id: true, name: true, email: true, role: true, companyId: true },
	});
	invalidateUserAccess(userId);

	await prisma.auditLog.create({
		data: {
			actorId,
			companyId: user.companyId,
			action: "user.role_changed",
			entityType: "user",
			entityId: userId,
			previousValue: { role: user.role },
			newValue: { role: newRole },
			reason: reason.trim(),
		},
	});

	return updated;
};

/** Super Admin invites a user into any approved company. */
export const adminInviteUser = async (
	actorId: string,
	data: { companyId?: string; email: string; role: UserRole },
) => {
	const email = data.email.trim().toLowerCase();
	const staff = STAFF_ROLES.includes(data.role);
	if (!staff && !COMPANY_ROLES.includes(data.role)) {
		throw new AppError("Please choose a valid role.", 400);
	}
	if (!staff && !data.companyId) throw new AppError("Company is required", 400);
	const invitation = staff
		? await createStaffInvitation(actorId, { email, role: data.role })
		: await createInvitation(data.companyId!, actorId, { email, role: data.role });
	return {
		id: invitation.id,
		email: invitation.email,
		role: invitation.role,
		companyId: invitation.companyId,
		expiresAt: invitation.expiresAt,
		inviteUrl: `${env.FRONTEND_URL}/invite/${invitation.token}`,
	};
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
