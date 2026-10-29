import { CarFormData } from "@/lib/schemas/carSchema";
import { apiRequest, ApiResponse } from "../core/api";
import { UploadService } from "@/services/upload.service";

// The dedicated /cars endpoint is legacy — cars are now CARS-category
// listings created through the unified /listings API (matches the
// jet/helicopter migration; see mydubai-broker-backend/src/modules/listings).
const toListingPayload = ({
  price,
  currency,
  qualityNarrative,
  brand,
  model,
  year,
  variant,
  mileage,
  condition,
  transmission,
  engineSize,
  horsepower,
  color,
  interiorColor,
  warranty,
  options,
  negotiable,
  ...rest
}: CarFormData) => ({
  ...rest,
  category: "CARS",
  assetType: "SEDAN", // default — the form doesn't collect a body-type asset type yet
  offeringType: "SALE",
  salePrice: price,
  currency,
  negotiable,
  details: {
    make: brand,
    model,
    year,
    variant,
    mileage,
    condition,
    transmission,
    engineSize,
    horsepower,
    exteriorColor: color,
    interiorColor,
    warranty,
    options,
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
  // Listings are archived, not hard-deleted, under the unified API.
  deleteCar: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/listings/${id}/archive`, {
      method: "POST",
    });
  },
};
