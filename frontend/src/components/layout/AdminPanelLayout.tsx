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

const CompanyStatusView = ({ company }: { company: any }) => {
  const isRejected = company.status === CompanyStatus.REJECTED;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
        <div
          className={cn(
            "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8",
            isRejected
              ? "bg-rose-50 text-rose-500"
              : "bg-amber-50 text-amber-500",
          )}
        >
          {isRejected ? <XCircle size={40} /> : <Clock size={40} />}
        </div>
        <h1 className="text-3xl font-canela text-slate-900 mb-4">
          {isRejected ? "Application Rejected" : "Pending Approval"}
        </h1>
        <p className="text-slate-500 font-satoshi mb-8 leading-relaxed">
          {isRejected
            ? `Unfortunately, your company application for ${company.name} was not approved.`
            : `Your company application for ${company.name} is currently under review by our administrators.`}
        </p>

        <div className="space-y-4 pt-6 border-t border-slate-50">
          {isRejected && company.rejectionReason && (
            <div className="flex flex-col text-left p-4 bg-rose-50 rounded-2xl border border-rose-100 mb-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-rose-600 mb-1">
                Reason for Rejection:
              </span>
              <p className="text-sm text-rose-700 font-medium">
                {company.rejectionReason}
              </p>
            </div>
          )}

          <div className="flex items-start gap-4 text-left p-4 bg-slate-50 rounded-2xl">
            <ShieldAlert className="text-gold shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {isRejected
                ? "Please contact our support team to appeal this decision or provide further information."
                : "You will regain access to your dashboard once your documents are verified and your account is approved."}
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
