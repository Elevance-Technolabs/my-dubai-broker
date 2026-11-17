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
  bodyType,
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
  assetType: bodyType || "SEDAN",
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
  // Deleting keeps the listing on record as history (see listing.service).
  deleteCar: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/listings/${id}`, {
      method: "DELETE",
    });
  },
};
