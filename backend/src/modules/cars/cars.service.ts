import slug from "slug";
import {
	CompanyCategory,
	AssetType,
	OfferingType,
	ApprovalStatus,
	PublicationStatus,
	Prisma,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../prisma/client.js";
import {
	withAttachedUploads,
	withMergedListingPhotos,
} from "../uploads/uploads.service.js";
import { mapListingPhotos } from "../listings/listings.mapper.js";
import { AppError } from "../../utils/AppError.js";
import type { CreateCarData, UpdateCarData } from "../../types/cars.types.js";

interface Requester {
	userId: string;
	companyId?: string | null;
	role?: string;
}

export const createCar = async (data: CreateCarData) =>
	withAttachedUploads(
		data.creatorId,
		data.photoUploadIds,
		async (tx, photoKeys) => {
			const listing = await tx.listing.create({
				data: {
					title: data.title,
					slug: slug(data.title),
					publicRef: `MDB-CR-${Date.now()}`,
					description: data.description,
					salePrice: new Prisma.Decimal(data.price),
					currency: data.currency as any || "AED",
					category: CompanyCategory.CARS,
					assetType: AssetType.SEDAN, // default, can be overridden
					offeringType: OfferingType.SALE,
					approvalStatus: ApprovalStatus.DRAFT,
					publicationStatus: PublicationStatus.UNPUBLISHED,
					photoUrls: photoKeys,
					videoUrl: data.videoUrl ?? null,
					internalReferenceCode: data.internalReferenceCode ?? null,
					licenseNumber: data.licenseNumber ?? null,
					primaryEmail: data.primaryEmail,
					primaryPhone: data.primaryPhone,
					companyId: data.companyId,
					creatorId: data.creatorId,
					negotiable: data.negotiable || false,
				},
			});

			const carListing = await tx.carListing.create({
				data: {
					listingId: listing.id,
					make: data.brand,
					model: data.model,
					year: data.year,
					variant: data.variant ?? null,
					mileage: data.mileage,
					condition: data.condition,
					transmission: data.transmission,
					engineSize: data.engineSize ?? null,
					horsepower: data.horsepower ?? null,
					exteriorColor: data.color,
					interiorColor: data.interiorColor ?? null,
					warranty: data.warranty || false,
					options: data.options || [],
				},
			});

			return { ...mapListingPhotos(listing), carDetails: carListing };
		},
	);

export const getCarById = async (id: string) => {
	return mapListingPhotos(
		await prisma.listing.findUnique({
			where: { id },
			include: {
				carListing: true,
			},
		}),
	);
};

export const updateCar = async (
	id: string,
	data: UpdateCarData,
	requester: Requester,
) => {
	const existing = await prisma.listing.findUnique({
		where: { id },
		select: { companyId: true, photoUrls: true },
	});

	if (!existing) {
		throw new AppError("Car not found", 404);
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
			if (data.negotiable !== undefined) listingData.negotiable = data.negotiable;
			if (data.adminRejectionReason)
				listingData.adminRejectionReason = data.adminRejectionReason;

			if (Object.keys(listingData).length > 0) {
				await tx.listing.update({
					where: { id },
					data: listingData,
				});
			}

			const carData: any = {};
			if (data.brand) carData.make = data.brand;
			if (data.model) carData.model = data.model;
			if (data.year) carData.year = data.year;
			if (data.variant) carData.variant = data.variant;
			if (data.mileage) carData.mileage = data.mileage;
			if (data.condition) carData.condition = data.condition;
			if (data.transmission) carData.transmission = data.transmission;
			if (data.engineSize) carData.engineSize = data.engineSize;
			if (data.horsepower) carData.horsepower = data.horsepower;
			if (data.color) carData.exteriorColor = data.color;
			if (data.interiorColor) carData.interiorColor = data.interiorColor;
			if (data.warranty !== undefined) carData.warranty = data.warranty;
			if (data.options) carData.options = data.options;

			if (Object.keys(carData).length > 0) {
				await tx.carListing.update({
					where: { listingId: id },
					data: carData,
				});
			}

			return mapListingPhotos(
				await tx.listing.findUnique({
					where: { id },
					include: {
						carListing: true,
					},
				}),
			);
		},
	);
};

export const getCars = async (page = 1, limit = 10) => {
	const skip = (page - 1) * limit;

	const [cars, total] = await Promise.all([
		prisma.listing.findMany({
			where: {
				category: CompanyCategory.CARS,
			},
			include: {
				carListing: true,
			},
			orderBy: {
				createdAt: "desc",
			},
			skip,
			take: limit,
		}),
		prisma.listing.count({
			where: {
				category: CompanyCategory.CARS,
			},
		}),
	]);

	return {
		cars: cars.map(mapListingPhotos),
		pagination: {
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	};
};

export const deleteCar = async (id: string) => {
	return await prisma.listing.delete({
		where: { id },
	});
};
