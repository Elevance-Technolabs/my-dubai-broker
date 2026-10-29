import { apiRequest } from "@/core/api";
import type { UserRole } from "@/types/enums";

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  sentBy?: { id: string; name: string; email: string };
}

export interface InvitationPreview {
  email: string;
  role: UserRole;
  companyName: string;
  expiresAt: string;
}

export const InvitationService = {
  create: async (data: {
    email: string;
    role: UserRole;
    permissions?: Record<string, boolean>;
  }) => {
    return apiRequest<Invitation>("/invitations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  list: async () => {
    return apiRequest<Invitation[]>("/invitations");
  },

  revoke: async (id: string) => {
    return apiRequest<Invitation>(`/invitations/${id}/revoke`, {
      method: "POST",
    });
  },

  // Public — no auth required, the invited person has no account yet.
  getByToken: async (token: string) => {
    return apiRequest<InvitationPreview>(`/invitations/token/${token}`);
  },

  accept: async (
    token: string,
    data: { name: string; password: string; phoneNumber?: string },
  ) => {
    return apiRequest(`/invitations/token/${token}/accept`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
