import slug from "slug";
import {
	ApprovalStatus,
	AssetType,
	CompanyCategory,
	OfferingType,
	PublicationStatus,
	Prisma,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../prisma/client.js";
import { withAttachedUploads, withMergedListingPhotos } from "../uploads/uploads.service.js";
import { mapToListing } from "./listings.mapper.js";
import { AppError } from "../../utils/AppError.js";
import { sendEmail, emailTemplates } from "../../lib/email.js";

// ─── Shared include definition ───────────────────────────────

const listingIncludes = {
	realEstateListing: true,
	carListing: true,
	yachtListing: true,
	privateAviationListing: true,
	collectibleListing: true,
	availability: true,
	company: {
		select: { id: true, name: true, slug: true, companyLogoUrl: true },
	},
	creator: {
		select: { id: true, name: true, email: true, image: true },
	},
	qualitySnapshot: true,
	rankSnapshot: true,
} satisfies Prisma.ListingInclude;

// ─── Public Reference Generator ──────────────────────────────

const CATEGORY_PREFIX: Record<CompanyCategory, string> = {
	REAL_ESTATE: "RE",
	CARS: "CR",
	YACHTS: "YT",
	PRIVATE_AVIATION: "AV",
	COLLECTIBLES: "CL",
};

async function generatePublicRef(category: CompanyCategory): Promise<string> {
	const prefix = CATEGORY_PREFIX[category] ?? "XX";
	const count = await prisma.listing.count({ where: { category } });
	const seq = String(count + 1).padStart(5, "0");
	return `MDB-${prefix}-${seq}`;
}

// ─── CREATE ──────────────────────────────────────────────────

export interface CreateListingData {
	// Core
	title: string;
	description: string;
	category: CompanyCategory;
	assetType: AssetType;
	offeringType: OfferingType;

	// Pricing
	salePrice?: number;
	annualRent?: number;
	monthlyRent?: number;
	dailyRate?: number;
	charterRate?: number;
	currency?: string;
	priceOnRequest?: boolean;
	negotiable?: boolean;

	// Location
	country?: string;
	city?: string;
	area?: string;
	address?: string;
	hideExactLocation?: boolean;
	latitude?: number;
	longitude?: number;
	operatingBase?: string;

	// Contact
	primaryEmail?: string;
	primaryPhone?: string;

	// Media
	photoUploadIds: string[];
	videoUrl?: string;
	vrTourUrl?: string;

	// Internal
	licenseNumber?: string;
	internalReferenceCode?: string;

	// Category-specific details (passed through as-is, handled per-category)
	details?: Record<string, any>;
}

export const createListing = async (
	userId: string,
	data: CreateListingData,
) => {
	// Verify the user belongs to a company
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { companyId: true, company: { select: { id: true, status: true } } },
	});

	if (!user?.companyId || !user.company) {
		throw new AppError("You must belong to an approved company to create listings.", 403);
	}

	if (user.company.status !== "APPROVED") {
		throw new AppError("Your company must be approved before you can create listings.", 403);
	}

	const companyId = user.companyId;

	return withAttachedUploads(userId, data.photoUploadIds, async (tx, photoKeys) => {
		const safeSlug = slug(data.title);
		const publicRef = await generatePublicRef(data.category);

		const listingData: Prisma.ListingCreateInput = {
			title: data.title,
			slug: `${safeSlug}-${Date.now()}`,
			publicRef,
			description: data.description,
			category: data.category,
			assetType: data.assetType,
			offeringType: data.offeringType,
			currency: (data.currency as any) ?? "AED",
			priceOnRequest: data.priceOnRequest ?? false,
			negotiable: data.negotiable ?? false,
			photoUrls: photoKeys,
			videoUrl: data.videoUrl,
			vrTourUrl: data.vrTourUrl,
			country: data.country,
			city: data.city,
			area: data.area,
			address: data.address,
			hideExactLocation: data.hideExactLocation ?? false,
			latitude: data.latitude,
			longitude: data.longitude,
			operatingBase: data.operatingBase,
			primaryEmail: data.primaryEmail,
			primaryPhone: data.primaryPhone,
			licenseNumber: data.licenseNumber,
			internalReferenceCode: data.internalReferenceCode,
			approvalStatus: ApprovalStatus.DRAFT,
			publicationStatus: PublicationStatus.UNPUBLISHED,
			company: { connect: { id: companyId } },
			creator: { connect: { id: userId } },
		};

		// Set pricing fields
		if (data.salePrice != null) listingData.salePrice = new Prisma.Decimal(data.salePrice);
		if (data.annualRent != null) listingData.annualRent = new Prisma.Decimal(data.annualRent);
		if (data.monthlyRent != null) listingData.monthlyRent = new Prisma.Decimal(data.monthlyRent);
		if (data.dailyRate != null) listingData.dailyRate = new Prisma.Decimal(data.dailyRate);
		if (data.charterRate != null) listingData.charterRate = new Prisma.Decimal(data.charterRate);

		// Create listing
		const listing = await tx.listing.create({
			data: listingData,
			include: listingIncludes,
		});

		// Attach category-specific sub-record if details were provided
		if (data.details && Object.keys(data.details).length > 0) {
			await attachCategoryDetails(tx, listing.id, data.category, data.details);
		}

		// Record status history
		await tx.statusHistory.create({
			data: {
				entityType: "listing",
				entityId: listing.id,
				listingId: listing.id,
				fromStatus: "",
				toStatus: ApprovalStatus.DRAFT,
				actorId: userId,
				reason: "Listing created",
			},
		});

		return mapToListing(listing);
	});
};

// Attaches the category-specific sub-record in the same transaction
async function attachCategoryDetails(
	tx: Prisma.TransactionClient,
	listingId: string,
	category: CompanyCategory,
	details: Record<string, any>,
) {
	// Category-specific details are validated by the caller (dynamic per-category
	// schema, see plan Section 10) — Prisma's required-field typing can't express that here.
	switch (category) {
		case CompanyCategory.REAL_ESTATE:
			await tx.realEstateListing.create({ data: { listingId, ...details } as Prisma.RealEstateListingUncheckedCreateInput });
			break;
		case CompanyCategory.CARS:
			await tx.carListing.create({ data: { listingId, ...details } as Prisma.CarListingUncheckedCreateInput });
			break;
		case CompanyCategory.YACHTS:
			await tx.yachtListing.create({ data: { listingId, ...details } as Prisma.YachtListingUncheckedCreateInput });
			break;
		case CompanyCategory.PRIVATE_AVIATION:
			await tx.privateAviationListing.create({ data: { listingId, ...details } as Prisma.PrivateAviationListingUncheckedCreateInput });
			break;
		case CompanyCategory.COLLECTIBLES:
			await tx.collectibleListing.create({ data: { listingId, ...details } as Prisma.CollectibleListingUncheckedCreateInput });
			break;
	}
}

// ─── UPDATE ──────────────────────────────────────────────────

export interface UpdateListingData extends Partial<Omit<CreateListingData, "photoUploadIds">> {
	existingPhotoKeys?: string[];
	photoUploadIds?: string[];
}

interface Requester {
	userId: string;
	companyId?: string | null;
	role?: string;
}

export const updateListing = async (
	id: string,
	data: UpdateListingData,
	requester: Requester,
) => {
	const existing = await prisma.listing.findUnique({
		where: { id },
		select: { companyId: true, category: true, photoUrls: true },
	});
	if (!existing) throw new AppError("Listing not found", 404);

	if (requester.role !== "super_admin" && requester.companyId !== existing.companyId) {
		throw new AppError("You do not have permission to update this listing", 403);
	}

	return withMergedListingPhotos(
		requester.userId,
		existing.photoUrls,
		data,
		async (tx, photoKeys) => {
			const listingData: Prisma.ListingUpdateInput = {};
			if (data.title !== undefined) {
				listingData.title = data.title;
				listingData.slug = `${slug(data.title)}-${Date.now()}`;
			}
			if (data.description !== undefined) listingData.description = data.description;
			if (data.offeringType !== undefined) listingData.offeringType = data.offeringType;
			if (data.currency !== undefined) listingData.currency = data.currency as any;
			if (data.priceOnRequest !== undefined) listingData.priceOnRequest = data.priceOnRequest;
			if (data.negotiable !== undefined) listingData.negotiable = data.negotiable;
			// A listing has one active price. When an update supplies any price
			// field, clear the others so e.g. a sale→charter switch doesn't leave
			// the old salePrice behind (it would win in every price display).
			const priceFields = ["salePrice", "annualRent", "monthlyRent", "dailyRate", "charterRate"] as const;
			if (priceFields.some((f) => data[f] != null)) {
				for (const f of priceFields) {
					listingData[f] = data[f] != null ? new Prisma.Decimal(data[f]) : null;
				}
			}
			if (data.country !== undefined) listingData.country = data.country;
			if (data.city !== undefined) listingData.city = data.city;
			if (data.area !== undefined) listingData.area = data.area;
			if (data.address !== undefined) listingData.address = data.address;
			if (data.hideExactLocation !== undefined) listingData.hideExactLocation = data.hideExactLocation;
			if (data.latitude !== undefined) listingData.latitude = data.latitude;
			if (data.longitude !== undefined) listingData.longitude = data.longitude;
			if (data.operatingBase !== undefined) listingData.operatingBase = data.operatingBase;
			if (data.primaryEmail !== undefined) listingData.primaryEmail = data.primaryEmail;
			if (data.primaryPhone !== undefined) listingData.primaryPhone = data.primaryPhone;
			if (data.videoUrl !== undefined) listingData.videoUrl = data.videoUrl;
			if (data.vrTourUrl !== undefined) listingData.vrTourUrl = data.vrTourUrl;
			if (data.licenseNumber !== undefined) listingData.licenseNumber = data.licenseNumber;
			if (data.internalReferenceCode !== undefined)
				listingData.internalReferenceCode = data.internalReferenceCode;
			if (photoKeys) listingData.photoUrls = photoKeys;

			if (Object.keys(listingData).length > 0) {
				await tx.listing.update({ where: { id }, data: listingData });
			}

			if (data.details && Object.keys(data.details).length > 0) {
				await upsertCategoryDetails(tx, id, existing.category, data.details);
			}

			const updated = await tx.listing.findUniqueOrThrow({ where: { id }, include: listingIncludes });
			return mapToListing(updated);
		},
	);
};

// Updates (or creates, if missing) the category-specific sub-record — same
// "trust the caller's per-category validation" contract as attachCategoryDetails.
async function upsertCategoryDetails(
	tx: Prisma.TransactionClient,
	listingId: string,
	category: CompanyCategory,
	details: Record<string, any>,
) {
	switch (category) {
		case CompanyCategory.REAL_ESTATE:
			await tx.realEstateListing.upsert({
				where: { listingId },
				update: details as Prisma.RealEstateListingUpdateInput,
				create: { listingId, ...details } as Prisma.RealEstateListingUncheckedCreateInput,
			});
			break;
		case CompanyCategory.CARS:
			await tx.carListing.upsert({
				where: { listingId },
				update: details as Prisma.CarListingUpdateInput,
				create: { listingId, ...details } as Prisma.CarListingUncheckedCreateInput,
			});
			break;
		case CompanyCategory.YACHTS:
			await tx.yachtListing.upsert({
				where: { listingId },
				update: details as Prisma.YachtListingUpdateInput,
				create: { listingId, ...details } as Prisma.YachtListingUncheckedCreateInput,
			});
			break;
		case CompanyCategory.PRIVATE_AVIATION:
			await tx.privateAviationListing.upsert({
				where: { listingId },
				update: details as Prisma.PrivateAviationListingUpdateInput,
				create: { listingId, ...details } as Prisma.PrivateAviationListingUncheckedCreateInput,
			});
			break;
		case CompanyCategory.COLLECTIBLES:
			await tx.collectibleListing.upsert({
				where: { listingId },
				update: details as Prisma.CollectibleListingUpdateInput,
				create: { listingId, ...details } as Prisma.CollectibleListingUncheckedCreateInput,
			});
			break;
	}
}

// ─── READ ────────────────────────────────────────────────────

export const getListings = async (
	page = 1,
	limit = 10,
	filters: {
		companyId?: string;
		creatorId?: string;
		approvalStatus?: ApprovalStatus;
		publicationStatus?: PublicationStatus;
		category?: CompanyCategory;
		search?: string;
	} = {},
) => {
	const skip = (page - 1) * limit;

	const where: Prisma.ListingWhereInput = {
		...(filters.companyId ? { companyId: filters.companyId } : {}),
		...(filters.creatorId ? { creatorId: filters.creatorId } : {}),
		...(filters.approvalStatus ? { approvalStatus: filters.approvalStatus } : {}),
		...(filters.publicationStatus ? { publicationStatus: filters.publicationStatus } : {}),
		...(filters.category ? { category: filters.category } : {}),
		...(filters.search
			? {
					OR: [
						{ title: { contains: filters.search, mode: "insensitive" } },
						{ publicRef: { contains: filters.search, mode: "insensitive" } },
						{ company: { name: { contains: filters.search, mode: "insensitive" } } },
					],
				}
			: {}),
	};

	const [listings, total] = await Promise.all([
		prisma.listing.findMany({
			where,
			include: listingIncludes,
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.listing.count({ where }),
	]);

	return {
		listings: listings.map(mapToListing),
		pagination: {
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	};
};

export const getCompanyListings = async (
	companyId: string,
	page = 1,
	limit = 10,
	filters: {
		approvalStatus?: ApprovalStatus;
		publicationStatus?: PublicationStatus;
		category?: CompanyCategory;
		creatorId?: string;
	} = {},
) => {
	return getListings(page, limit, { companyId, ...filters });
};

export const getMyListings = async (
	userId: string,
	page = 1,
	limit = 10,
) => {
	return getListings(page, limit, { creatorId: userId });
};

export const getAdminListings = async (
	page = 1,
	limit = 10,
	filters: {
		approvalStatus?: ApprovalStatus;
		publicationStatus?: PublicationStatus;
		category?: CompanyCategory;
		companyId?: string;
		search?: string;
	} = {},
) => {
	return getListings(page, limit, filters);
};

export const getListingById = async (id: string) => {
	const listing = await prisma.listing.findUnique({
		where: { id },
		include: listingIncludes,
	});
	if (!listing) return null;
	return mapToListing(listing);
};

export const getPublicListings = async (
	page = 1,
	limit = 10,
	filters: { category?: CompanyCategory; excludeId?: string } = {},
) => {
	const skip = (page - 1) * limit;

	const where: Prisma.ListingWhereInput = {
		approvalStatus: ApprovalStatus.APPROVED,
		publicationStatus: PublicationStatus.LIVE,
		...(filters.category ? { category: filters.category } : {}),
		...(filters.excludeId ? { id: { not: filters.excludeId } } : {}),
	};

	const [listings, total] = await Promise.all([
		prisma.listing.findMany({
			where,
			include: listingIncludes,
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.listing.count({ where }),
	]);

	return {
		listings: listings.map(mapToListing),
		pagination: {
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	};
};

export const getPublicListingById = async (id: string) => {
	const listing = await prisma.listing.findFirst({
		where: {
			id,
			approvalStatus: ApprovalStatus.APPROVED,
			publicationStatus: PublicationStatus.LIVE,
		},
		include: listingIncludes,
	});
	if (!listing) return null;
	return mapToListing(listing);
};

// ─── STATUS TRANSITIONS ──────────────────────────────────────

export const updateApprovalStatus = async (
	listingId: string,
	status: ApprovalStatus,
	actorId: string,
	options: {
		rejectionReason?: string;
		internalNote?: string;
		reason?: string;
	} = {},
) => {
	const listing = await prisma.listing.findUnique({ where: { id: listingId } });
	if (!listing) throw new AppError("Listing not found", 404);

	if (
		(status === ApprovalStatus.REJECTED || status === ApprovalStatus.CHANGES_REQUIRED) &&
		!options.reason &&
		!options.rejectionReason
	) {
		throw new AppError(`A reason is required when setting status to ${status}`, 400);
	}

	const previousStatus = listing.approvalStatus;

	const { updated, creator } = await prisma.$transaction(async (tx) => {
		// Update listing
		const updatedListing = await tx.listing.update({
			where: { id: listingId },
			data: {
				approvalStatus: status,
				adminRejectionReason: options.rejectionReason ?? listing.adminRejectionReason,
				reviewedAt: new Date(),
				reviewedById: actorId,
				// Auto-publish when approved by admin
				...(status === ApprovalStatus.APPROVED
					? { publicationStatus: PublicationStatus.LIVE, publishedAt: new Date() }
					: {}),
			},
			include: listingIncludes,
		});

		// Record status history
		await tx.statusHistory.create({
			data: {
				entityType: "listing",
				entityId: listingId,
				listingId,
				fromStatus: previousStatus,
				toStatus: status,
				actorId,
				reason: options.reason ?? options.rejectionReason,
			},
		});

		// Write audit log for admin actions
		if (
			status === ApprovalStatus.APPROVED ||
			status === ApprovalStatus.REJECTED ||
			status === ApprovalStatus.CHANGES_REQUIRED
		) {
			await tx.auditLog.create({
				data: {
					actorId,
					companyId: listing.companyId,
					action: `listing.approval.${status.toLowerCase()}`,
					entityType: "listing",
					entityId: listingId,
					previousValue: { approvalStatus: previousStatus },
					newValue: { approvalStatus: status },
					reason: options.reason ?? options.rejectionReason ?? options.internalNote,
				},
			});
		}

		const creator = await tx.user.findUnique({
			where: { id: listing.creatorId },
			select: { id: true, email: true },
		});

		return { updated: updatedListing, creator };
	});

	const NOTIFICATION_CONFIG: Partial<
		Record<ApprovalStatus, { priority: string; type: string; title: string; body: string }>
	> = {
		[ApprovalStatus.APPROVED]: {
			priority: "INFORMATION",
			type: "listing_approved",
			title: "Listing Approved",
			body: `Your listing "${listing.title}" is now live.`,
		},
		[ApprovalStatus.CHANGES_REQUIRED]: {
			priority: "ACTION_NEEDED",
			type: "listing_changes_required",
			title: "Changes Required",
			body: options.rejectionReason ?? options.reason ?? "Please review and update your listing.",
		},
		[ApprovalStatus.REJECTED]: {
			priority: "URGENT",
			type: "listing_rejected",
			title: "Listing Rejected",
			body: options.rejectionReason ?? options.reason ?? "Your listing was not approved.",
		},
	};

	const cfg = NOTIFICATION_CONFIG[status];
	if (cfg && creator) {
		await prisma.notification.create({
			data: {
				userId: creator.id,
				priority: cfg.priority as any,
				type: cfg.type,
				title: cfg.title,
				body: cfg.body,
				actionUrl: `/listings/${listingId}`,
			},
		});

		const { subject, html } = emailTemplates.listingStatusChanged({
			listingTitle: listing.title,
			status,
			reason: cfg.body,
		});
		await sendEmail({ to: creator.email, subject, html });
	}

	return mapToListing(updated);
};

export const submitListing = async (listingId: string, actorId: string) => {
	const listing = await prisma.listing.findUnique({ where: { id: listingId } });
	if (!listing) throw new AppError("Listing not found", 404);

	if (listing.approvalStatus !== ApprovalStatus.DRAFT &&
		listing.approvalStatus !== ApprovalStatus.CHANGES_REQUIRED) {
		throw new AppError(
			`Cannot submit a listing with status: ${listing.approvalStatus}`,
			400,
		);
	}

	const updated = await prisma.$transaction(async (tx) => {
		const updatedListing = await tx.listing.update({
			where: { id: listingId },
			data: {
				approvalStatus: ApprovalStatus.SUBMITTED,
				submittedAt: new Date(),
			},
			include: listingIncludes,
		});

		await tx.statusHistory.create({
			data: {
				entityType: "listing",
				entityId: listingId,
				listingId,
				fromStatus: listing.approvalStatus,
				toStatus: ApprovalStatus.SUBMITTED,
				actorId,
				reason: "Submitted for platform review",
			},
		});

		return updatedListing;
	});

	return mapToListing(updated);
};

export const pauseListing = async (listingId: string, actorId: string) => {
	const listing = await prisma.listing.findUnique({ where: { id: listingId } });
	if (!listing) throw new AppError("Listing not found", 404);

	if (listing.publicationStatus !== PublicationStatus.LIVE) {
		throw new AppError("Only live listings can be paused", 400);
	}

	await prisma.listing.update({
		where: { id: listingId },
		data: { publicationStatus: PublicationStatus.PAUSED },
	});

	await prisma.statusHistory.create({
		data: {
			entityType: "listing",
			entityId: listingId,
			listingId,
			fromStatus: PublicationStatus.LIVE,
			toStatus: PublicationStatus.PAUSED,
			actorId,
		},
	});
};

export const archiveListing = async (listingId: string, actorId: string, reason?: string) => {
	const listing = await prisma.listing.findUnique({ where: { id: listingId } });
	if (!listing) throw new AppError("Listing not found", 404);

	await prisma.$transaction(async (tx) => {
		await tx.listing.update({
			where: { id: listingId },
			data: { publicationStatus: PublicationStatus.ARCHIVED },
		});

		await tx.statusHistory.create({
			data: {
				entityType: "listing",
				entityId: listingId,
				listingId,
				fromStatus: listing.publicationStatus,
				toStatus: PublicationStatus.ARCHIVED,
				actorId,
				reason,
			},
		});

		await tx.auditLog.create({
			data: {
				actorId,
				companyId: listing.companyId,
				action: "listing.archived",
				entityType: "listing",
				entityId: listingId,
				previousValue: { publicationStatus: listing.publicationStatus },
				newValue: { publicationStatus: PublicationStatus.ARCHIVED },
				reason,
			},
		});
	});
};

// Legacy alias — kept for backward compatibility with older routes
export const updateListingStatus = updateApprovalStatus;
