"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminService } from "@/services/admin.service";
import {
  ActionButton,
  CATEGORY_OPTIONS,
  DateField,
  FilterBar,
  FilterSelect,
  PageHeader,
  SectionCard,
  Spinner,
  StatTile,
  downloadCsv,
  fmtDateTime,
  fmtMinutes,
  fmtNumber,
  fmtPercent,
  humanize,
} from "@/components/admin/AdminUI";

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const defaultFilters = () => ({ from: daysAgo(30), to: daysAgo(0), category: "", companyId: "" });

/** Listing, company, lead and performance reports with export (Super Admin). */
export default function AdminReportsView() {
  const [filters, setFilters] = useState(defaultFilters);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);

  const load = useCallback(async () => {
    if (filters.from && filters.to && filters.from > filters.to) {
      toast.error("The start date must be before the end date.");
      return;
    }
    setLoading(true);
    const res = await AdminService.getReportSummary(filters);
    if (res.success) setData(res.data);
    else toast.error(res.error || "Failed to load reports");
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    AdminService.getCompanies({ limit: 100, sort: "name" }).then(
      (r) => r.success && setCompanies((r.data?.companies ?? []).map((c: any) => ({ value: c.id, label: c.name }))),
    );
  }, []);

  const exportType = (type: string) =>
    downloadCsv(`/admin/reports/export/${type}`, filters, `${type}-report-${filters.from}-to-${filters.to}.csv`);

  const max = Math.max(1, ...(data?.daily ?? []).map((d: any) => Math.max(d.views, d.enquiries)));

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Reports"
        subtitle="Listing, company, lead and performance reporting for the selected period."
        actions={
          <div className="flex flex-wrap gap-2">
            {["listings", "companies", "leads", "performance"].map((t) => (
              <ActionButton key={t} className="h-10" onClick={() => exportType(t)}>
                Export {t}
              </ActionButton>
            ))}
          </div>
        }
      />

      <FilterBar onReset={() => setFilters(defaultFilters())}>
        <DateField label="From" value={filters.from} onChange={(v) => setFilters((f) => ({ ...f, from: v }))} />
        <DateField label="To" value={filters.to} onChange={(v) => setFilters((f) => ({ ...f, to: v }))} />
        <FilterSelect label="Category" value={filters.category} onChange={(v) => setFilters((f) => ({ ...f, category: v }))} options={CATEGORY_OPTIONS} />
        <FilterSelect label="Company" value={filters.companyId} onChange={(v) => setFilters((f) => ({ ...f, companyId: v }))} options={companies} />
        <div className="flex gap-1 ml-auto">
          {[7, 30, 90].map((n) => (
            <ActionButton key={n} className="h-10" onClick={() => setFilters((f) => ({ ...f, from: daysAgo(n), to: daysAgo(0) }))}>
              Last {n} days
            </ActionButton>
          ))}
        </div>
      </FilterBar>

      {loading && !data ? (
        <Spinner />
      ) : !data ? null : (
        <div className="space-y-6">
          <p className="text-xs text-slate-500">Data as of {fmtDateTime(data.generatedAt)} · staff views and repeated self-views are excluded.</p>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatTile label="Impressions" value={fmtNumber(data.performance.impressions)} />
            <StatTile label="Listing views" value={fmtNumber(data.performance.views)} hint={`CTR ${fmtPercent(data.performance.clickThroughRate)}`} />
            <StatTile label="Contact clicks" value={fmtNumber(data.performance.contacts)} />
            <StatTile label="Enquiries" value={fmtNumber(data.performance.enquiries)} hint={`${data.leads.duplicates} duplicates excluded`} />
            <StatTile label="Enquiry conversion" value={fmtPercent(data.performance.conversionRate)} hint="Enquiries ÷ views" />
            <StatTile label="Qualified rate" value={fmtPercent(data.leads.qualifiedRate)} />
          </div>

          <SectionCard title="Daily views and enquiries">
            <div className="flex items-end gap-px h-44">
              {data.daily.map((d: any) => (
                <div key={d.date} className="flex-1 flex flex-col justify-end gap-px" title={`${d.date}: ${d.views} views, ${d.enquiries} enquiries`}>
                  <div className="bg-slate-800/80 rounded-sm" style={{ height: `${(d.views / max) * 100}%` }} />
                  {d.enquiries > 0 && <div className="bg-gold rounded-sm" style={{ height: `${(d.enquiries / max) * 100}%` }} />}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>{data.daily[0]?.date}</span>
              <span>{data.daily[data.daily.length - 1]?.date}</span>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SectionCard title="Leads">
              <Breakdown rows={data.leads.byStage} />
              <div className="border-t border-slate-100 mt-4 pt-4 space-y-1 text-sm">
                <Line label="Response rate" value={fmtPercent(data.leads.responseRate)} />
                <Line label="Avg first response" value={fmtMinutes(data.leads.avgFirstResponseMinutes)} />
                <Line label="Won / lost" value={`${data.leads.won} / ${data.leads.lost}`} />
              </div>
            </SectionCard>
            <SectionCard title="Listings">
              <Breakdown rows={data.listings.byApproval} />
              <div className="border-t border-slate-100 mt-4 pt-4">
                <Breakdown rows={data.listings.byPublication} />
              </div>
              <p className="text-sm text-slate-600 mt-4">New in period: <span className="font-bold">{data.listings.newInRange}</span></p>
            </SectionCard>
            <SectionCard title="Companies">
              <Breakdown rows={data.companies.byStatus} />
              <p className="text-sm text-slate-600 mt-4">New in period: <span className="font-bold">{data.companies.newInRange}</span></p>
              <div className="border-t border-slate-100 mt-4 pt-4">
                <p className="text-[10px] uppercase tracking-widest font-medium text-slate-500 mb-2">Listings by category</p>
                <Breakdown rows={data.listings.byCategory} labels={Object.fromEntries(CATEGORY_OPTIONS.map((o) => [o.value, o.label]))} />
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Top listings by enquiries">
            {data.topListings.length === 0 ? (
              <p className="text-sm text-slate-500">No views or enquiries in this period.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-slate-500">
                    <th className="py-2">Listing</th>
                    <th className="py-2">Company</th>
                    <th className="py-2">Views</th>
                    <th className="py-2">Enquiries</th>
                    <th className="py-2">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.topListings.map((l: any) => (
                    <tr key={l.id}>
                      <td className="py-2">
                        {l.title} <span className="text-xs text-slate-500">{l.publicRef}</span>
                      </td>
                      <td className="py-2">{l.company}</td>
                      <td className="py-2">{fmtNumber(l.views)}</td>
                      <td className="py-2">{fmtNumber(l.enquiries)}</td>
                      <td className="py-2">{fmtPercent(l.conversionRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
}

function Breakdown({ rows, labels }: { rows: Record<string, number>; labels?: Record<string, string> }) {
  const entries = Object.entries(rows ?? {}).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, n]) => s + n, 0) || 1;
  if (entries.length === 0) return <p className="text-sm text-slate-500">No data.</p>;
  return (
    <div className="space-y-2">
      {entries.map(([key, n]) => (
        <div key={key}>
          <div className="flex justify-between text-sm">
            <span className="text-slate-700">{labels?.[key] ?? humanize(key)}</span>
            <span className="font-medium text-luxury-black">{n}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1">
            <div className="h-full bg-gold" style={{ width: `${(n / total) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-luxury-black">{value}</span>
    </div>
  );
}
