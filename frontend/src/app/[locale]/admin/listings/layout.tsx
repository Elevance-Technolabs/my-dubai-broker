"use client";

import AdminPanelLayout from "@/components/layout/AdminPanelLayout";
import React from "react";
import { PLATFORM_STAFF_ROLES } from "@/types/enums";

export default function AdminListingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminPanelLayout allowedRoles={PLATFORM_STAFF_ROLES}>
      {children}
    </AdminPanelLayout>
  );
}
