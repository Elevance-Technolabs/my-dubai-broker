import {
	CompanyOnboardingStep,
	CompanyStatus,
} from "../../../generated/prisma/client.js";
import { auth } from "../../lib/auth.js";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../utils/AppError.js";
import { withAttachedUploads } from "../uploads/uploads.service.js";

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
			.map((field) => ({
				documentType: toSnake(field),
				fileUrl: keyFor(field),
			}));

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

	await auth.api.banUser({ body: { userId, banReason: reason } });

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

	await auth.api.unbanUser({ body: { userId } });

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
