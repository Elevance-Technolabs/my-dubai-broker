import { YachtFormData } from "@/lib/schemas/yachtSchema";
import { toCommonPayload } from "@/lib/schemas/listingBase";
import { apiRequest, ApiResponse } from "../core/api";
import { UploadService } from "@/services/upload.service";

// Yachts are YACHTS-category listings on the unified /listings API.
// Sale -> sale price; charter -> rate per hour or per day.
const toListingPayload = (data: YachtFormData) => ({
  ...toCommonPayload(data),
  category: "YACHTS",
  assetType: data.yachtType || "MOTOR_YACHT",
  ...(data.offeringType === "CHARTER"
    ? { offeringType: "CHARTER", ...(data.rateBasis === "DAY" ? { dailyRate: data.price } : { charterRate: data.price }) }
    : { offeringType: "SALE", salePrice: data.price }),
  details: {
    builder: data.make,
    model: data.model ?? "",
    year: data.year,
    lengthFt: data.length,
    beamFt: data.beam,
    draftFt: data.draft ?? null,
    hullMaterial: data.materials ?? "",
    cabins: data.cabins ?? null,
    guestCapacity: data.guestCapacity ?? null,
    crewCapacity: data.crewCapacity ?? null,
    crewIncluded: !!data.crewIncluded,
    engineHours: data.engineHours ?? null,
    engines: data.engines ?? "",
    flag: data.flag ?? "",
    registrationNumber: data.registrationNumber ?? "",
    classification: data.classification ?? "",
    navigation: data.navigation,
    amenities: data.amenities,
    charterAvailability: data.charterAvailability ?? "",
    // The marina in the Location section is also the yacht's home port.
    homePort: data.operatingBase ?? "",
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
