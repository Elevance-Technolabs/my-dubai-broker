import { randomBytes } from "node:crypto";
import { CompanyStatus, UserRole } from "../../../generated/prisma/client.js";
import { prisma } from "../../prisma/client.js";
import { auth } from "../../lib/auth.js";
import { AppError } from "../../utils/AppError.js";
import { sendEmail, emailTemplates } from "../../lib/email.js";
import { env } from "../../lib/env.js";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CreateInvitationInput {
	email: string;
	role: UserRole;
	permissions?: Record<string, any>;
}

export const createInvitation = async (
	companyId: string,
	sentById: string,
	data: CreateInvitationInput,
) => {
	const company = await prisma.company.findUnique({ where: { id: companyId } });
	if (!company) throw new AppError("Company not found", 404);
	if (company.status !== CompanyStatus.APPROVED) {
		throw new AppError("Your company must be approved before inviting team members.", 403);
	}

	const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
	if (existingUser) {
		throw new AppError("A user with this email already exists.", 409);
	}

	const pending = await prisma.invitation.findFirst({
		where: { companyId, email: data.email, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
	});
	if (pending) {
		throw new AppError("An invitation is already pending for this email.", 409);
	}

	const token = randomBytes(32).toString("hex");

	const invitation = await prisma.invitation.create({
		data: {
			companyId,
			email: data.email,
			role: data.role,
			token,
			sentById,
			permissions: data.permissions ?? undefined,
			expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
		},
	});

	await prisma.auditLog.create({
		data: {
			actorId: sentById,
			companyId,
			action: "invitation.sent",
			entityType: "invitation",
			entityId: invitation.id,
			newValue: { email: data.email, role: data.role },
		},
	});

	const inviteUrl = `${env.FRONTEND_URL}/invite/${token}`;
	const { subject, html } = emailTemplates.invitation({
		companyName: company.name,
		role: data.role,
		inviteUrl,
	});
	await sendEmail({ to: data.email, subject, html });
	// No real provider is wired up yet (see PENDING.md) — sendEmail only logs.
	// The caller still surfaces the link in the UI too, as a dev-friendly
	// fallback until a real provider (Resend) actually delivers this.
	return invitation;
};

/** Who a platform-team invitation is from, wherever a company name would show. */
export const PLATFORM_TEAM_NAME = "My Dubai Broker team";

const STAFF_ROLES: UserRole[] = [UserRole.super_admin, UserRole.platform_reviewer];

/**
 * Invitation to join the platform team (super admin or reviewer). Like a
 * company invitation, but the new account is not linked to any company.
 */
export const createStaffInvitation = async (sentById: string, data: { email: string; role: UserRole }) => {
	if (!STAFF_ROLES.includes(data.role)) {
		throw new AppError("Platform team invitations are for super admin or reviewer roles only.", 400);
	}
	const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
	if (existingUser) throw new AppError("A user with this email already exists.", 409);

	const pending = await prisma.invitation.findFirst({
		where: { companyId: null, email: data.email, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
	});
	if (pending) throw new AppError("An invitation is already pending for this email.", 409);

	const token = randomBytes(32).toString("hex");
	const invitation = await prisma.invitation.create({
		data: {
			email: data.email,
			role: data.role,
			token,
			sentById,
			expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
		},
	});

	await prisma.auditLog.create({
		data: {
			actorId: sentById,
			action: "invitation.sent",
			entityType: "invitation",
			entityId: invitation.id,
			newValue: { email: data.email, role: data.role, team: "platform" },
		},
	});

	const inviteUrl = `${env.FRONTEND_URL}/invite/${token}`;
	const { subject, html } = emailTemplates.invitation({ companyName: PLATFORM_TEAM_NAME, role: data.role, inviteUrl, platformTeam: true });
	await sendEmail({ to: data.email, subject, html });
	return invitation;
};

export const listInvitations = async (companyId: string) => {
	return prisma.invitation.findMany({
		where: { companyId },
		orderBy: { createdAt: "desc" },
		include: {
			sentBy: { select: { id: true, name: true, email: true } },
		},
	});
};

export const revokeInvitation = async (id: string, companyId: string, actorId: string) => {
	const invitation = await prisma.invitation.findUnique({ where: { id } });
	if (!invitation || invitation.companyId !== companyId) {
		throw new AppError("Invitation not found", 404);
	}
	if (invitation.acceptedAt) {
		throw new AppError("This invitation has already been accepted.", 400);
	}

	const updated = await prisma.invitation.update({
		where: { id },
		data: { revokedAt: new Date() },
	});

	await prisma.auditLog.create({
		data: {
			actorId,
			companyId,
			action: "invitation.revoked",
			entityType: "invitation",
			entityId: id,
		},
	});

	return updated;
};

export const getInvitationByToken = async (token: string) => {
	const invitation = await prisma.invitation.findUnique({
		where: { token },
		include: { company: { select: { id: true, name: true } } },
	});

	if (!invitation) throw new AppError("Invitation not found", 404);
	if (invitation.revokedAt) throw new AppError("This invitation has been revoked.", 410);
	if (invitation.acceptedAt) throw new AppError("This invitation has already been accepted.", 410);
	if (invitation.expiresAt < new Date()) throw new AppError("This invitation has expired.", 410);

	return {
		email: invitation.email,
		role: invitation.role,
		companyName: invitation.company?.name ?? PLATFORM_TEAM_NAME,
		isPlatformTeam: !invitation.companyId,
		expiresAt: invitation.expiresAt,
	};
};

export const acceptInvitation = async (
	token: string,
	data: { name: string; password: string; phoneNumber?: string },
) => {
	const invitation = await prisma.invitation.findUnique({ where: { token } });
	if (!invitation) throw new AppError("Invitation not found", 404);
	if (invitation.revokedAt) throw new AppError("This invitation has been revoked.", 410);
	if (invitation.acceptedAt) throw new AppError("This invitation has already been accepted.", 410);
	if (invitation.expiresAt < new Date()) throw new AppError("This invitation has expired.", 410);

	const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });
	if (existingUser) {
		throw new AppError("A user with this email already exists.", 409);
	}

	let userResponse;
	try {
		userResponse = await auth.api.signUpEmail({
			body: {
				email: invitation.email,
				password: data.password,
				name: data.name,
			},
		});
	} catch (error: any) {
		if (error.body?.message) throw new AppError(error.body.message, error.statusCode || 400);
		throw new AppError(error.message || "Failed to create user account", 400);
	}

	if (!userResponse?.user) {
		throw new AppError("Failed to create user account", 400);
	}

	const userId = userResponse.user.id;

	try {
		const user = await prisma.user.update({
			where: { id: userId },
			data: {
				companyId: invitation.companyId,
				role: invitation.role,
				phone: data.phoneNumber ?? null,
				permissions: invitation.permissions ?? undefined,
			},
		});

		await prisma.invitation.update({
			where: { id: invitation.id },
			data: { acceptedAt: new Date() },
		});

		await prisma.auditLog.create({
			data: {
				actorId: userId,
				companyId: invitation.companyId,
				action: "invitation.accepted",
				entityType: "invitation",
				entityId: invitation.id,
				newValue: { role: invitation.role },
			},
		});

		return user;
	} catch (error) {
		// Roll back the auth account if linking to the company (or setting the
		// staff role) fails, so we don't leave an orphaned user with no role.
		await prisma.user.delete({ where: { id: userId } });
		throw error;
	}
};
