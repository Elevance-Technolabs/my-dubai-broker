import { JetFormData } from "@/lib/schemas/jetSchema";
import { apiRequest, ApiResponse } from "../core/api";
import { UploadService } from "@/services/upload.service";

// The dedicated /jets endpoint is deprecated (410 Gone) — jets are now
// PRIVATE_AVIATION listings (assetType JET) created through the unified
// /listings API. See mydubai-broker-backend/src/modules/jets/jets.controller.ts.
const toListingPayload = ({
  price,
  offeringType,
  rateBasis,
  currency,
  qualityNarrative,
  manufacturer,
  model,
  year,
  totalHours,
  passengerCapacity,
  range,
  interiorDetails,
  avionics,
  maintenanceHistory,
  ...rest
}: JetFormData) => ({
  ...rest,
  category: "PRIVATE_AVIATION",
  assetType: "JET",
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
    totalHours,
    passengerCapacity,
    rangeNm: range,
    interiorDetails,
    avionics,
    maintenanceHistory,
  },
});

export const jetService = {
  createJet: async (data: JetFormData): Promise<ApiResponse<any>> => {
    return UploadService.sendWithPhotos(
      "/listings",
      "POST",
      toListingPayload(data),
    );
  },
  getJet: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/listings/${id}`);
  },
  updateJet: async (
    id: string,
    data: JetFormData,
  ): Promise<ApiResponse<any>> => {
    return UploadService.sendWithPhotos(
      `/listings/${id}`,
      "PUT",
      toListingPayload(data),
    );
  },
  // Listings are archived, not hard-deleted, under the unified API.
  deleteJet: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/listings/${id}/archive`, {
      method: "POST",
    });
  },
};
