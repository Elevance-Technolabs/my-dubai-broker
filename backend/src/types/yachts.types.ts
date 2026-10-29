import type { Currency, ApprovalStatus } from "../../generated/prisma/enums.js";

export interface CreateYachtData {
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

	// Yacht Data
	yachtType: string;
	year: number;
	make: string;
	length: number;
	beam?: number;
	crewInfo?: string;
	engineHours?: number;
	cabins?: number;
	materials?: string;
	navigation?: string[];
}

export interface UpdateYachtData extends Partial<CreateYachtData> {
	existingPhotoKeys?: string[];
	status?: ApprovalStatus;
	adminRejectionReason?: string;
}
