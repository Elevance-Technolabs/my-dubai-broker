"use client";

import React from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import { PLATFORM_STAFF_ROLES } from "@/types/enums";

// Admin area: platform staff only. The shared panel is in (panel)/layout.tsx.
export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={PLATFORM_STAFF_ROLES}>{children}</AuthGuard>;
}
