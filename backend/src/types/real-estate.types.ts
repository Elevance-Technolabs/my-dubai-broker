import type {
	Currency,
	ApprovalStatus,
	OfferingType,
} from "../../generated/prisma/enums.js";

export interface CreateRealEstateData {
	// Listing Data
	title: string;
	description: string;
	price: number;
	currency?: Currency;
	photoUploadIds: string[];
	videoUrl?: string;
	qualityNarrative: string;
	internalReferenceCode?: string;
	licenseNumber?: string;
	primaryEmail: string;
	primaryPhone: string;
	companyId: string;
	creatorId: string;

	// Real Estate Data
	propertyType: string;
	status: OfferingType;
	permitNumber?: string;
	bedrooms?: number;
	bathrooms?: number;
	builtUpArea?: number;
	plotArea?: number;
	floor?: number;
	parking?: number;
	developer?: string;
	furnished?: boolean;
	paymentPlan?: string;
	views?: string[];
	outdoor?: string[];
	indoor?: string[];
	community?: string[];
	propertyTags?: string[];
}

export interface UpdateRealEstateData extends Partial<CreateRealEstateData> {
	existingPhotoKeys?: string[];
	listingStatus?: ApprovalStatus; // distinct from property status (OfferingType)
	adminRejectionReason?: string;
}
