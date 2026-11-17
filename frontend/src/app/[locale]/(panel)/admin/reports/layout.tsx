"use client";

import React from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import { UserRole } from "@/types/enums";

// Super admins only. The shared panel is in (panel)/layout.tsx.
export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={[UserRole.SUPER_ADMIN]}>{children}</AuthGuard>;
}
