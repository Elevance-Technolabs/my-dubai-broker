import type { Listing } from "@/types/listing";
import { resolveListingPrice } from "@/lib/utils/listingCompleteness";

// The backend's mapToListing returns a nested shape (pricing, details,
// timestamps, category/assetType). The public-site components were written
// against a flat legacy shape (type, price, currency, brand, ...). This
// adapter bridges the two so those components keep working.
export const adaptListing = (raw: any): Listing => {
  const d = raw.details ?? {};
  const p = raw.pricing ?? {};

  const type =
    raw.category === "CARS"
      ? "CAR"
      : raw.category === "YACHTS"
        ? "YACHT"
        : raw.category === "REAL_ESTATE"
          ? "REAL_ESTATE"
          : raw.assetType === "HELICOPTER"
            ? "HELICOPTER"
            : "JET";

  const { amount, suffix: priceSuffix } = resolveListingPrice(p);
  const price = amount ?? 0;

  const locationName = [raw.location?.area, raw.location?.city].filter(Boolean).join(", ");

  return {
    ...d,
    brand: d.make,
    color: d.exteriorColor,
    make: raw.category === "YACHTS" ? d.builder : d.make,
    length: d.lengthFt,
    beam: d.beamFt,
    materials: d.hullMaterial,
    range: d.rangeNm,
    seating: d.passengerCapacity,
    community: d.communityFeatures,
    ...raw,
    type,
    description: raw.description ?? "",
    price,
    priceSuffix,
    currency: p.currency ?? "AED",
    categoryType: raw.category,
    status: raw.approvalStatus,
    listingsStatus: raw.approvalStatus,
    media: {
      ...raw.media,
      photos: raw.media?.photos ?? [],
      video: raw.media?.video || undefined,
    },
    location: {
      name: locationName,
      lat: raw.location?.lat,
      lng: raw.location?.lng,
    },
    metadata: {
      createdAt: raw.timestamps?.createdAt,
      updatedAt: raw.timestamps?.updatedAt,
      referenceCode: raw.publicRef,
      licenseNumber: raw.licenseNumber,
      adminRejectionReason: raw.adminRejectionReason,
    },
    seller: raw.agent,
  } as unknown as Listing;
};
