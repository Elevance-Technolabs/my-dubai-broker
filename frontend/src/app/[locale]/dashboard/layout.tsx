"use client";

import AdminPanelLayout from "@/components/layout/AdminPanelLayout";
import React from "react";
import { COMPANY_ROLES } from "@/types/enums";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Company workspace only; AuthGuard sends platform staff to /admin.
    <AdminPanelLayout allowedRoles={COMPANY_ROLES}>
      {children}
    </AdminPanelLayout>
  );
}
