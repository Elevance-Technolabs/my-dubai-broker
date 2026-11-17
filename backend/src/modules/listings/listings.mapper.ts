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
	SUBMITTED: "Pending review",
	PENDING_REVIEW: "In review",
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
	DELETED: "Deleted",
	SOLD_OUT: "Sold out",
};

// ─── Pending changes (edits to an approved listing awaiting review) ──

const FIELD_LABELS: Record<string, string> = {
	title: "Title",
	description: "Description",
	assetType: "Asset type",
	offeringType: "Offering",
	currency: "Currency",
	priceOnRequest: "Price on request",
	negotiable: "Negotiable",
	salePrice: "Sale price",
	annualRent: "Annual rent",
	monthlyRent: "Monthly rent",
	dailyRate: "Daily rate",
	charterRate: "Charter rate",
	country: "Country",
	city: "City",
	area: "Area",
	address: "Address",
	hideExactLocation: "Hide exact location",
	latitude: "Latitude",
	longitude: "Longitude",
	operatingBase: "Operating base",
	primaryEmail: "Contact email",
	primaryPhone: "Contact phone",
	videoUrl: "Video",
	vrTourUrl: "Virtual tour",
	licenseNumber: "Permit / licence",
	internalReferenceCode: "Internal reference",
};

const labelFor = (key: string) =>
	FIELD_LABELS[key] ??
	key
		.replace(/([A-Z])/g, " $1")
		.toLowerCase()
		.replace(/^./, (c) => c.toUpperCase());

const showValue = (v: unknown): string => {
	if (v === null || v === undefined || v === "") return "—";
	if (v instanceof Date) return v.toISOString().slice(0, 10);
	if (Array.isArray(v)) return v.length ? v.map(showValue).join(", ") : "—";
	if (typeof v === "boolean") return v ? "Yes" : "No";
	const s = String(v);
	return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s.slice(0, 10) : s;
};

/** What a pending edit would change, field by field (old → new). */
const pendingSummary = (listing: PrismaListing, details: Record<string, any>) => {
	const pending = (listing as any).pendingChanges as { data?: Record<string, any>; photoKeys?: string[] } | null;
	if (!pending || !(listing as any).pendingChangesAt) return null;
	const changes: { field: string; label: string; from: string; to: string }[] = [];
	const { details: newDetails, ...fields } = pending.data ?? {};
	const PRICE_KEYS = ["salePrice", "annualRent", "monthlyRent", "dailyRate", "charterRate"];
	const money = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : Number(v).toLocaleString("en-US"));
	for (const [key, value] of Object.entries(fields)) {
		const isPrice = PRICE_KEYS.includes(key);
		const from = isPrice ? money((listing as any)[key]) : showValue((listing as any)[key]);
		const to = isPrice ? money(value) : showValue(value);
		if (from !== to) changes.push({ field: key, label: labelFor(key), from, to });
	}
	for (const [key, value] of Object.entries(newDetails ?? {})) {
		const from = showValue(details[key]);
		const to = showValue(value);
		if (from !== to) changes.push({ field: `details.${key}`, label: labelFor(key), from, to });
	}
	if (pending.photoKeys) {
		const before = listing.photoUrls ?? [];
		const same = before.length === pending.photoKeys.length && before.every((k, i) => k === pending.photoKeys![i]);
		if (!same) {
			changes.push({
				field: "photos",
				label: "Photos",
				from: `${before.length} photo${before.length === 1 ? "" : "s"}`,
				to: `${pending.photoKeys.length} photo${pending.photoKeys.length === 1 ? "" : "s"}`,
			});
		}
	}
	return { at: (listing as any).pendingChangesAt as Date, changes };
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

/**
 * `forPublic`: the version shown on the website. When the company chose to
 * hide the exact location, the address is left out and the map pin is
 * rounded to about 1 km, so the area shows but not the building.
 */
export const mapToListing = (listing: PrismaListing, { forPublic = false }: { forPublic?: boolean } = {}) => {
	const hideExact = forPublic && listing.hideExactLocation;
	const approx = (n: number | null) => (n == null ? n : hideExact ? Math.round(n * 100) / 100 : n);
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
			address: hideExact ? undefined : listing.address,
			lat: approx(listing.latitude),
			lng: approx(listing.longitude),
			operatingBase: listing.operatingBase,
			hideExactLocation: listing.hideExactLocation,
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
			deletedAt: listing.deletedAt,
		},

		// Set once the company deletes the listing (kept as history).
		deleted: listing.deletedAt
			? { at: listing.deletedAt, byName: (listing as any).deletedBy?.name ?? null }
			: null,

		// Edits to this approved listing that are waiting for review (the
		// version above is still the live one).
		pendingChanges: pendingSummary(listing, details),

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
