import type {
	CarListing,
	CollectibleListing,
	Company,
	Listing,
	PrivateAviationListing,
	QualitySnapshot,
	RankSnapshot,
	RealEstateListing,
	User,
	YachtListing,
	Availability,
} from "../../../generated/prisma/client.js";
import { toPublicUrl } from "../../lib/r2.js";

// ─── Category display labels (never show raw enum to the UI) ─

const CATEGORY_LABELS: Record<string, string> = {
	REAL_ESTATE: "Real Estate",
	CARS: "Cars",
	YACHTS: "Yachts",
	PRIVATE_AVIATION: "Private Aviation",
	COLLECTIBLES: "Collectibles",
};

const OFFERING_LABELS: Record<string, string> = {
	SALE: "For Sale",
	LONG_TERM_RENT: "Long-Term Rent",
	SHORT_TERM_RENT: "Short-Term Rent",
	OFF_PLAN: "Off-Plan",
	CHARTER: "Charter",
	PRICE_ON_REQUEST: "Price on Request",
};

const APPROVAL_LABELS: Record<string, string> = {
	DRAFT: "Draft",
	SUBMITTED: "Submitted",
	PENDING_REVIEW: "Pending Review",
	CHANGES_REQUIRED: "Changes Required",
	APPROVED: "Approved",
	REJECTED: "Rejected",
};

const PUBLICATION_LABELS: Record<string, string> = {
	UNPUBLISHED: "Unpublished",
	SCHEDULED: "Scheduled",
	LIVE: "Live",
	PAUSED: "Paused",
	EXPIRED: "Expired",
	ARCHIVED: "Archived",
};

// ─── Types ───────────────────────────────────────────────────

type PrismaListing = Listing & {
	realEstateListing?: RealEstateListing | null;
	carListing?: CarListing | null;
	yachtListing?: YachtListing | null;
	privateAviationListing?: PrivateAviationListing | null;
	collectibleListing?: CollectibleListing | null;
	availability?: Availability | null;
	company?: Partial<Company> | null;
	creator?: Partial<User> | null;
	qualitySnapshot?: QualitySnapshot | null;
	rankSnapshot?: RankSnapshot | null;
};

// ─── Mapper ──────────────────────────────────────────────────

export const mapToListing = (listing: PrismaListing) => {
	// Build category-specific details
	let details: Record<string, any> = {};

	if (listing.realEstateListing) {
		const { id, listingId, ...rest } = listing.realEstateListing;
		details = rest;
	} else if (listing.carListing) {
		const { id, listingId, ...rest } = listing.carListing;
		details = rest;
	} else if (listing.yachtListing) {
		const { id, listingId, ...rest } = listing.yachtListing;
		details = rest;
	} else if (listing.privateAviationListing) {
		const { id, listingId, ...rest } = listing.privateAviationListing;
		details = rest;
	} else if (listing.collectibleListing) {
		const { id, listingId, ...rest } = listing.collectibleListing;
		details = rest;
	}

	// Build pricing block — only include relevant fields for the offering type
	const pricing = {
		offeringType: listing.offeringType,
		offeringLabel: OFFERING_LABELS[listing.offeringType] ?? listing.offeringType,
		currency: listing.currency,
		priceOnRequest: listing.priceOnRequest,
		negotiable: listing.negotiable,
		salePrice: listing.salePrice != null ? Number(listing.salePrice) : undefined,
		annualRent: listing.annualRent != null ? Number(listing.annualRent) : undefined,
		monthlyRent: listing.monthlyRent != null ? Number(listing.monthlyRent) : undefined,
		dailyRate: listing.dailyRate != null ? Number(listing.dailyRate) : undefined,
		charterRate: listing.charterRate != null ? Number(listing.charterRate) : undefined,
	};

	return {
		// Identity
		id: listing.id,
		publicRef: listing.publicRef,
		internalRef: listing.internalReferenceCode,
		licenseNumber: listing.licenseNumber,
		title: listing.title,
		slug: listing.slug,
		description: listing.description,

		// Classification (always user-friendly labels)
		category: listing.category,
		categoryLabel: CATEGORY_LABELS[listing.category] ?? listing.category,
		assetType: listing.assetType,

		// Status (dual-track)
		approvalStatus: listing.approvalStatus,
		approvalLabel: APPROVAL_LABELS[listing.approvalStatus] ?? listing.approvalStatus,
		publicationStatus: listing.publicationStatus,
		publicationLabel: PUBLICATION_LABELS[listing.publicationStatus] ?? listing.publicationStatus,
		isFlagged: listing.isFlagged,
		adminRejectionReason: listing.adminRejectionReason,

		// Pricing
		pricing,

		// Location
		location: {
			country: listing.country,
			city: listing.city,
			area: listing.area,
			address: listing.hideExactLocation ? undefined : listing.address,
			lat: listing.latitude,
			lng: listing.longitude,
			operatingBase: listing.operatingBase,
		},

		// Media
		media: {
			coverImageUrl: listing.coverImageUrl ? toPublicUrl(listing.coverImageUrl) : undefined,
			photos: listing.photoUrls.map(toPublicUrl),
			floorPlans: listing.floorPlanUrls?.map(toPublicUrl) ?? [],
			video: listing.videoUrl,
			vrTour: listing.vrTourUrl,
		},

		// Availability
		availability: listing.availability
			? {
					isAvailable: listing.availability.isAvailable,
					confirmedAt: listing.availability.confirmedAt,
					nextConfirmDue: listing.availability.nextConfirmDue,
				}
			: null,

		// Quality & visibility snapshots
		quality: listing.qualitySnapshot
			? {
					score: listing.qualitySnapshot.score,
					rating: listing.qualitySnapshot.rating,
					calculatedAt: listing.qualitySnapshot.calculatedAt,
				}
			: null,

		visibility: listing.rankSnapshot
			? {
					level: listing.rankSnapshot.visibilityLevel,
					percentile: listing.rankSnapshot.percentile,
					rank: listing.rankSnapshot.rank,
					totalCompeting: listing.rankSnapshot.totalCompeting,
					calculatedAt: listing.rankSnapshot.calculatedAt,
				}
			: null,

		// Contact
		contact: {
			email: listing.primaryEmail,
			phone: listing.primaryPhone,
		},

		// Ownership
		company: listing.company
			? {
					id: listing.company.id,
					name: listing.company.name,
					slug: listing.company.slug,
					logoUrl: listing.company.companyLogoUrl,
				}
			: undefined,

		agent: listing.creator
			? {
					id: listing.creator.id,
					name: listing.creator.name,
					email: listing.creator.email,
					image: (listing.creator as any).image,
				}
			: undefined,

		// Timestamps
		timestamps: {
			createdAt: listing.createdAt,
			updatedAt: listing.updatedAt,
			submittedAt: listing.submittedAt,
			reviewedAt: listing.reviewedAt,
			publishedAt: listing.publishedAt,
			expiresAt: listing.expiresAt,
		},

		// Category-specific details
		details,
	};
};

// Lightweight version for list views (no details, no full media)
export const mapToListingCard = (listing: PrismaListing) => {
	const full = mapToListing(listing);
	return {
		id: full.id,
		publicRef: full.publicRef,
		title: full.title,
		slug: full.slug,
		category: full.category,
		categoryLabel: full.categoryLabel,
		assetType: full.assetType,
		approvalStatus: full.approvalStatus,
		approvalLabel: full.approvalLabel,
		publicationStatus: full.publicationStatus,
		publicationLabel: full.publicationLabel,
		pricing: full.pricing,
		location: { city: full.location.city, area: full.location.area },
		coverImage: full.media.photos[0] ?? full.media.coverImageUrl ?? null,
		quality: full.quality,
		visibility: full.visibility,
		timestamps: {
			createdAt: full.timestamps.createdAt,
			updatedAt: full.timestamps.updatedAt,
		},
		agent: full.agent,
		company: full.company,
	};
};

export const mapListingPhotos = <T extends { photoUrls: string[] } | null>(
	listing: T,
): T =>
	(listing && {
		...listing,
		photoUrls: listing.photoUrls.map(toPublicUrl),
	}) as T;
