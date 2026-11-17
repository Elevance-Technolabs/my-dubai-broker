"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { AdminService } from "@/services/admin.service";
import {
  DateField,
  EmptyState,
  ExportButton,
  FilterBar,
  FilterSelect,
  LEAD_STAGE_OPTIONS,
  PageHeader,
  Pagination,
  Pill,
  SearchField,
  Spinner,
  StatTile,
  StatusPill,
  downloadCsv,
  fmtDateTime,
  fmtMinutes,
  fmtPercent,
} from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils/cn";

const emptyFilters = { search: "", companyId: "", stage: "", assignedToId: "", overdueOnly: "", dateFrom: "", dateTo: "" };

/** Platform-wide enquiry volume, routing health and response times (Super Admin). */
export default function AdminLeadsView() {
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);

  const setFilter = (key: keyof typeof emptyFilters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AdminService.getLeads({ ...filters, page, limit: 25 });
    if (res.success) setData(res.data);
    else toast.error(res.error || "Failed to load leads");
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    AdminService.getCompanies({ limit: 100, sort: "name" }).then(
      (r) => r.success && setCompanies((r.data?.companies ?? []).map((c: any) => ({ value: c.id, label: c.name }))),
    );
  }, []);

  const s = data?.summary;
  const leads: any[] = data?.leads ?? [];

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Leads"
        subtitle="Enquiry volume, routing and response times across every company."
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv(
                "/admin/reports/export/leads",
                { companyId: filters.companyId, from: filters.dateFrom, to: filters.dateTo },
                `leads-${new Date().toISOString().slice(0, 10)}.csv`,
              )
            }
          />
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatTile label="Total enquiries" value={s?.total ?? "—"} />
        <StatTile label="New" value={s?.newLeads ?? "—"} onClick={() => setFilter("stage", "NEW")} active={filters.stage === "NEW"} />
        <StatTile
          label="Unassigned"
          value={s?.unassigned ?? "—"}
          tone={(s?.unassigned ?? 0) > 0 ? "amber" : "slate"}
          onClick={() => setFilter("assignedToId", "unassigned")}
          active={filters.assignedToId === "unassigned"}
        />
        <StatTile
          label="Overdue response"
          value={s?.overdue ?? "—"}
          tone={(s?.overdue ?? 0) > 0 ? "red" : "slate"}
          onClick={() => setFilter("overdueOnly", filters.overdueOnly ? "" : "true")}
          active={!!filters.overdueOnly}
          hint="No response within the company window"
        />
        <StatTile label="Response rate" value={fmtPercent(s?.responseRate)} hint="Answered within the window" />
        <StatTile label="Avg first response" value={<span className="text-2xl">{fmtMinutes(s?.avgFirstResponseMinutes)}</span>} />
      </div>

      <FilterBar onReset={() => { setFilters(emptyFilters); setPage(1); }}>
        <SearchField value={filters.search} onChange={(v) => setFilter("search", v)} placeholder="Customer, email, phone or listing" />
        <FilterSelect label="Company" value={filters.companyId} onChange={(v) => setFilter("companyId", v)} options={companies} />
        <FilterSelect label="Stage" value={filters.stage} onChange={(v) => setFilter("stage", v)} options={LEAD_STAGE_OPTIONS} />
        <FilterSelect
          label="Assignment"
          value={filters.assignedToId}
          onChange={(v) => setFilter("assignedToId", v)}
          options={[{ value: "unassigned", label: "Unassigned" }]}
        />
        <FilterSelect
          label="Response"
          value={filters.overdueOnly}
          onChange={(v) => setFilter("overdueOnly", v)}
          options={[{ value: "true", label: "Overdue only" }]}
        />
        <DateField label="From" value={filters.dateFrom} onChange={(v) => setFilter("dateFrom", v)} />
        <DateField label="To" value={filters.dateTo} onChange={(v) => setFilter("dateTo", v)} />
      </FilterBar>

      {s?.byStage && Object.keys(s.byStage).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {LEAD_STAGE_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setFilter("stage", filters.stage === o.value ? "" : o.value)}
              className={cn(
                "px-3 py-1.5 rounded-full border text-xs font-bold",
                filters.stage === o.value ? "border-gold bg-gold/10 text-slate-900" : "border-gray-200 text-slate-600",
              )}
            >
              {o.label} · {s.byStage[o.value] ?? 0}
            </button>
          ))}
        </div>
      )}

      {loading && !data ? (
        <Spinner />
      ) : leads.length === 0 ? (
        <EmptyState message="No enquiries match these filters." />
      ) : (
        <div className="bg-white border border-gray-100 overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1100px]">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-slate-500">
                {["Received", "Customer", "Listing", "Company", "Assigned to", "Stage", "First response", "Source"].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leads.map((l) => (
                <tr key={l.id} className={cn(l.overdue && "bg-rose-50/30")}>
                  <td className="px-4 py-3 whitespace-nowrap">{fmtDateTime(l.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-luxury-black">
                      {l.customerName} {l.isDuplicate && <Pill tone="amber">Duplicate</Pill>}
                    </p>
                    <p className="text-xs text-slate-500">{[l.customerEmail, l.customerPhone].filter(Boolean).join(" · ") || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="truncate max-w-[220px]">{l.listing?.title}</p>
                    <p className="text-xs text-slate-500">{l.listing?.publicRef}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{l.company?.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {l.assignedTo ? (
                      <>
                        {l.assignedTo.name} {l.assignedTo.banned && <Pill tone="red">Deactivated</Pill>}
                      </>
                    ) : (
                      <Pill tone="amber">Unassigned</Pill>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusPill status={l.stage} /></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {l.responseMinutes != null ? (
                      <span className={l.respondedWithinSla ? "text-emerald-700" : "text-amber-700"}>
                        {fmtMinutes(l.responseMinutes)}
                      </span>
                    ) : l.overdue ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <AlertTriangle size={14} /> Overdue (window {fmtMinutes(l.slaMinutes)})
                      </span>
                    ) : (
                      <span className="text-slate-500">Waiting</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[180px] truncate">{l.utmSource ?? l.sourcePage ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={data?.pagination?.totalPages ?? 1} total={data?.pagination?.total} onChange={setPage} />
    </div>
  );
}
