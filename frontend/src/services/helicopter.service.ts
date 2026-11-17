import { HelicopterFormData } from "@/lib/schemas/helicopterSchema";
import { toCommonPayload } from "@/lib/schemas/listingBase";
import { apiRequest, ApiResponse } from "../core/api";
import { UploadService } from "@/services/upload.service";

// Helicopters are PRIVATE_AVIATION listings (asset type HELICOPTER) on the unified /listings API.
const toListingPayload = (data: HelicopterFormData) => ({
  ...toCommonPayload(data),
  category: "PRIVATE_AVIATION",
  assetType: "HELICOPTER",
  ...(data.offeringType === "CHARTER"
    ? { offeringType: "CHARTER", ...(data.rateBasis === "DAY" ? { dailyRate: data.price } : { charterRate: data.price }) }
    : { offeringType: "SALE", salePrice: data.price }),
  details: {
    manufacturer: data.manufacturer,
    model: data.model,
    year: data.year,
    serialNumber: data.serialNumber ?? "",
    registrationTail: data.registrationTail ?? "",
    totalHours: data.totalHours ?? null,
    engineHours: data.rotorHours,
    engineModel: data.engineModel,
    passengerCapacity: data.seating,
    rangeNm: data.range ?? null,
    interiorConfig: data.interiorConfig ?? "",
    interiorDetails: data.interiorDetails ?? "",
    avionics: data.avionics ?? "",
    maintenanceHistory: data.maintenance ?? "",
    lastInspectionDate: data.lastInspectionDate || null,
    amenities: data.amenities,
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
  // Deleting keeps the listing on record as history (see listing.service).
  deleteHelicopter: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/listings/${id}`, {
      method: "DELETE",
    });
  },
};
