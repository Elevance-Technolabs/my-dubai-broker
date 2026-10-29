import slug from "slug";
import {
	CompanyCategory, AssetType, OfferingType, PublicationStatus,
	ApprovalStatus,
	Prisma,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../prisma/client.js";
import {
	withAttachedUploads,
	withMergedListingPhotos,
} from "../uploads/uploads.service.js";
import { mapListingPhotos } from "../listings/listings.mapper.js";
import { AppError } from "../../utils/AppError.js";
import type {
	CreateYachtData,
	UpdateYachtData,
} from "../../types/yachts.types.js";

interface Requester {
	userId: string;
	companyId?: string | null;
	role?: string;
}

export const createYacht = async (data: CreateYachtData) =>
	withAttachedUploads(
		data.creatorId,
		data.photoUploadIds,
		async (tx, photoKeys) => {
			const listing = await tx.listing.create({
				data: {
					title: data.title,
					slug: slug(data.title),
					publicRef: `MDB-YT-${Date.now()}`,
					description: data.description,
					salePrice: new Prisma.Decimal(data.price),
					currency: data.currency || "AED",
					category: CompanyCategory.YACHTS,
					assetType: AssetType.MOTOR_YACHT, // default, can be overridden
					offeringType: OfferingType.SALE,
					publicationStatus: PublicationStatus.UNPUBLISHED,
					approvalStatus: ApprovalStatus.DRAFT,
					photoUrls: photoKeys,
					videoUrl: data.videoUrl ?? null,
					internalReferenceCode: data.internalReferenceCode ?? null,
					licenseNumber: data.licenseNumber ?? null,
					primaryEmail: data.primaryEmail,
					primaryPhone: data.primaryPhone,
					companyId: data.companyId,
					creatorId: data.creatorId,
				},
			});

			const yachtListing = await tx.yachtListing.create({
				data: {
					listingId: listing.id,
					builder: data.make,
					year: data.year,
					lengthFt: data.length,
					beamFt: data.beam ?? null,
					hullMaterial: data.materials ?? null,
					engineHours: data.engineHours ?? null,
					cabins: data.cabins ?? null,
					navigation: data.navigation || [],
				},
			});

			return { ...mapListingPhotos(listing), yachtDetails: yachtListing };
		},
	);

export const getYachtById = async (id: string) => {
	return mapListingPhotos(
		await prisma.listing.findUnique({
			where: { id },
			include: {
				yachtListing: true,
			},
		}),
	);
};

export const updateYacht = async (
	id: string,
	data: UpdateYachtData,
	requester: Requester,
) => {
	const existing = await prisma.listing.findUnique({
		where: { id },
		select: { companyId: true, photoUrls: true },
	});

	if (!existing) {
		throw new AppError("Yacht not found", 404);
	}

	if (
		requester.role !== "super_admin" &&
		requester.companyId !== existing.companyId
	) {
		throw new AppError(
			"You do not have permission to update this listing",
			403,
		);
	}

	return await withMergedListingPhotos(
		requester.userId,
		existing.photoUrls,
		data,
		async (tx, photoKeys) => {
			const listingData: any = {};
			if (data.title) {
				listingData.title = data.title;
				listingData.slug = slug(data.title);
			}
			if (data.description) listingData.description = data.description;
			if (data.price) listingData.salePrice = new Prisma.Decimal(data.price);
			if (data.currency) listingData.currency = data.currency;
			if (data.status) listingData.approvalStatus = data.status;
			if (photoKeys) listingData.photoUrls = photoKeys;
			if (data.videoUrl) listingData.videoUrl = data.videoUrl;
			if (data.primaryEmail) listingData.primaryEmail = data.primaryEmail;
			if (data.primaryPhone) listingData.primaryPhone = data.primaryPhone;
			if (data.adminRejectionReason)
				listingData.adminRejectionReason = data.adminRejectionReason;

			if (Object.keys(listingData).length > 0) {
				await tx.listing.update({
					where: { id },
					data: listingData,
				});
			}

			const yachtData: any = {};
			if (data.year) yachtData.year = data.year;
			if (data.make) yachtData.builder = data.make;
			if (data.length) yachtData.lengthFt = data.length;
			if (data.beam) yachtData.beamFt = data.beam;
			if (data.materials) yachtData.hullMaterial = data.materials;
			if (data.engineHours) yachtData.engineHours = data.engineHours;
			if (data.cabins) yachtData.cabins = data.cabins;
			if (data.navigation) yachtData.navigation = data.navigation;

			if (Object.keys(yachtData).length > 0) {
				await tx.yachtListing.update({
					where: { listingId: id },
					data: yachtData,
				});
			}

			return mapListingPhotos(
				await tx.listing.findUnique({
					where: { id },
					include: {
						yachtListing: true,
					},
				}),
			);
		},
	);
};

export const getYachts = async (page = 1, limit = 10) => {
	const skip = (page - 1) * limit;

	const [yachts, total] = await Promise.all([
		prisma.listing.findMany({
			where: {
				category: CompanyCategory.YACHTS,
			},
			include: {
				yachtListing: true,
			},
			orderBy: {
				createdAt: "desc",
			},
			skip,
			take: limit,
		}),
		prisma.listing.count({
			where: {
				category: CompanyCategory.YACHTS,
			},
		}),
	]);

	return {
		yachts: yachts.map(mapListingPhotos),
		pagination: {
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	};
};

export const deleteYacht = async (id: string) => {
	return await prisma.listing.delete({
		where: { id },
	});
};
