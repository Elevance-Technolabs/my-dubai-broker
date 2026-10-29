"use client";

import AdminPanelLayout from "@/components/layout/AdminPanelLayout";
import React from "react";
import { COMPANY_ROLES } from "@/types/enums";

export default function ListingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminPanelLayout allowedRoles={COMPANY_ROLES}>
      {children}
    </AdminPanelLayout>
  );
}
