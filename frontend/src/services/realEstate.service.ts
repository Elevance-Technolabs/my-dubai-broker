import { RealEstateFormData } from "@/lib/schemas/realEstateSchema";
import { apiRequest, ApiResponse } from "../core/api";
import { UploadService } from "@/services/upload.service";

// The dedicated /real-estate endpoint is legacy — real estate is now a
// REAL_ESTATE-category listing created through the unified /listings API
// (matches the jet/helicopter migration; see
// mydubai-broker-backend/src/modules/listings).

// The form's `status` field is really a leftover PropertyListingType value
// (SALE/RENT/OFF_PLAN/NEW/PRE_OWNED), which only partially maps onto the
// backend's OfferingType enum (SALE/LONG_TERM_RENT/SHORT_TERM_RENT/OFF_PLAN/
// CHARTER/PRICE_ON_REQUEST) — NEW/PRE_OWNED read as a property *condition*,
// not a commercial offering, and both fall back to SALE here. This whole
// field needs a real redesign (a proper offeringType selector, separate from
// completion/condition) — tracked in PENDING.md, not fixed in this pass.
const OFFERING_TYPE_MAP: Record<string, string> = {
  SALE: "SALE",
  RENT: "LONG_TERM_RENT",
  OFF_PLAN: "OFF_PLAN",
  NEW: "SALE",
  PRE_OWNED: "SALE",
};

const toListingPayload = ({
  price,
  currency,
  qualityNarrative,
  propertyType,
  status,
  permitNumber,
  bedrooms,
  bathrooms,
  builtUpArea,
  plotArea,
  floor,
  parking,
  developer,
  furnished,
  paymentPlan,
  views,
  outdoor,
  indoor,
  community,
  propertyTags,
  ...rest
}: RealEstateFormData) => ({
  ...rest,
  category: "REAL_ESTATE",
  assetType: "VILLA", // default — the form's propertyType is free text, not the AssetType enum
  offeringType: OFFERING_TYPE_MAP[status] ?? "SALE",
  salePrice: price,
  currency,
  details: {
    propertyType,
    permitNumber,
    bedrooms,
    bathrooms,
    builtUpArea,
    plotArea,
    floor,
    parking,
    developer,
    furnished,
    paymentPlan,
    views,
    outdoor,
    indoor,
    communityFeatures: community,
    propertyTags,
  },
});

export const realEstateService = {
  createRealEstate: async (
    data: RealEstateFormData,
  ): Promise<ApiResponse<any>> => {
    return UploadService.sendWithPhotos(
      "/listings",
      "POST",
      toListingPayload(data),
    );
  },
  getRealEstate: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/listings/${id}`);
  },
  updateRealEstate: async (
    id: string,
    data: RealEstateFormData,
  ): Promise<ApiResponse<any>> => {
    return UploadService.sendWithPhotos(
      `/listings/${id}`,
      "PUT",
      toListingPayload(data),
    );
  },
  // Listings are archived, not hard-deleted, under the unified API.
  deleteRealEstate: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/listings/${id}/archive`, {
      method: "POST",
    });
  },
};
