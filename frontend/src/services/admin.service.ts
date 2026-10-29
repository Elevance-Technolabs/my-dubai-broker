import { apiRequest } from "@/core/api";

export const AdminService = {
  getPlatformStats: async () => {
    return apiRequest<{
      companies: { total: number; pendingReview: number };
      listings: { total: number; live: number; pendingReview: number };
      leads: { total: number; unresolved: number };
    }>("/admin/stats");
  },

  getCompanies: async (status?: string) => {
    return apiRequest<any>("/admin/companies", {
      params: status ? { status } : undefined,
    } as any);
  },

  updateCompanyStatus: async (
    id: string,
    status: string,
    reason?: string,
  ) => {
    return apiRequest(`/admin/companies/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, rejectionReason: reason, reason }),
    });
  },

  getCompanyDetail: async (id: string) => {
    return apiRequest<any>(`/admin/companies/${id}`);
  },

  getAuditLog: async (filters?: { entityType?: string; page?: number }) => {
    return apiRequest<any>("/admin/audit-log", {
      params: filters,
    } as any);
  },

  getListings: async (approvalStatus?: string, search?: string) => {
    return apiRequest<any>("/listings/admin", {
      params: { approvalStatus: approvalStatus || undefined, search: search || undefined },
    } as any);
  },

  updateListingStatus: async (id: string, status: string, rejectionReason?: string) => {
    return apiRequest(`/listings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, rejectionReason }),
    });
  },

  getAllUsers: async (filters?: { companyId?: string; role?: string; search?: string }) => {
    return apiRequest<any>("/admin/users", { params: filters } as any);
  },

  updateUserRole: async (id: string, role: string) => {
    return apiRequest(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  deactivatePlatformUser: async (id: string, reason?: string) => {
    return apiRequest(`/admin/users/${id}/deactivate`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  reactivatePlatformUser: async (id: string) => {
    return apiRequest(`/admin/users/${id}/reactivate`, { method: "POST" });
  },
};
