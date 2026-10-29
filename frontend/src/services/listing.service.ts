import { apiRequest, ApiResponse } from "@/core/api";
import { Listing } from "@/types/listing";
import { adaptListing } from "@/lib/utils/adaptListing";

interface ListingsResult {
  listings: Listing[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface GetPublicListingsParams {
  [key: string]: string | number | boolean | undefined;
  page?: number;
  limit?: number;
  categoryType?: string;
  excludeId?: string;
}

export const listingService = {
  getListings: async (): Promise<ApiResponse<Listing[]>> => {
    return apiRequest<Listing[]>("/listings");
  },

  getMyListings: async (): Promise<ApiResponse<Listing[]>> => {
    return apiRequest<Listing[]>("/listings/my-listings");
  },

  getListingById: async (id: string): Promise<ApiResponse<Listing>> => {
    return apiRequest<Listing>(`/listings/${id}`);
  },

  submitListing: async (id: string): Promise<ApiResponse<Listing>> => {
    return apiRequest<Listing>(`/listings/${id}/submit`, { method: "POST" });
  },

  getPublicListings: async (
    params?: GetPublicListingsParams,
  ): Promise<ApiResponse<ListingsResult>> => {
    const res = await apiRequest<ListingsResult>("/listings/public", { params });
    if (res.success && res.data) {
      return {
        ...res,
        data: { ...res.data, listings: res.data.listings.map(adaptListing) },
      };
    }
    return res;
  },

  getPublicListingById: async (id: string): Promise<ApiResponse<Listing>> => {
    const res = await apiRequest<any>(`/listings/public/${id}`);
    return res.success && res.data ? { ...res, data: adaptListing(res.data) } : res;
  },
};
