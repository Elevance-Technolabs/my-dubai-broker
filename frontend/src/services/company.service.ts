import { apiRequest } from "@/core/api";

export interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
  permissions?: Record<string, boolean> | null;
}

export const CompanyService = {
  async updateOnboarding(data: any) {
    return apiRequest("/companies/onboarding", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getOnboardingStatus() {
    return apiRequest("/companies/onboarding/status", {
      method: "GET",
    });
  },

  async getMyCompany() {
    return apiRequest<any>("/companies/me");
  },

  async getCompanyUsers() {
    return apiRequest<CompanyUser[]>("/companies/me/users");
  },

  async deactivateUser(userId: string, reason?: string) {
    return apiRequest(`/companies/me/users/${userId}/deactivate`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  async reactivateUser(userId: string) {
    return apiRequest(`/companies/me/users/${userId}/reactivate`, {
      method: "POST",
    });
  },

  async updateUserPermissions(userId: string, permissions: Record<string, boolean>) {
    return apiRequest(`/companies/me/users/${userId}/permissions`, {
      method: "PATCH",
      body: JSON.stringify({ permissions }),
    });
  },
};
