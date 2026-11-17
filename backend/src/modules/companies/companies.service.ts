import {
	CompanyOnboardingStep,
	CompanyStatus,
} from "../../../generated/prisma/client.js";
import { auth } from "../../lib/auth.js";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../utils/AppError.js";
import { withAttachedUploads } from "../uploads/uploads.service.js";
import { invalidateUserAccess } from "../../lib/accessCache.js";
import { Prisma } from "../../../generated/prisma/client.js";

const UPLOAD_FIELDS = [
	"companyLogo",
	"coverImage",
	"listingLogo",
	"tradeLicense",
	"reraLicense",
	"emiratesId",
	"passport",
	"showroomRegistration",
	"carDealerLicense",
	"marineTradeLicense",
	"boatDealerCertificate",
	"aviationDealerLicense",
	"aocOperatorDocument",
	"carTradeLicense",
	"collectiblesTradeLicense",
	"consignmentAuthority",
];

const IMAGE_UPLOAD_FIELDS = ["companyLogo", "coverImage", "listingLogo"];

const toSnake = (field: string) =>
	field.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

export const getCompanyByUserId = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { company: { include: { documents: true } } },
	});
	return user?.company;
};

export const updateOnboarding = async (data: any) => {
	const { name, ownerEmail, password } = data;

	const uploadFields = UPLOAD_FIELDS.filter((field) => data[`${field}UploadId`]);
	const uploadIds: string[] = [
		...new Set(uploadFields.map((field) => data[`${field}UploadId`])),
	];

	if (!name) throw new Error("Company name is required");
	if (!ownerEmail || !password)
		throw new Error("Owner email and password are required");

	// 1. Create User using better-auth
	let userResponse;
	try {
		userResponse = await auth.api.signUpEmail({
			body: {
				email: ownerEmail,
				password: password,
				name: name, // Using company name as user name for now, or we could add ownerName
			},
		});
	} catch (error: any) {
		console.error("signUpEmail Error:", error);
		// Check for better-auth APIError structure (as provided by the user)
		if (error.body && error.body.message) {
			throw new AppError(error.body.message, error.statusCode || 400);
		}
		throw new AppError(error.message || "Failed to create user account", 400);
	}

	if (!userResponse || !userResponse.user) {
		throw new AppError("Failed to create user account", 400);
	}

	const userId = userResponse.user.id;

	// 2. Create Company. signUpEmail above runs outside this transaction, so if
	// anything below fails, delete the just-created account (sessions/accounts
	// cascade) — otherwise it's left as a company-less user and a retry with
	// the same email fails with "user already exists".
	try {
		return await createOnboardedCompany(data, userId, uploadFields, uploadIds);
	} catch (error) {
		await prisma.user.delete({ where: { id: userId } }).catch((cleanupError) => {
			console.error("Failed to roll back onboarding user:", cleanupError);
		});
		throw error;
	}
};

const createOnboardedCompany = (
	data: any,
	userId: string,
	uploadFields: string[],
	uploadIds: string[],
) => {
	const {
		name, description, address, contactEmail, contactPhone, websiteUrl,
		languages, socialMedia, categories,
	} = data;

	return withAttachedUploads(null, uploadIds, async (tx, keys) => {
		const keyFor = (field: string): string => {
			const key = keys[uploadIds.indexOf(data[`${field}UploadId`])];
			if (!key) throw new AppError(`Upload for ${field} not found`, 400);
			return key;
		};
		const mediaKeys = Object.fromEntries(
			uploadFields
				.filter((field) => IMAGE_UPLOAD_FIELDS.includes(field))
				.map((field) => [`${field}Url`, keyFor(field)]),
		);
		const documentRows = uploadFields
			.filter((field) => !IMAGE_UPLOAD_FIELDS.includes(field))
			.map((field) => {
				// Optional details the partner entered next to the upload.
				const details = data.documentDetails?.[field] ?? {};
				const date = (v?: string) => (v ? new Date(v) : undefined);
				return {
					documentType: toSnake(field),
					fileUrl: keyFor(field),
					documentNumber: details.documentNumber?.trim() || undefined,
					issuingAuthority: details.issuingAuthority?.trim() || undefined,
					issueDate: date(details.issueDate),
					expiryDate: date(details.expiryDate),
				};
			});

		const company = await tx.company.create({
			data: {
				name,
				description,
				address,
				contactEmail,
				contactPhone,
				websiteUrl,
				languages: languages || ["English"],
				socialMedia: socialMedia || {},
				categories: categories || [],
				...mediaKeys,
				...(documentRows.length > 0
					? { documents: { create: documentRows } }
					: {}),
				onboardingStep: CompanyOnboardingStep.COMPLETED,
				onboardingCompletedAt: new Date(),
				status: CompanyStatus.SUBMITTED,
			},
		});

		// 3. Link User to Company and set role
		await tx.user.update({
			where: { id: userId },
			data: {
				companyId: company.id,
				role: "company_owner" as any,
			},
		});

		// 4. Record the DRAFT -> SUBMITTED transition so it shows up in the
		// admin approval queue and the company's status history.
		await tx.statusHistory.create({
			data: {
				entityType: "company",
				entityId: company.id,
				companyId: company.id,
				fromStatus: CompanyStatus.DRAFT,
				toStatus: CompanyStatus.SUBMITTED,
				actorId: userId,
				reason: "Onboarding completed",
			},
		});

		return company;
	});
};

export const getOnboardingStatus = async (userId: string) => {
	const company = await getCompanyByUserId(userId);
	if (!company) return null;

	return {
		step: company.onboardingStep,
		isCompleted: company.onboardingStep === CompanyOnboardingStep.COMPLETED,
		categories: company.categories,
	};
};

// ─── Team management ────────────────────────────────────────────

export const getCompanyUsers = async (companyId: string) => {
	return prisma.user.findMany({
		where: { companyId },
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			phone: true,
			banned: true,
			banReason: true,
			permissions: true,
			createdAt: true,
		},
		orderBy: { createdAt: "asc" },
	});
};

export const deactivateUser = async (
	companyId: string,
	userId: string,
	actorId: string,
	reason?: string,
) => {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user || user.companyId !== companyId) {
		throw new AppError("User not found in your company", 404);
	}
	if (user.role === "company_owner") {
		throw new AppError("The company owner cannot be deactivated.", 400);
	}
	if (user.id === actorId) throw new AppError("You cannot deactivate your own account.", 400);
	if (user.banned) throw new AppError("This user is already deactivated.", 400);

	// Ban the account and end every session at once, so access stops
	// immediately. (Better Auth's banUser endpoint needs an admin session of
	// its own, so it can't be called from here.)
	await prisma.$transaction([
		prisma.user.update({
			where: { id: userId },
			data: { banned: true, banReason: reason?.trim() || "Deactivated by the company", banExpires: null },
		}),
		prisma.session.deleteMany({ where: { userId } }),
	]);
	invalidateUserAccess(userId);

	// Reassign this user's still-open leads to the company owner so nothing
	// goes unattended. Listings keep their original creatorId — the plan is
	// explicit that the company owns business records; the user account only
	// controls access, so historical listing ownership is preserved as-is.
	const owner = await prisma.user.findFirst({
		where: { companyId, role: "company_owner" },
		select: { id: true },
	});

	let reassignedLeads = 0;
	if (owner) {
		const result = await prisma.lead.updateMany({
			where: { assignedToId: userId, stage: { notIn: ["WON", "LOST"] } },
			data: { assignedToId: owner.id },
		});
		reassignedLeads = result.count;
	}

	await prisma.auditLog.create({
		data: {
			actorId,
			companyId,
			action: "user.deactivated",
			entityType: "user",
			entityId: userId,
			reason,
			newValue: { reassignedLeads, reassignedTo: owner?.id },
		},
	});

	return { reassignedLeads };
};

export const updateUserPermissions = async (
	companyId: string,
	userId: string,
	actorId: string,
	permissions: Record<string, boolean>,
) => {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user || user.companyId !== companyId) {
		throw new AppError("User not found in your company", 404);
	}

	const merged = { ...((user.permissions as Record<string, boolean> | null) ?? {}), ...permissions };
	const updated = await prisma.user.update({
		where: { id: userId },
		data: { permissions: merged },
		select: { id: true, permissions: true },
	});
	invalidateUserAccess(userId);

	await prisma.auditLog.create({
		data: {
			actorId,
			companyId,
			action: "user.permissions_updated",
			entityType: "user",
			entityId: userId,
			previousValue: { permissions: user.permissions },
			newValue: { permissions: merged },
		},
	});

	return updated;
};

export const reactivateUser = async (companyId: string, userId: string, actorId: string) => {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user || user.companyId !== companyId) {
		throw new AppError("User not found in your company", 404);
	}

	if (!user.banned) throw new AppError("This user is already active.", 400);

	await prisma.user.update({ where: { id: userId }, data: { banned: false, banReason: null, banExpires: null } });
	invalidateUserAccess(userId);

	await prisma.auditLog.create({
		data: {
			actorId,
			companyId,
			action: "user.reactivated",
			entityType: "user",
			entityId: userId,
		},
	});
};

// ─── Resubmission after "changes required" ──────────────────────

/**
 * The owner updates the company registration the platform sent back and
 * resubmits it. Fields are replaced; a new upload replaces the document of
 * the same type (its review starts again); details entered for a document
 * without a new file update that document. The company goes back to the
 * review queue and the reviewer (or every reviewer) is notified.
 */
export const resubmitRegistration = async (userId: string, data: any) => {
	const user = await prisma.user.findUnique({ where: { id: userId }, include: { company: { include: { documents: true } } } });
	const company = user?.company;
	if (!company) throw new AppError("You must belong to a company.", 403);
	if (user.role !== "company_owner") throw new AppError("Only the company owner can update the registration.", 403);
	if (company.status !== CompanyStatus.CHANGES_REQUIRED) {
		throw new AppError("The registration can only be updated when the platform has asked for changes.", 400);
	}

	const uploadFields = UPLOAD_FIELDS.filter((field) => data[`${field}UploadId`]);
	const uploadIds: string[] = [...new Set(uploadFields.map((field) => data[`${field}UploadId`] as string))];
	const date = (v?: string) => (v ? new Date(v) : null);

	try {
		await withAttachedUploads(userId, uploadIds, async (tx, keys) => {
			const keyFor = (field: string) => {
				const key = keys[uploadIds.indexOf(data[`${field}UploadId`])];
				if (!key) throw new AppError(`Upload for ${field} not found`, 400);
				return key;
			};
			const mediaKeys = Object.fromEntries(
				uploadFields.filter((f) => IMAGE_UPLOAD_FIELDS.includes(f)).map((f) => [`${f}Url`, keyFor(f)]),
			);

			await tx.company.update({
				where: { id: company.id },
				data: {
					name: data.name,
					description: data.description,
					address: data.address,
					contactEmail: data.contactEmail,
					contactPhone: data.contactPhone,
					websiteUrl: data.websiteUrl || null,
					languages: data.languages,
					categories: data.categories,
					...(data.socialMedia ? { socialMedia: data.socialMedia } : {}),
					...mediaKeys,
					status: CompanyStatus.SUBMITTED,
				},
			});

			// Documents: replace files, update details.
			const documentFields = UPLOAD_FIELDS.filter((f) => !IMAGE_UPLOAD_FIELDS.includes(f));
			for (const field of documentFields) {
				const type = toSnake(field);
				const existing = company.documents.find((d) => d.documentType === type);
				const details = data.documentDetails?.[field];
				const detailData = details
					? {
							documentNumber: details.documentNumber?.trim() || null,
							issuingAuthority: details.issuingAuthority?.trim() || null,
							issueDate: date(details.issueDate),
							expiryDate: date(details.expiryDate),
						}
					: {};
				if (data[`${field}UploadId`]) {
					const fileData = { fileUrl: keyFor(field), status: "UPLOADED" as const, reviewNote: null, ...detailData };
					if (existing) await tx.companyDocument.update({ where: { id: existing.id }, data: fileData });
					else await tx.companyDocument.create({ data: { companyId: company.id, documentType: type, ...fileData } });
				} else if (existing && details) {
					await tx.companyDocument.update({ where: { id: existing.id }, data: detailData });
				}
			}

			await tx.statusHistory.create({
				data: {
					entityType: "company",
					entityId: company.id,
					companyId: company.id,
					fromStatus: CompanyStatus.CHANGES_REQUIRED,
					toStatus: CompanyStatus.SUBMITTED,
					actorId: userId,
					reason: "Updated and resubmitted for review",
				},
			});
			await tx.auditLog.create({
				data: {
					actorId: userId,
					companyId: company.id,
					action: "company.resubmitted",
					entityType: "company",
					entityId: company.id,
					newValue: { replacedDocuments: uploadFields.filter((f) => !IMAGE_UPLOAD_FIELDS.includes(f)).map(toSnake) },
				},
			});
		});
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
			throw new AppError("Another company already uses this name.", 409);
		}
		throw error;
	}

	await notifyStaffOfResubmission(company).catch((e) => console.error("Resubmission notification failed:", e));
	return getCompanyByUserId(userId);
};

/** The assigned reviewer, or every active super admin and reviewer. */
const notifyStaffOfResubmission = async (company: { id: string; name: string; assignedReviewerId: string | null }) => {
	let recipients: string[] = [];
	if (company.assignedReviewerId) {
		const r = await prisma.user.findFirst({ where: { id: company.assignedReviewerId, banned: { not: true } }, select: { id: true } });
		if (r) recipients = [r.id];
	}
	if (recipients.length === 0) {
		// Nobody assigned yet: super admins assign it, so they are the ones told.
		const staff = await prisma.user.findMany({
			where: { role: "super_admin", banned: { not: true } },
			select: { id: true },
		});
		recipients = staff.map((s) => s.id);
	}
	if (recipients.length === 0) return;
	await prisma.notification.createMany({
		data: recipients.map((userId) => ({
			userId,
			priority: "ACTION_NEEDED" as const,
			type: "company_resubmitted",
			title: "Company registration resubmitted",
			body: `${company.name} updated their registration after your change request. Please review it again.`,
			actionUrl: `/admin/companies?company=${company.id}`,
		})),
	});
};
