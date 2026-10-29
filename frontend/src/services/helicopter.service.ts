import { HelicopterFormData } from "@/lib/schemas/helicopterSchema";
import { apiRequest, ApiResponse } from "../core/api";
import { UploadService } from "@/services/upload.service";

// The dedicated /helicopters endpoint is deprecated (410 Gone) — helicopters
// are now PRIVATE_AVIATION listings (assetType HELICOPTER) created through
// the unified /listings API. See
// mydubai-broker-backend/src/modules/helicopters/helicopters.controller.ts.
// Note: engineModel has no equivalent column on PrivateAviationListing yet
// and is currently dropped — see the pending-work doc.
const toListingPayload = ({
  price,
  offeringType,
  rateBasis,
  currency,
  qualityNarrative,
  manufacturer,
  model,
  year,
  rotorHours,
  seating,
  engineModel,
  interiorDetails,
  avionics,
  maintenance,
  ...rest
}: HelicopterFormData) => ({
  ...rest,
  category: "PRIVATE_AVIATION",
  assetType: "HELICOPTER",
  ...(offeringType === "CHARTER"
    ? {
        offeringType: "CHARTER",
        ...(rateBasis === "DAY" ? { dailyRate: price } : { charterRate: price }),
      }
    : { offeringType: "SALE", salePrice: price }),
  currency,
  details: {
    manufacturer,
    model,
    year,
    engineHours: rotorHours,
    passengerCapacity: seating,
    interiorDetails,
    avionics,
    maintenanceHistory: maintenance,
  },
});

export const helicopterService = {
  createHelicopter: async (
    data: HelicopterFormData,
  ): Promise<ApiResponse<any>> => {
    return UploadService.sendWithPhotos(
      "/listings",
      "POST",
      toListingPayload(data),
    );
  },
  getHelicopter: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/listings/${id}`);
  },
  updateHelicopter: async (
    id: string,
    data: HelicopterFormData,
  ): Promise<ApiResponse<any>> => {
    return UploadService.sendWithPhotos(
      `/listings/${id}`,
      "PUT",
      toListingPayload(data),
    );
  },
  // Listings are archived, not hard-deleted, under the unified API.
  deleteHelicopter: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/listings/${id}/archive`, {
      method: "POST",
    });
  },
};
