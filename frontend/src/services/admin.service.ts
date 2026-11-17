import { apiRequest } from "@/core/api";

type Params = Record<string, string | number | boolean | undefined>;

/** Drops empty filter values so they are not sent as `?key=`. */
const clean = (params?: Params) =>
  params
    ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""))
    : undefined;

export const AdminService = {
  getPlatformStats: async () => {
    return apiRequest<{
      companies: { total: number; pendingReview: number };
      listings: { total: number; live: number; pendingReview: number };
      leads: { total: number; unresolved: number };
    }>("/admin/stats");
  },

  // ─── Companies ───────────────────────────────────────────────
  getCompanies: async (filters?: Params) => {
    return apiRequest<any>("/admin/companies", { params: clean(filters) });
  },

  updateCompanyStatus: async (id: string, status: string, reason?: string, internalNote?: string) => {
    return apiRequest(`/admin/companies/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, rejectionReason: reason, reason, internalNote: internalNote || undefined }),
    });
  },

  getCompanyDetail: async (id: string) => {
    return apiRequest<any>(`/admin/companies/${id}`);
  },

  setCompanyReviewer: async (id: string, reviewerId: string | null) => {
    return apiRequest(`/admin/companies/${id}/reviewer`, {
      method: "PATCH",
      body: JSON.stringify({ reviewerId }),
    });
  },

  addCompanyNote: async (id: string, body: string, isInternal: boolean) => {
    return apiRequest(`/admin/companies/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ body, isInternal }),
    });
  },

  updateCompanyDocument: async (companyId: string, documentId: string, data: Record<string, unknown>) => {
    return apiRequest(`/admin/companies/${companyId}/documents/${documentId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  getReviewers: async () => {
    return apiRequest<{ id: string; name: string; email: string; role: string }[]>("/admin/reviewers");
  },

  // ─── Listings ────────────────────────────────────────────────
  getListingTable: async (filters?: Params) => {
    return apiRequest<any>("/listings/admin", { params: clean(filters) });
  },

  updateListingStatus: async (id: string, status: string, rejectionReason?: string, internalNote?: string) => {
    return apiRequest(`/listings/${id}/approval`, {
      method: "PATCH",
      body: JSON.stringify({ status, rejectionReason, internalNote: internalNote || undefined }),
    });
  },

  setListingReviewer: async (id: string, reviewerId: string | null) => {
    return apiRequest(`/listings/${id}/reviewer`, {
      method: "PATCH",
      body: JSON.stringify({ reviewerId }),
    });
  },

  addListingNote: async (id: string, body: string, isInternal: boolean) => {
    return apiRequest(`/listings/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ body, isInternal }),
    });
  },

  pauseListing: async (id: string) => apiRequest(`/listings/${id}/pause`, { method: "POST" }),

  /** Edits to an approved listing that are waiting for review. */
  approveListingChanges: async (id: string, note?: string) =>
    apiRequest(`/listings/${id}/changes/approve`, { method: "POST", body: JSON.stringify({ reason: note || undefined }) }),
  rejectListingChanges: async (id: string, reason: string) =>
    apiRequest(`/listings/${id}/changes/reject`, { method: "POST", body: JSON.stringify({ reason }) }),

  // ─── Users ───────────────────────────────────────────────────
  getAllUsers: async (filters?: Params) => {
    return apiRequest<any>("/admin/users", { params: clean(filters) });
  },

  updateUserRole: async (id: string, role: string, reason: string) => {
    return apiRequest(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role, reason }),
    });
  },

  inviteUser: async (data: { companyId?: string; email: string; role: string }) => {
    return apiRequest<{ inviteUrl: string; email: string }>("/admin/users/invite", {
      method: "POST",
      body: JSON.stringify(data),
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

  // ─── Leads, reports, configuration ───────────────────────────
  getLeads: async (filters?: Params) => apiRequest<any>("/admin/leads", { params: clean(filters) }),

  getReportSummary: async (filters?: Params) => apiRequest<any>("/admin/reports/summary", { params: clean(filters) }),

  getConfiguration: async () => apiRequest<any>("/admin/config"),

  updateQualityConfig: async (components: { component: string; maxPoints: number; isActive: boolean }[], reason: string) =>
    apiRequest<any>("/admin/config/quality", { method: "PUT", body: JSON.stringify({ components, reason }) }),

  updateRankingConfig: async (components: { component: string; weight: number; isActive: boolean }[], reason: string) =>
    apiRequest<any>("/admin/config/ranking", { method: "PUT", body: JSON.stringify({ components, reason }) }),

  recalculateScores: async () => apiRequest<any>("/admin/config/recalculate", { method: "POST" }),

  // ─── Audit log ───────────────────────────────────────────────
  getAuditLog: async (filters?: { entityType?: string; page?: number }) => {
    return apiRequest<any>("/admin/audit-log", { params: clean(filters) });
  },
};
