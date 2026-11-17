"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { listingService } from "@/services/listing.service";
import { AdminService } from "@/services/admin.service";
import {
  ActionButton,
  EmptyState,
  Pill,
  SectionCard,
  Spinner,
  StatTile,
  StatusPill,
  Tabs,
  fmtDate,
  fmtDateTime,
  fmtMinutes,
  fmtNumber,
  fmtPercent,
  humanize,
} from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils/cn";

export type InsightTab = "overview" | "quality" | "visibility" | "performance" | "leads" | "history";

const RATING_TONE: Record<string, "green" | "blue" | "amber" | "red"> = {
  excellent: "green",
  good: "blue",
  needs_attention: "amber",
  incomplete: "red",
};
const LEVEL_TONE: Record<string, "green" | "amber" | "red" | "slate"> = {
  high: "green",
  medium: "amber",
  low: "red",
  not_eligible: "slate",
};

/**
 * Listing detail tabs (plan Section 8). `overview` is supplied by the page
 * because the company and admin overviews differ; the rest come from the
 * listing insights endpoint.
 */
export default function ListingInsightsTabs({
  listingId,
  overview,
  viewer,
  canConfirmAvailability = false,
  initialTab = "overview",
}: {
  listingId: string;
  overview: React.ReactNode;
  viewer: "staff" | "company";
  canConfirmAvailability?: boolean;
  initialTab?: InsightTab;
}) {
  const [tab, setTab] = useState<InsightTab>(initialTab);
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await listingService.getInsights(listingId);
    if (res.success) {
      setInsights(res.data);
      setError(null);
    } else setError(res.error || "Failed to load listing insights");
  }, [listingId]);

  useEffect(() => {
    load();
  }, [load]);

  const tabs: { key: InsightTab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "quality", label: "Quality" },
    { key: "visibility", label: "Visibility" },
    { key: "performance", label: "Performance" },
    ...(insights?.leads ? [{ key: "leads" as const, label: "Leads", count: insights.leads.length }] : []),
    { key: "history", label: "History" },
  ];

  return (
    <div>
      <Tabs<InsightTab> className="mb-6" tabs={tabs} active={tab} onChange={setTab} />
      {tab === "overview" ? (
        overview
      ) : error ? (
        <EmptyState message={error} />
      ) : !insights ? (
        <Spinner />
      ) : tab === "quality" ? (
        <QualityTab insights={insights} />
      ) : tab === "visibility" ? (
        <VisibilityTab insights={insights} canConfirmAvailability={canConfirmAvailability} listingId={listingId} onChanged={load} />
      ) : tab === "performance" ? (
        <PerformanceTab insights={insights} />
      ) : tab === "leads" ? (
        <LeadsTab leads={insights.leads ?? []} />
      ) : (
        <HistoryTab insights={insights} viewer={viewer} listingId={listingId} onChanged={load} />
      )}
    </div>
  );
}

// ─── Quality ────────────────────────────────────────────────────

function QualityTab({ insights }: { insights: any }) {
  const q = insights.quality;
  if (!q) return <EmptyState message="The quality score has not been calculated yet." />;
  const delta = q.previousScore != null ? q.score - q.previousScore : null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile
          label="Quality score"
          value={`${q.score}/100`}
          hint={<Pill tone={RATING_TONE[q.rating] ?? "slate"}>{q.ratingLabel}</Pill>}
        />
        <StatTile label="Available points" value={`+${q.availablePoints}`} hint="If every action below is done" tone="amber" />
        <StatTile label="Actions required" value={q.actions.length} />
        <StatTile
          label="Last calculated"
          value={<span className="text-xl">{fmtDate(q.calculatedAt)}</span>}
          hint={delta != null && delta !== 0 ? `${delta > 0 ? "+" : ""}${delta} since previous score (${q.previousScore})` : undefined}
        />
      </div>

      {q.actions.length > 0 && (
        <SectionCard title="Improve this listing">
          <p className="text-sm text-slate-600 mb-3">
            Your listing is {q.score}/100. Completing these actions can raise it by up to {q.availablePoints} points.
          </p>
          <ul className="space-y-2">
            {q.actions.map((a: any, i: number) => (
              <li key={i} className="flex items-center justify-between gap-3 p-3 bg-amber-50/60 border border-amber-100">
                <span className="text-sm text-slate-800">
                  {a.action} <span className="text-slate-500">({a.component})</span>
                </span>
                <Pill tone="amber">+{Math.round(a.points * 10) / 10}</Pill>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {q.components.map((c: any) => (
          <SectionCard key={c.key} title={c.label} actions={<span className="text-sm font-medium text-luxury-black">{c.score}/{c.maxPoints}</span>}>
            <div className="h-2 rounded-full bg-slate-100 mb-4 overflow-hidden">
              <div className="h-full bg-gold" style={{ width: `${c.maxPoints ? (c.score / c.maxPoints) * 100 : 0}%` }} />
            </div>
            <ul className="space-y-1.5">
              {c.checks.map((check: any, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  {check.passed ? (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span className={check.passed ? "text-slate-700" : "text-slate-900"}>
                    {check.label}
                    {!check.passed && check.action && <span className="block text-xs text-slate-500">{check.action}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}

// ─── Visibility ─────────────────────────────────────────────────

function VisibilityTab({
  insights,
  canConfirmAvailability,
  listingId,
  onChanged,
}: {
  insights: any;
  canConfirmAvailability: boolean;
  listingId: string;
  onChanged: () => void;
}) {
  const v = insights.visibility;
  const [busy, setBusy] = useState(false);
  if (!v) return <EmptyState message="Visibility has not been calculated yet." />;

  const confirm = async () => {
    setBusy(true);
    const res = await listingService.confirmAvailability(listingId, true);
    setBusy(false);
    if (res.success) {
      toast.success("Availability confirmed");
      onChanged();
    } else toast.error(res.error || "Failed to confirm availability");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Visibility level" value={<Pill tone={LEVEL_TONE[v.level] ?? "slate"} className="text-xs">{v.levelLabel}</Pill>} />
        <StatTile label="Position band" value={<span className="text-xl">{v.band ?? "—"}</span>} />
        <StatTile
          label="Estimated position"
          value={v.rank ? `#${v.rank}` : "—"}
          hint={v.totalCompeting ? `of ${v.totalCompeting} competing listings` : undefined}
        />
        <StatTile label="Last calculated" value={<span className="text-xl">{fmtDate(v.calculatedAt)}</span>} />
      </div>

      <p className="text-xs text-slate-500">
        Search results change with each customer&apos;s filters and sorting, so this is an estimate for the
        listing&apos;s category and offering — not a guaranteed page position.
      </p>

      {!v.eligible ? (
        <SectionCard title="Not eligible for search yet">
          <ul className="space-y-2">
            {v.eligibilityReasons.map((r: string) => (
              <li key={r} className="flex items-center gap-2 text-sm text-slate-800">
                <XCircle size={16} className="text-rose-400" /> {r}
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : (
        <SectionCard title="Main reasons">
          <ul className="space-y-2">
            {v.reasons.map((r: any) => (
              <li key={r.component} className="flex items-center gap-2 text-sm text-slate-800">
                {r.impact === "positive" ? (
                  <TrendingUp size={16} className="text-emerald-500" />
                ) : r.impact === "negative" ? (
                  <TrendingDown size={16} className="text-rose-500" />
                ) : (
                  <Minus size={16} className="text-amber-500" />
                )}
                {r.description}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard
        title="Improve visibility"
        actions={
          canConfirmAvailability && (
            <ActionButton tone="dark" onClick={confirm} disabled={busy}>
              {busy ? "Saving..." : "Confirm availability"}
            </ActionButton>
          )
        }
      >
        {insights.availability && (
          <p className="text-sm text-slate-600 mb-3">
            Availability last confirmed {fmtDate(insights.availability.confirmedAt)} · next confirmation due{" "}
            {fmtDate(insights.availability.nextConfirmDue)}
          </p>
        )}
        {v.improvements.length === 0 ? (
          <p className="text-sm text-slate-500">No quality fixes outstanding.</p>
        ) : (
          <ul className="space-y-2">
            {v.improvements.map((a: any, i: number) => (
              <li key={i} className="flex items-center justify-between gap-3 text-sm p-3 bg-slate-50">
                <span>{a.action}</span>
                <Pill tone="amber">+{Math.round(a.points * 10) / 10} quality</Pill>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {v.components.length > 0 && (
        <SectionCard title="Visibility components">
          <div className="space-y-3">
            {v.components.map((c: any) => (
              <div key={c.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">{c.label}</span>
                  <span className="text-slate-500">
                    {Math.round(c.value * 100)}% · weight {Math.round(c.weight * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-slate-800" style={{ width: `${c.value * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Performance ────────────────────────────────────────────────

function PerformanceTab({ insights }: { insights: any }) {
  const p = insights.performance;
  const last = p.last30Days ?? {};
  const all = p.allTime ?? {};
  const max = Math.max(1, ...p.daily.map((d: any) => Math.max(d.views, d.enquiries)));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatTile label="Impressions (30d)" value={fmtNumber(last.impressions)} />
        <StatTile label="Views (30d)" value={fmtNumber(last.views)} hint={`Click-through ${fmtPercent(last.clickThroughRate)}`} />
        <StatTile label="Contact clicks (30d)" value={fmtNumber(last.contacts)} />
        <StatTile label="Enquiries (30d)" value={fmtNumber(last.enquiries)} />
        <StatTile label="Conversion (30d)" value={fmtPercent(last.conversionRate)} hint="Enquiries ÷ views" />
      </div>
      <SectionCard title="Last 30 days">
        <div className="flex items-end gap-1 h-40">
          {p.daily.map((d: any) => (
            <div key={d.date} className="flex-1 flex flex-col justify-end gap-0.5 group relative" title={`${d.date}: ${d.views} views, ${d.enquiries} enquiries`}>
              <div className="bg-slate-800/80" style={{ height: `${(d.views / max) * 100}%` }} />
              {d.enquiries > 0 && <div className="bg-gold" style={{ height: `${(d.enquiries / max) * 100}%` }} />}
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-slate-800/80" /> Views</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-gold" /> Enquiries</span>
        </div>
      </SectionCard>
      <SectionCard title="All time">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div><p className="text-slate-500 text-xs">Impressions</p><p className="font-bold">{fmtNumber(all.impressions)}</p></div>
          <div><p className="text-slate-500 text-xs">Views</p><p className="font-bold">{fmtNumber(all.views)}</p></div>
          <div><p className="text-slate-500 text-xs">Contact clicks</p><p className="font-bold">{fmtNumber(all.contacts)}</p></div>
          <div><p className="text-slate-500 text-xs">Enquiries</p><p className="font-bold">{fmtNumber(all.enquiries)}</p></div>
          <div><p className="text-slate-500 text-xs">Conversion</p><p className="font-bold">{fmtPercent(all.conversionRate)}</p></div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Leads ──────────────────────────────────────────────────────

function LeadsTab({ leads }: { leads: any[] }) {
  if (leads.length === 0) return <EmptyState message="No enquiries for this listing yet." />;
  return (
    <div className="bg-white border border-gray-100 overflow-x-auto">
      <table className="w-full text-left text-sm min-w-[640px]">
        <thead>
          <tr className="bg-slate-50/60 text-[10px] uppercase tracking-widest text-slate-500">
            <th className="px-4 py-3">Received</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3">Assigned to</th>
            <th className="px-4 py-3">First response</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {leads.map((l) => (
            <tr key={l.id}>
              <td className="px-4 py-3">{fmtDateTime(l.createdAt)}</td>
              <td className="px-4 py-3 font-medium">
                {l.customerName} {l.isDuplicate && <Pill tone="amber">Duplicate</Pill>}
              </td>
              <td className="px-4 py-3"><StatusPill status={l.stage} /></td>
              <td className="px-4 py-3">{l.assignedTo?.name ?? "Unassigned"}</td>
              <td className="px-4 py-3">
                {l.firstRespondedAt
                  ? fmtMinutes(Math.round((new Date(l.firstRespondedAt).getTime() - new Date(l.createdAt).getTime()) / 60000))
                  : "Not answered"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── History ────────────────────────────────────────────────────

const HISTORY_STYLE: Record<string, string> = {
  status: "bg-white border-gray-100",
  review: "bg-blue-50/50 border-blue-100",
  comment: "bg-amber-50/60 border-amber-100",
  internal_note: "bg-slate-50 border-gray-200",
};

function HistoryTab({
  insights,
  viewer,
  listingId,
  onChanged,
}: {
  insights: any;
  viewer: "staff" | "company";
  listingId: string;
  onChanged: () => void;
}) {
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (body.trim().length < 2) {
      toast.error("Write a note of at least 2 characters.");
      return;
    }
    setSaving(true);
    const res = await AdminService.addListingNote(listingId, body.trim(), isInternal);
    setSaving(false);
    if (res.success) {
      setBody("");
      toast.success(isInternal ? "Internal note added" : "Comment sent to the partner");
      onChanged();
    } else toast.error(res.error || "Failed to add note");
  };

  const history: any[] = insights.history ?? [];
  return (
    <div className="space-y-4">
      {viewer === "staff" && (
        <div className="border border-gray-100 p-4">
          <div className="flex gap-2 mb-3">
            <ActionButton tone={isInternal ? "dark" : "outline"} onClick={() => setIsInternal(true)}>
              Internal note
            </ActionButton>
            <ActionButton tone={!isInternal ? "dark" : "outline"} onClick={() => setIsInternal(false)}>
              Comment to partner
            </ActionButton>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            placeholder={isInternal ? "Only platform staff can see this" : "The partner sees this and gets a notification"}
            className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-luxury-gold"
          />
          <div className="flex justify-end mt-2">
            <ActionButton tone="dark" onClick={add} disabled={saving}>
              {saving ? "Saving..." : "Add"}
            </ActionButton>
          </div>
        </div>
      )}
      {history.length === 0 && <EmptyState message="No history recorded yet." />}
      {history.map((h, i) => (
        <div key={i} className={cn("p-4 border", HISTORY_STYLE[h.type] ?? HISTORY_STYLE.status)}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-luxury-black">{humanizeArrow(h.title)}</p>
            {h.type === "internal_note" && <Pill>Internal</Pill>}
          </div>
          {h.detail && <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{h.detail}</p>}
          <p className="text-xs text-slate-500 mt-1">
            {fmtDateTime(h.at)} · {h.actor}
          </p>
        </div>
      ))}
    </div>
  );
}

/** "PENDING_REVIEW → APPROVED" → "Pending Review → Approved". */
const humanizeArrow = (title: string) =>
  title.replace(/\b[A-Z][A-Z_]{2,}\b/g, (m) => humanize(m));
