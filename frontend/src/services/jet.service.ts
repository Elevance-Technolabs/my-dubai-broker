import { JetFormData } from "@/lib/schemas/jetSchema";
import { toCommonPayload } from "@/lib/schemas/listingBase";
import { apiRequest, ApiResponse } from "../core/api";
import { UploadService } from "@/services/upload.service";

// Jets are PRIVATE_AVIATION listings (asset type JET) on the unified /listings API.
const toListingPayload = (data: JetFormData) => ({
  ...toCommonPayload(data),
  category: "PRIVATE_AVIATION",
  assetType: "JET",
  ...(data.offeringType === "CHARTER"
    ? { offeringType: "CHARTER", ...(data.rateBasis === "DAY" ? { dailyRate: data.price } : { charterRate: data.price }) }
    : { offeringType: "SALE", salePrice: data.price }),
  details: {
    manufacturer: data.manufacturer,
    model: data.model,
    year: data.year,
    serialNumber: data.serialNumber ?? "",
    registrationTail: data.registrationTail ?? "",
    totalHours: data.totalHours,
    engineHours: data.engineHours ?? null,
    passengerCapacity: data.passengerCapacity,
    rangeNm: data.range,
    interiorConfig: data.interiorConfig ?? "",
    interiorDetails: data.interiorDetails ?? "",
    avionics: data.avionics ?? "",
    maintenanceHistory: data.maintenanceHistory ?? "",
    lastInspectionDate: data.lastInspectionDate || null,
    amenities: data.amenities,
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
  // Deleting keeps the listing on record as history (see listing.service).
  deleteJet: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/listings/${id}`, {
      method: "DELETE",
    });
  },
};
