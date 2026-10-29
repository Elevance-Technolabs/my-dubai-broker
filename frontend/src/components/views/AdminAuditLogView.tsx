"use client";

import { useEffect, useState } from "react";
import { AdminService } from "@/services/admin.service";
import { toast } from "sonner";
import { History, User, Building2, FileText, List } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type AuditLogEntry = {
  id: string;
  createdAt: string;
  action: string;
  entityType: string;
  entityId: string;
  reason: string | null;
  actor: { id: string; name: string; email: string; role: string } | null;
};

const ENTITY_TYPE_FILTERS = ["ALL", "listing", "company", "user", "document"] as const;

export default function AdminAuditLogView() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState<string>("ALL");

  const fetchAuditLog = async () => {
    setLoading(true);
    const response = await AdminService.getAuditLog({
      entityType: entityType === "ALL" ? undefined : entityType,
    });
    if (response.success) {
      setEntries((response.data as any)?.entries || []);
    } else {
      toast.error(response.error || "Failed to fetch audit log");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAuditLog();
  }, [entityType]);

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "company":
        return <Building2 size={14} className="text-gold" />;
      case "listing":
        return <List size={14} className="text-blue-500" />;
      case "user":
        return <User size={14} className="text-purple-500" />;
      default:
        return <FileText size={14} className="text-slate-400" />;
    }
  };

  const columns: DataTableColumn<AuditLogEntry>[] = [
    {
      header: "When",
      render: (entry) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {new Date(entry.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Action",
      render: (entry) => (
        <span className="text-sm font-bold text-slate-900">{entry.action}</span>
      ),
    },
    {
      header: "Entity",
      render: (entry) => (
        <div className="flex items-center gap-2">
          {getEntityIcon(entry.entityType)}
          <span className="text-xs text-slate-600">
            {entry.entityType}
            <span className="text-slate-400"> · {entry.entityId.slice(0, 8)}</span>
          </span>
        </div>
      ),
    },
    {
      header: "Actor",
      render: (entry) => (
        <div>
          <p className="text-xs font-bold text-slate-900">
            {entry.actor?.name || "Unknown"}
          </p>
          <p className="text-[10px] text-slate-400">{entry.actor?.email}</p>
        </div>
      ),
    },
    {
      header: "Reason",
      render: (entry) => (
        <span className="text-xs text-slate-500">{entry.reason || "—"}</span>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-canela text-slate-900 mb-2">Audit Log</h1>
          <p className="text-slate-500 font-satoshi">
            Every recorded platform action, most recent first
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {ENTITY_TYPE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setEntityType(f)}
                className={cn(
                  "px-4 py-2 text-[10px] font-bold tracking-widest uppercase rounded-lg transition-all",
                  entityType === f
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {f === "ALL" ? "All" : f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={entries}
        rowKey={(entry) => entry.id}
        isLoading={loading}
        emptyIcon={<History size={32} className="mx-auto mb-4 text-slate-300" />}
        emptyMessage="No audit log entries found."
      />
    </div>
  );
}
