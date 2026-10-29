import { YachtFormData } from "@/lib/schemas/yachtSchema";
import { apiRequest, ApiResponse } from "../core/api";
import { UploadService } from "@/services/upload.service";

// The dedicated /yachts endpoint is legacy — yachts are now YACHTS-category
// listings created through the unified /listings API (matches the
// jet/helicopter migration; see mydubai-broker-backend/src/modules/listings).
// Note: yachtType and crewInfo have no equivalent column on YachtListing yet
// and are currently dropped — see the pending-work doc.
const toListingPayload = ({
  price,
  currency,
  qualityNarrative,
  yachtType,
  year,
  make,
  length,
  beam,
  crewInfo,
  engineHours,
  cabins,
  materials,
  navigation,
  ...rest
}: YachtFormData) => ({
  ...rest,
  category: "YACHTS",
  assetType: "MOTOR_YACHT", // default — the form's yachtType is free text, not the AssetType enum
  offeringType: "SALE",
  salePrice: price,
  currency,
  details: {
    builder: make,
    year,
    lengthFt: length,
    beamFt: beam,
    engineHours,
    cabins,
    hullMaterial: materials,
    navigation,
  },
});

export const yachtService = {
  createYacht: async (data: YachtFormData): Promise<ApiResponse<any>> => {
    return UploadService.sendWithPhotos(
      "/listings",
      "POST",
      toListingPayload(data),
    );
  },
  getYacht: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/listings/${id}`);
  },
  updateYacht: async (
    id: string,
    data: YachtFormData,
  ): Promise<ApiResponse<any>> => {
    return UploadService.sendWithPhotos(
      `/listings/${id}`,
      "PUT",
      toListingPayload(data),
    );
  },
  // Listings are archived, not hard-deleted, under the unified API.
  deleteYatch: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/listings/${id}/archive`, {
      method: "POST",
    });
  },
};
