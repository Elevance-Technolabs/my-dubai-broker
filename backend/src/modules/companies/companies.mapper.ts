import { createPresignedGetUrl, toPublicUrl } from "../../lib/r2.js";

const IMAGE_FIELDS = ["companyLogoUrl", "coverImageUrl", "listingLogoUrl"];

const DOCUMENT_FIELDS = [
	"tradeLicenseUrl",
	"reraLicenseUrl",
	"emiratesIdUrl",
	"passportUrl",
	"showroomRegistrationUrl",
	"carDealerLicenseUrl",
	"marineTradeLicenseUrl",
	"boatDealerCertificateUrl",
	"aviationDealerLicenseUrl",
	"aocOperatorDocumentUrl",
];

const toCamel = (s: string) =>
	s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

// Flatten CompanyDocument rows to `<camelType>Url` (latest by createdAt wins).
const flattenDocuments = (mapped: Record<string, any>) => {
	if (!Array.isArray(mapped.documents)) return;
	const latest = new Map<string, any>();
	for (const doc of mapped.documents) {
		if (!doc?.documentType || !doc.fileUrl) continue;
		const prev = latest.get(doc.documentType);
		if (!prev || new Date(doc.createdAt) > new Date(prev.createdAt))
			latest.set(doc.documentType, doc);
	}
	for (const [type, doc] of latest) {
		const field = `${toCamel(type)}Url`;
		if (DOCUMENT_FIELDS.includes(field)) mapped[field] = doc.fileUrl;
	}
};

export const mapCompanyMedia = async <T extends object>(
	company: T,
): Promise<T> => {
	const mapped: Record<string, any> = { ...company };
	flattenDocuments(mapped);

	for (const field of IMAGE_FIELDS) {
		if (mapped[field]) mapped[field] = toPublicUrl(mapped[field]);
	}

	await Promise.all(
		DOCUMENT_FIELDS.map(async (field) => {
			if (mapped[field])
				mapped[field] = await createPresignedGetUrl(mapped[field]);
		}),
	);

	return mapped as T;
};
