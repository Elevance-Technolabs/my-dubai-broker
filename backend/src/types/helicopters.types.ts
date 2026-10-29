import type { Currency, ApprovalStatus } from "../../generated/prisma/enums.js";

export interface CreateHelicopterData {
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

	// Helicopter Specific Data
	manufacturer: string;
	model: string;
	year: number;
	rotorHours: number;
	seating: number;
	engineModel: string;

	interiorDetails?: string;
	avionics?: string;
	maintenance?: string;
}

export interface UpdateHelicopterData extends Partial<CreateHelicopterData> {
	existingPhotoKeys?: string[];
	status?: ApprovalStatus;
	adminRejectionReason?: string;
}
