"use client";

import AdminPanelLayout from "@/components/layout/AdminPanelLayout";
import React from "react";
import { COMPANY_ROLES, PLATFORM_STAFF_ROLES } from "@/types/enums";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminPanelLayout allowedRoles={[...COMPANY_ROLES, ...PLATFORM_STAFF_ROLES]}>
      {children}
    </AdminPanelLayout>
  );
}
