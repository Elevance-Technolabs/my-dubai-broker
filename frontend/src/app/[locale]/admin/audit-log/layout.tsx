"use client";

import AdminPanelLayout from "@/components/layout/AdminPanelLayout";
import React from "react";
import { UserRole } from "@/types/enums";

// Super-admin only, matching the backend's `admin.view_audit_log` capability
// (platform_reviewer doesn't have it — see permissions.ts).
export default function AdminAuditLogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminPanelLayout allowedRoles={[UserRole.SUPER_ADMIN]}>
      {children}
    </AdminPanelLayout>
  );
}
