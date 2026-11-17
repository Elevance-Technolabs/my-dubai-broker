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
  getListings: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<Listing[]>> => {
    return apiRequest<Listing[]>("/listings", params ? { params: params as Record<string, any> } : undefined);
  },

  getMyListings: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<Listing[]>> => {
    return apiRequest<Listing[]>("/listings/my-listings", params ? { params: params as Record<string, any> } : undefined);
  },

  /** withPending: as it will look once pending changes are approved (edit form). */
  getListingById: async (id: string, options?: { withPending?: boolean }): Promise<ApiResponse<Listing>> => {
    return apiRequest<Listing>(`/listings/${id}${options?.withPending ? "?pending=true" : ""}`);
  },

  /** Takes a live listing off the website. */
  unpublishListing: async (id: string, reason?: string): Promise<ApiResponse<any>> =>
    apiRequest<any>(`/listings/${id}/unpublish`, { method: "POST", body: JSON.stringify({ reason }) }),

  /** Marks the listing as sold out; it leaves the website. */
  markSoldOut: async (id: string, reason?: string): Promise<ApiResponse<any>> =>
    apiRequest<any>(`/listings/${id}/sold-out`, { method: "POST", body: JSON.stringify({ reason }) }),

  /** Asks to publish an unpublished / sold-out listing again; it goes to review first. */
  requestRepublish: async (id: string): Promise<ApiResponse<any>> =>
    apiRequest<any>(`/listings/${id}/republish`, { method: "POST" }),

  submitListing: async (id: string): Promise<ApiResponse<Listing>> => {
    return apiRequest<Listing>(`/listings/${id}/submit`, { method: "POST" });
  },

  /** Quality, visibility, performance, leads and history for the detail tabs. */
  getInsights: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/listings/${id}/insights`);
  },

  confirmAvailability: async (id: string, isAvailable = true): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/listings/${id}/availability`, {
      method: "POST",
      body: JSON.stringify({ isAvailable }),
    });
  },

  pauseListing: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/listings/${id}/pause`, { method: "POST" });
  },

  /** Deletes the listing for the company; it stays on record as history. */
  deleteListing: async (id: string, reason?: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/listings/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    });
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
