"use client";

import AdminPanelLayout from "@/components/layout/AdminPanelLayout";
import AdminOverviewView from "@/components/views/AdminOverviewView";
import { PLATFORM_STAFF_ROLES } from "@/types/enums";

export default function AdminOverviewPage() {
  return (
    <AdminPanelLayout allowedRoles={PLATFORM_STAFF_ROLES}>
      <AdminOverviewView />
    </AdminPanelLayout>
  );
}
