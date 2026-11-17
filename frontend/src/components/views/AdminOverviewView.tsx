"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Clock,
  List,
  Radio,
  Contact,
  AlertCircle,
} from "lucide-react";
import { AdminService } from "@/services/admin.service";
import { useSession } from "@/lib/auth-client";

type PlatformStats = {
  companies: { total: number; pendingReview: number };
  listings: { total: number; live: number; pendingReview: number };
  leads: { total: number; unresolved: number };
};

function StatTile({
  icon: Icon,
  label,
  value,
  tone = "slate",
}: {
  icon: any;
  label: string;
  value: number;
  tone?: "slate" | "amber" | "emerald" | "rose";
}) {
  const toneClasses: Record<string, string> = {
    slate: "bg-slate-50 text-slate-500",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="bg-white border border-gray-100 p-6 flex items-center gap-4">
      <div
        className={`w-12 h-12 flex items-center justify-center shrink-0 ${toneClasses[tone]}`}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-serif text-slate-900">{value}</p>
        <p className="text-[10px] uppercase tracking-widest font-medium text-slate-400 mt-1">
          {label}
        </p>
      </div>
    </div>
  );
}

function StatSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10">
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}

export default function AdminOverviewView() {
  // A reviewer's overview counts only what is assigned to them.
  const { data: session } = useSession();
  const isSuperAdmin = (session?.user as any)?.role === "super_admin";
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const response = await AdminService.getPlatformStats();
      if (response.success) {
        setStats(response.data ?? null);
      } else {
        toast.error(response.error || "Failed to fetch platform stats");
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-serif text-slate-900 mb-2">
          {isSuperAdmin ? "Platform Overview" : "Your Overview"}
        </h1>
        <p className="text-slate-500 font-satoshi">
          {isSuperAdmin
            ? "Live snapshot of companies, listings, and leads across the platform"
            : "Companies and listings assigned to you for review"}
        </p>
      </div>

      {loading && (
        <div className="text-center py-24 text-slate-400 font-satoshi text-sm">
          Loading platform stats...
        </div>
      )}

      {!loading && !stats && (
        <div className="text-center py-24 text-slate-400 font-satoshi text-sm flex flex-col items-center gap-3">
          <AlertCircle size={24} />
          Unable to load platform stats.
        </div>
      )}

      {!loading && stats && (
        <>
          <StatSection title="Companies">
            <StatTile icon={Building2} label="Total" value={stats.companies.total} />
            <StatTile
              icon={Clock}
              label="Pending Review"
              value={stats.companies.pendingReview}
              tone="amber"
            />
          </StatSection>

          <StatSection title="Listings">
            <StatTile icon={List} label="Total" value={stats.listings.total} />
            <StatTile
              icon={Radio}
              label="Live"
              value={stats.listings.live}
              tone="emerald"
            />
            <StatTile
              icon={Clock}
              label="Pending Review"
              value={stats.listings.pendingReview}
              tone="amber"
            />
          </StatSection>

          {isSuperAdmin && (
          <StatSection title="Leads">
            <StatTile icon={Contact} label="Total" value={stats.leads.total} />
            <StatTile
              icon={AlertCircle}
              label="Unresolved"
              value={stats.leads.unresolved}
              tone="rose"
            />
          </StatSection>
          )}
        </>
      )}
    </div>
  );
}
