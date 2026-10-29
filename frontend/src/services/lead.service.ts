import { apiRequest, ApiResponse } from "@/core/api";

export interface CreateLeadPayload {
  listingId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  preferredContact?: "call" | "whatsapp" | "email";
  sourcePage?: string;
  sourceForm?: string;
  message?: string;
}

export interface Lead {
  id: string;
  stage: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  message: string | null;
  createdAt: string;
  lastActivityAt: string | null;
  isDuplicate: boolean;
  listing: { id: string; title: string; publicRef: string };
  assignedTo: { id: string; name: string; email: string } | null;
}

interface LeadsResult {
  leads: Lead[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export const LeadService = {
  create: async (data: CreateLeadPayload): Promise<ApiResponse<{ id: string }>> => {
    return apiRequest("/leads", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMyLeads: async (stage?: string): Promise<ApiResponse<LeadsResult>> => {
    return apiRequest("/leads/my-leads", { params: stage ? { stage } : undefined });
  },

  getCompanyLeads: async (stage?: string): Promise<ApiResponse<LeadsResult>> => {
    return apiRequest("/leads", { params: stage ? { stage } : undefined });
  },

  updateStage: async (id: string, stage: string, note?: string) => {
    return apiRequest(`/leads/${id}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage, note }),
    });
  },

  addActivity: async (id: string, type: "CALL" | "WHATSAPP" | "EMAIL" | "NOTE", note?: string) => {
    return apiRequest(`/leads/${id}/activities`, {
      method: "POST",
      body: JSON.stringify({ type, note }),
    });
  },
};
