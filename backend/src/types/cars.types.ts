import type { Currency, ApprovalStatus } from "../../generated/prisma/enums.js";

export interface CreateCarData {
	// Listing Data
	title: string;
	description: string;
	price: number;
	currency?: Currency;
	photoUploadIds: string[];
	videoUrl?: string; // Optional in interface, handled as nullable in DB
	qualityNarrative: string;
	internalReferenceCode?: string;
	licenseNumber?: string;
	primaryEmail: string;
	primaryPhone: string;
	companyId: string;
	creatorId: string;

	// Car Data
	brand: string;
	model: string;
	year: number;
	variant?: string;
	mileage: number;
	condition: string;
	transmission: string;
	engineSize?: string;
	horsepower?: number;
	color: string;
	interiorColor?: string;
	warranty?: boolean;
	options?: string[];
	negotiable?: boolean;
}

export interface UpdateCarData extends Partial<CreateCarData> {
	existingPhotoKeys?: string[];
	status?: ApprovalStatus;
	adminRejectionReason?: string;
}
