import type { Currency, ApprovalStatus } from "../../generated/prisma/enums.js";

export interface CreateJetData {
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

	// Jet Specific Data
	manufacturer: string;
	model: string;
	year: number;
	totalHours: number;
	passengerCapacity: number;
	range: number;

	interiorDetails?: string;
	avionics?: string;
	maintenanceHistory?: string;
}

export interface UpdateJetData extends Partial<CreateJetData> {
	existingPhotoKeys?: string[];
	status?: ApprovalStatus;
	adminRejectionReason?: string;
}
