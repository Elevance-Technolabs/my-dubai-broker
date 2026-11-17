import { YachtFormData } from "@/lib/schemas/yachtSchema";
import { apiRequest, ApiResponse } from "../core/api";
import { UploadService } from "@/services/upload.service";

// The dedicated /yachts endpoint is legacy — yachts are now YACHTS-category
// listings created through the unified /listings API (matches the
// jet/helicopter migration; see mydubai-broker-backend/src/modules/listings).
// yachtType is the listing's asset type; crewInfo has no column on
// YachtListing yet and is dropped.
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
  assetType: yachtType || "MOTOR_YACHT",
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
  // Deleting keeps the listing on record as history (see listing.service).
  deleteYatch: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/listings/${id}`, {
      method: "DELETE",
    });
  },
};
