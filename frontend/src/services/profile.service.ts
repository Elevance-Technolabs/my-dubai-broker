import { apiRequest, ApiResponse } from "@/core/api";

export interface AgentProfile {
  id: string;
  displayName: string | null;
  bio: string | null;
  photoUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  languages: string[];
  specialities: string[];
  showPhone: boolean;
  showWhatsapp: boolean;
  showEmail: boolean;
}

export interface MyProfileResult {
  user: { id: string; name: string; email: string; phone: string | null; role: string; brn: string | null };
  profile: AgentProfile | null;
}

export const ProfileService = {
  getMyProfile: async (): Promise<ApiResponse<MyProfileResult>> => {
    return apiRequest("/profile/me");
  },

  updateMyProfile: async (data: {
    displayName?: string;
    bio?: string;
    photoUploadId?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    languages?: string[];
    showPhone?: boolean;
    showWhatsapp?: boolean;
    showEmail?: boolean;
  }): Promise<ApiResponse<AgentProfile>> => {
    return apiRequest("/profile/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};
