"use client";

import { useSession } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";

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

  useEffect(() => {
    if (isPending) return;

    if (!session || !session.user || !allowedRoles.includes(session.user.role)) {
      router.replace(loginPath);
    }
  }, [session, isPending, router, allowedRoles, loginPath]);

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
