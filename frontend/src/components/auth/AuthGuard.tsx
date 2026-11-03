"use client";

import { useSession } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { COMPANY_ROLES, PLATFORM_STAFF_ROLES, UserRole } from "@/types/enums";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export default function AuthGuard({
  children,
  allowedRoles,
  redirectTo,
}: AuthGuardProps) {
  const { data: session, isPending } = useSession() as any;
  const router = useRouter();
  const pathname = usePathname();

  // Platform-admin area -> admin login; everything else (company area) -> normal login.
  const isAdminArea = /^\/(ar\/)?admin(\/|$)/.test(pathname ?? "");
  const loginPath = redirectTo ?? (isAdminArea ? "/admin-login" : "/login");
  const localePrefix = /^\/ar(\/|$)/.test(pathname ?? "") ? "/ar" : "";

  useEffect(() => {
    if (isPending) return;

    if (!session || !session.user) {
      router.replace(loginPath);
      return;
    }

    const role = session.user.role as UserRole;
    if (!allowedRoles.includes(role)) {
      // Signed in, but this page isn't for their role: send them to their
      // own home rather than to a login page they don't need.
      const home = PLATFORM_STAFF_ROLES.includes(role)
        ? `${localePrefix}/admin`
        : COMPANY_ROLES.includes(role)
          ? `${localePrefix}/dashboard`
          : loginPath;
      router.replace(home);
    }
  }, [session, isPending, router, allowedRoles, loginPath, localePrefix]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not pending and session exists with allowed role, render children
  if (session && session.user && allowedRoles.includes(session.user.role)) {
    return <>{children}</>;
  }

  // While redirecting, show nothing or another loader
  return null;
}
