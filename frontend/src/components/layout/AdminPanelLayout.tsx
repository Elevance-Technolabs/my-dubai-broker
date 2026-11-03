"use client";

import Sidebar from "@/components/layout/Sidebar";
import React, { useEffect, useState } from "react";
import { CompanyService } from "@/services/company.service";
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  XCircle,
  LogOut,
} from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils/cn";
import AuthGuard from "@/components/auth/AuthGuard";
import Button from "@/components/ui/Button";
import { CompanyStatus, COMPANY_ROLES, PLATFORM_STAFF_ROLES } from "@/types/enums";

interface AdminPanelLayoutProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function AdminPanelLayout({
  children,
  allowedRoles = [...PLATFORM_STAFF_ROLES, ...COMPANY_ROLES],
}: AdminPanelLayoutProps) {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const checkApproval = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await CompanyService.getMyCompany();
      if (response.success) {
        setCompany(response.data);
      } else {
        setError(response.error || "Failed to load your company status.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load your company status.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    checkApproval();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (loading && session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <CompanyStatusErrorView error={error} onRetry={checkApproval} />;
  }

  return (
    <AuthGuard allowedRoles={allowedRoles}>
      {company && company.status !== CompanyStatus.APPROVED ? (
        <CompanyStatusView company={company} />
      ) : (
        <div className="bg-white min-h-screen">
          <Sidebar />
          <main className="lg:pl-64 min-h-screen">
            <div className="container bg-[#FCFCFC] mx-auto px-8 py-12 min-h-screen">
              {children}
            </div>
          </main>
        </div>
      )}
    </AuthGuard>
  );
}

const CompanyStatusErrorView = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
    <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 bg-rose-50 text-rose-500">
        <AlertTriangle size={40} />
      </div>
      <h1 className="text-3xl font-canela text-slate-900 mb-4">
        Something Went Wrong
      </h1>
      <p className="text-slate-500 font-satoshi mb-8 leading-relaxed">
        {error}
      </p>
      <Button variant="dark" onClick={onRetry} className="w-full">
        Try Again
      </Button>
    </div>
  </div>
);

// What a partner sees while their company is not approved. Only these three
// statuses carry an admin reason; everything else is still awaiting review.
const STATUS_SCREENS: Record<
  string,
  {
    title: string;
    message: (companyName: string) => string;
    reasonLabel?: string;
    nextStep: string;
    tone: "danger" | "warning";
    Icon: typeof Clock;
  }
> = {
  [CompanyStatus.REJECTED]: {
    title: "Application Rejected",
    message: (name) =>
      `Unfortunately, your company application for ${name} was not approved.`,
    reasonLabel: "Reason for Rejection:",
    nextStep:
      "Please contact our support team to appeal this decision or provide further information.",
    tone: "danger",
    Icon: XCircle,
  },
  [CompanyStatus.CHANGES_REQUIRED]: {
    title: "Changes Required",
    message: (name) =>
      `Our administrators reviewed your company application for ${name} and need some changes before it can be approved.`,
    reasonLabel: "Changes Requested:",
    nextStep:
      "Please contact our support team with the requested changes. Your application will be reviewed again once they are received.",
    tone: "warning",
    Icon: AlertTriangle,
  },
  [CompanyStatus.SUSPENDED]: {
    title: "Account Suspended",
    message: (name) =>
      `Your company account for ${name} has been suspended by our administrators.`,
    reasonLabel: "Reason for Suspension:",
    nextStep: "Please contact our support team to resolve this and restore access.",
    tone: "danger",
    Icon: XCircle,
  },
};

const PENDING_SCREEN = {
  title: "Pending Approval",
  message: (name: string) =>
    `Your company application for ${name} is currently under review by our administrators.`,
  reasonLabel: undefined,
  nextStep:
    "You will regain access to your dashboard once your documents are verified and your account is approved.",
  tone: "warning" as const,
  Icon: Clock,
};

const CompanyStatusView = ({ company }: { company: any }) => {
  const screen = STATUS_SCREENS[company.status] ?? PENDING_SCREEN;
  const isDanger = screen.tone === "danger";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
        <div
          className={cn(
            "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8",
            isDanger ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500",
          )}
        >
          <screen.Icon size={40} />
        </div>
        <h1 className="text-3xl font-canela text-slate-900 mb-4">{screen.title}</h1>
        <p className="text-slate-500 font-satoshi mb-8 leading-relaxed">
          {screen.message(company.name)}
        </p>

        <div className="space-y-4 pt-6 border-t border-slate-50">
          {screen.reasonLabel && company.rejectionReason && (
            <div
              className={cn(
                "flex flex-col text-left p-4 rounded-2xl border mb-4",
                isDanger ? "bg-rose-50 border-rose-100" : "bg-amber-50 border-amber-100",
              )}
            >
              <span
                className={cn(
                  "text-[10px] uppercase tracking-widest font-bold mb-1",
                  isDanger ? "text-rose-600" : "text-amber-700",
                )}
              >
                {screen.reasonLabel}
              </span>
              <p
                className={cn(
                  "text-sm font-medium",
                  isDanger ? "text-rose-700" : "text-amber-800",
                )}
              >
                {company.rejectionReason}
              </p>
            </div>
          )}

          <div className="flex items-start gap-4 text-left p-4 bg-slate-50 rounded-2xl">
            <ShieldAlert className="text-gold shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {screen.nextStep}
            </p>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
