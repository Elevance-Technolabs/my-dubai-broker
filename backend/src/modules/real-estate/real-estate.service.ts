import slug from "slug";
import {
	CompanyCategory, AssetType, ApprovalStatus, PublicationStatus,
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
	CreateRealEstateData,
	UpdateRealEstateData,
} from "../../types/real-estate.types.js";

interface Requester {
	userId: string;
	companyId?: string | null;
	role?: string;
}

export const createRealEstate = async (data: CreateRealEstateData) =>
	withAttachedUploads(
		data.creatorId,
		data.photoUploadIds,
		async (tx, photoKeys) => {
			const listing = await tx.listing.create({
				data: {
					title: data.title,
					slug: slug(data.title),
					publicRef: `MDB-RE-${Date.now()}`,
					description: data.description,
					salePrice: new Prisma.Decimal(data.price),
					currency: data.currency || "AED",
					category: CompanyCategory.REAL_ESTATE,
					assetType: AssetType.VILLA, // default, can be overridden
					offeringType: data.status,
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

			const realEstateListing = await tx.realEstateListing.create({
				data: {
					listingId: listing.id,
					propertyType: data.propertyType,
					permitNumber: data.permitNumber ?? null,
					bedrooms: data.bedrooms ?? null,
					bathrooms: data.bathrooms ?? null,
					builtUpArea: data.builtUpArea ?? null,
					plotArea: data.plotArea ?? null,
					floor: data.floor ?? null,
					parking: data.parking ?? null,
					developer: data.developer ?? null,
					furnished: data.furnished || false,
					paymentPlan: data.paymentPlan ?? null,
					views: data.views || [],
					outdoor: data.outdoor || [],
					indoor: data.indoor || [],
					communityFeatures: data.community || [],
					propertyTags: data.propertyTags || [],
				},
			});

			return {
				...mapListingPhotos(listing),
				realEstateDetails: realEstateListing,
			};
		},
	);

export const getRealEstateById = async (id: string) => {
	return mapListingPhotos(
		await prisma.listing.findUnique({
			where: { id },
			include: {
				realEstateListing: true,
			},
		}),
	);
};

export const updateRealEstate = async (
	id: string,
	data: UpdateRealEstateData,
	requester: Requester,
) => {
	const existing = await prisma.listing.findUnique({
		where: { id },
		select: { companyId: true, photoUrls: true },
	});

	if (!existing) {
		throw new AppError("Listing not found", 404);
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
			if (data.status) listingData.offeringType = data.status;
			if (data.listingStatus) listingData.approvalStatus = data.listingStatus;
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

			const realEstateData: any = {};
			if (data.propertyType) realEstateData.propertyType = data.propertyType;
			if (data.permitNumber) realEstateData.permitNumber = data.permitNumber;
			if (data.bedrooms !== undefined) realEstateData.bedrooms = data.bedrooms;
			if (data.bathrooms !== undefined)
				realEstateData.bathrooms = data.bathrooms;
			if (data.builtUpArea) realEstateData.builtUpArea = data.builtUpArea;
			if (data.plotArea) realEstateData.plotArea = data.plotArea;
			if (data.floor !== undefined) realEstateData.floor = data.floor;
			if (data.parking !== undefined) realEstateData.parking = data.parking;
			if (data.developer) realEstateData.developer = data.developer;
			if (data.furnished !== undefined)
				realEstateData.furnished = data.furnished;
			if (data.paymentPlan) realEstateData.paymentPlan = data.paymentPlan;
			if (data.views) realEstateData.views = data.views;
			if (data.outdoor) realEstateData.outdoor = data.outdoor;
			if (data.indoor) realEstateData.indoor = data.indoor;
			if (data.community) realEstateData.communityFeatures = data.community;
			if (data.propertyTags) realEstateData.propertyTags = data.propertyTags;

			if (Object.keys(realEstateData).length > 0) {
				await tx.realEstateListing.update({
					where: { listingId: id },
					data: realEstateData,
				});
			}

			return mapListingPhotos(
				await tx.listing.findUnique({
					where: { id },
					include: {
						realEstateListing: true,
					},
				}),
			);
		},
	);
};

export const getRealEstateListings = async (
	page = 1,
	limit = 10,
	filters: { propertyType?: string; bedrooms?: number } = {},
) => {
	const skip = (page - 1) * limit;

	const where: Prisma.ListingWhereInput = {
		category: CompanyCategory.REAL_ESTATE,
		realEstateListing: {
			...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
			...(filters.bedrooms ? { bedrooms: filters.bedrooms } : {}),
		},
	};

	const [listings, total] = await Promise.all([
		prisma.listing.findMany({
			where,
			include: {
				realEstateListing: true,
			},
			orderBy: {
				createdAt: "desc",
			},
			skip,
			take: limit,
		}),
		prisma.listing.count({
			where,
		}),
	]);

	return {
		listings: listings.map(mapListingPhotos),
		pagination: {
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	};
};

export const deleteRealEstate = async (id: string) => {
	return await prisma.listing.delete({
		where: { id },
	});
};
