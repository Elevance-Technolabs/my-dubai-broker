import { PROPERTY_TYPES, RealEstateFormData } from "@/lib/schemas/realEstateSchema";
import { toCommonPayload } from "@/lib/schemas/listingBase";
import { apiRequest, ApiResponse } from "../core/api";
import { UploadService } from "@/services/upload.service";

const EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"];

// The listing type decides the offering and which price field is set.
const OFFERING: Record<RealEstateFormData["status"], { offeringType: string; priceField: string }> = {
  SALE: { offeringType: "SALE", priceField: "salePrice" },
  OFF_PLAN: { offeringType: "OFF_PLAN", priceField: "salePrice" },
  RENT_YEARLY: { offeringType: "LONG_TERM_RENT", priceField: "annualRent" },
  RENT_MONTHLY: { offeringType: "LONG_TERM_RENT", priceField: "monthlyRent" },
  SHORT_TERM: { offeringType: "SHORT_TERM_RENT", priceField: "dailyRate" },
};

// Real estate is a REAL_ESTATE-category listing on the unified /listings API.
const toListingPayload = (data: RealEstateFormData) => {
  const offering = OFFERING[data.status];
  const city = data.city?.trim() ?? "";
  return {
    ...toCommonPayload(data),
    category: "REAL_ESTATE",
    assetType: data.propertyType || "VILLA",
    offeringType: offering.offeringType,
    [offering.priceField]: data.price,
    details: {
      propertyType: PROPERTY_TYPES.find((t) => t.value === data.propertyType)?.label ?? data.propertyType,
      // Kept in step with the Location section.
      emirate: EMIRATES.find((e) => e.toLowerCase() === city.toLowerCase()) ?? "",
      community: data.area?.trim() ?? "",
      building: data.building ?? "",
      permitNumber: data.permitNumber ?? "",
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      builtUpArea: data.builtUpArea,
      plotArea: data.plotArea ?? null,
      floor: data.floor ?? null,
      totalFloors: data.totalFloors ?? null,
      parking: data.parking ?? null,
      furnished: !!data.furnished,
      completionStatus: data.completionStatus ?? "",
      developer: data.developer ?? "",
      paymentPlan: data.paymentPlan ?? "",
      serviceCharge: data.serviceCharge ?? null,
      views: data.views,
      outdoor: data.outdoor,
      indoor: data.indoor,
      communityFeatures: data.communityFeatures,
      amenities: data.amenities,
      propertyTags: data.propertyTags,
    },
  };
};

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
  // Deleting keeps the listing on record as history (see listing.service).
  deleteRealEstate: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/listings/${id}`, {
      method: "DELETE",
    });
  },
};
