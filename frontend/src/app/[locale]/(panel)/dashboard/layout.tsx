"use client";

import React from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import { COMPANY_ROLES } from "@/types/enums";

// Company workspace: company users only. The shared panel is in (panel)/layout.tsx.
export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={COMPANY_ROLES}>{children}</AuthGuard>;
}
