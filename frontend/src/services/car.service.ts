import { CarFormData } from "@/lib/schemas/carSchema";
import { toCommonPayload } from "@/lib/schemas/listingBase";
import { apiRequest, ApiResponse } from "../core/api";
import { UploadService } from "@/services/upload.service";

// Cars are CARS-category listings on the unified /listings API.
// Sale -> sale price; rent per day -> daily rate; rent per month -> monthly rent.
const toListingPayload = (data: CarFormData) => ({
  ...toCommonPayload(data),
  category: "CARS",
  assetType: data.bodyType || "SEDAN",
  offeringType: data.offeringType,
  ...(data.offeringType === "SHORT_TERM_RENT"
    ? { dailyRate: data.price }
    : data.offeringType === "LONG_TERM_RENT"
      ? { monthlyRent: data.price }
      : { salePrice: data.price }),
  negotiable: data.negotiable,
  details: {
    make: data.brand,
    model: data.model,
    variant: data.variant ?? "",
    year: data.year,
    mileage: data.mileage,
    condition: data.condition,
    bodyType: data.bodyType,
    transmission: data.transmission,
    fuelType: data.fuelType ?? "",
    engineSize: data.engineSize ?? "",
    horsepower: data.horsepower ?? null,
    exteriorColor: data.color,
    interiorColor: data.interiorColor ?? "",
    doors: data.doors ?? null,
    seats: data.seats ?? null,
    regionalSpec: data.regionalSpec ?? "",
    warranty: data.warranty,
    serviceHistory: !!data.serviceHistory,
    registrationYear: data.registrationYear ?? null,
    plateNumber: data.plateNumber ?? "",
    chassisNumber: data.chassisNumber ?? "",
    options: data.options,
    rentalTerms: data.offeringType === "SALE" ? "" : (data.rentalTerms ?? ""),
  },
});

export const carService = {
  createCar: async (data: CarFormData): Promise<ApiResponse<any>> => {
    return UploadService.sendWithPhotos(
      "/listings",
      "POST",
      toListingPayload(data),
    );
  },
  getCar: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/listings/${id}`);
  },
  updateCar: async (
    id: string,
    data: CarFormData,
  ): Promise<ApiResponse<any>> => {
    return UploadService.sendWithPhotos(
      `/listings/${id}`,
      "PUT",
      toListingPayload(data),
    );
  },
  // Deleting keeps the listing on record as history (see listing.service).
  deleteCar: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/listings/${id}`, {
      method: "DELETE",
    });
  },
};
