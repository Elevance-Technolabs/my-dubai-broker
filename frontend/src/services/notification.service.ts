import { apiRequest } from "@/core/api";

export interface AppNotification {
  id: string;
  createdAt: string;
  priority: "URGENT" | "ACTION_NEEDED" | "INFORMATION";
  type: string;
  title: string;
  body: string;
  actionUrl: string | null;
  readAt: string | null;
}

/** Sidebar badge counts; only the ones that apply to the user's role are present. */
export interface SidebarBadges {
  notifications: number;
  leads?: number;
  listings?: number;
  companyApprovals?: number;
  listingApprovals?: number;
}

export const NotificationService = {
  badges: async () => apiRequest<SidebarBadges>("/notifications/badges"),

  list: async (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    apiRequest<{
      notifications: AppNotification[];
      unreadCount: number;
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>("/notifications", { params }),

  markRead: async (id: string) => apiRequest(`/notifications/${id}/read`, { method: "PATCH" }),

  markAllRead: async () => apiRequest("/notifications/read-all", { method: "POST" }),
};
