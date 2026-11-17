"use client";

import React from "react";
import AdminPanelLayout from "@/components/layout/AdminPanelLayout";
import { COMPANY_ROLES, PLATFORM_STAFF_ROLES } from "@/types/enums";

/**
 * One panel (sidebar + company status) for every signed-in page, admin and
 * partner alike. It stays mounted while moving between pages, so a click in
 * the sidebar only swaps the page content. Each section narrows the allowed
 * roles with its own lightweight AuthGuard layout.
 */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminPanelLayout allowedRoles={[...PLATFORM_STAFF_ROLES, ...COMPANY_ROLES]}>{children}</AdminPanelLayout>;
}
