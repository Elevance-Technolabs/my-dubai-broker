"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminService } from "@/services/admin.service";
import {
  ActionButton,
  PageHeader,
  Pill,
  ReasonModal,
  SectionCard,
  Spinner,
  fmtDateTime,
  humanize,
} from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils/cn";

type QualityRow = { component: string; label: string; maxPoints: number; isActive: boolean; version: number; checks: any[] };
type RankRow = { component: string; label: string; weight: number; isActive: boolean; version: number };

/**
 * Scoring and ranking rules (plan Sections 10–14). Every save creates a new
 * rule version, asks for a reason, is written to the audit log and
 * recalculates all listing scores — no deployment needed.
 */
export default function AdminConfigurationView() {
  const [config, setConfig] = useState<any>(null);
  const [quality, setQuality] = useState<QualityRow[]>([]);
  const [ranking, setRanking] = useState<RankRow[]>([]);
  const [saving, setSaving] = useState<"quality" | "ranking" | null>(null);
  const [recalculating, setRecalculating] = useState(false);

  const load = useCallback(async () => {
    const res = await AdminService.getConfiguration();
    if (res.success && res.data) {
      setConfig(res.data);
      setQuality(res.data.quality);
      setRanking(res.data.ranking);
    } else toast.error(res.error || "Failed to load configuration");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const qualityTotal = quality.filter((q) => q.isActive).reduce((s, q) => s + (Number(q.maxPoints) || 0), 0);
  const rankingTotal = Math.round(ranking.filter((r) => r.isActive).reduce((s, r) => s + (Number(r.weight) || 0), 0) * 10) / 10;
  const qualityChanged = config && JSON.stringify(quality) !== JSON.stringify(config.quality);
  const rankingChanged = config && JSON.stringify(ranking) !== JSON.stringify(config.ranking);
  const qualityError =
    quality.some((q) => !Number.isInteger(Number(q.maxPoints)) || Number(q.maxPoints) < 0 || Number(q.maxPoints) > 100)
      ? "Points must be whole numbers from 0 to 100."
      : qualityTotal <= 0
        ? "At least one active component needs points."
        : null;
  const rankingError =
    ranking.some((r) => Number(r.weight) < 0 || Number(r.weight) > 100 || Number.isNaN(Number(r.weight)))
      ? "Weights must be between 0 and 100."
      : Math.round(rankingTotal) !== 100
        ? `Active weights must add up to 100% (now ${rankingTotal}%).`
        : null;

  const save = async (reason: string) => {
    if (saving === "quality") {
      const res = await AdminService.updateQualityConfig(
        quality.map((q) => ({ component: q.component, maxPoints: Number(q.maxPoints), isActive: q.isActive })),
        reason,
      );
      if (!res.success) {
        toast.error(res.error || "Failed to save quality rules");
        return false;
      }
      toast.success(`Quality rules saved (version ${res.data?.version}); ${res.data?.recalculated?.listings ?? 0} listings recalculated`);
    } else if (saving === "ranking") {
      const res = await AdminService.updateRankingConfig(
        ranking.map((r) => ({ component: r.component, weight: Number(r.weight), isActive: r.isActive })),
        reason,
      );
      if (!res.success) {
        toast.error(res.error || "Failed to save ranking rules");
        return false;
      }
      toast.success(`Ranking rules saved (version ${res.data?.version}); visibility recalculated`);
    }
    load();
    return true;
  };

  if (!config) return <Spinner />;

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Configuration"
        subtitle="Quality score and search visibility rules. Changes apply without a deployment and are fully audited."
        actions={
          <ActionButton
            className="h-10"
            disabled={recalculating}
            onClick={async () => {
              setRecalculating(true);
              const res = await AdminService.recalculateScores();
              setRecalculating(false);
              if (res.success) toast.success(`Recalculated ${res.data?.listings ?? 0} listings`);
              else toast.error(res.error || "Recalculation failed");
            }}
          >
            {recalculating ? "Recalculating..." : "Recalculate all scores"}
          </ActionButton>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard
          title="Listing quality score"
          actions={<Pill tone={qualityTotal === 100 ? "green" : "amber"}>Total {qualityTotal} points</Pill>}
        >
          <p className="text-sm text-slate-600 mb-4">
            Points per component. Scores are scaled to 100, so a total other than 100 is allowed. Switch a component off to
            stop counting it.
          </p>
          <div className="space-y-3">
            {quality.map((q, i) => (
              <div key={q.component} className={cn("p-4 border", q.isActive ? "border-gray-100" : "border-dashed border-gray-200 opacity-60")}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-luxury-black">{q.label}</p>
                    <p className="text-xs text-slate-500">{(q.checks ?? []).map((c: any) => c.label).join(" · ")}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={q.maxPoints}
                      onChange={(e) => setQuality((rows) => rows.map((r, j) => (j === i ? { ...r, maxPoints: e.target.value === "" ? ("" as any) : Number(e.target.value) } : r)))}
                      className="w-20 h-10 px-2 border border-gray-200 text-sm text-right"
                      aria-label={`${q.label} points`}
                    />
                    <Toggle
                      checked={q.isActive}
                      onChange={(v) => setQuality((rows) => rows.map((r, j) => (j === i ? { ...r, isActive: v } : r)))}
                      label={`${q.label} active`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {qualityError && <p className="text-xs text-red-500 mt-3">{qualityError}</p>}
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-slate-500">Current version {Math.max(...quality.map((q) => q.version))}</span>
            <div className="flex gap-2">
              <ActionButton disabled={!qualityChanged} onClick={() => setQuality(config.quality)}>Undo</ActionButton>
              <ActionButton tone="dark" disabled={!qualityChanged || !!qualityError} onClick={() => setSaving("quality")}>
                Save quality rules
              </ActionButton>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Search visibility weights"
          actions={<Pill tone={Math.round(rankingTotal) === 100 ? "green" : "red"}>Total {rankingTotal}%</Pill>}
        >
          <p className="text-sm text-slate-600 mb-4">
            How much each factor counts toward organic search position. Active weights must add up to 100%. Sponsored
            placements never change these scores.
          </p>
          <div className="space-y-3">
            {ranking.map((r, i) => (
              <div key={r.component} className={cn("p-4 border", r.isActive ? "border-gray-100" : "border-dashed border-gray-200 opacity-60")}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-luxury-black">{r.label}</p>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={r.weight}
                        onChange={(e) => setRanking((rows) => rows.map((x, j) => (j === i ? { ...x, weight: e.target.value === "" ? ("" as any) : Number(e.target.value) } : x)))}
                        className="w-24 h-10 pl-2 pr-7 border border-gray-200 text-sm text-right"
                        aria-label={`${r.label} weight`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                    </div>
                    <Toggle
                      checked={r.isActive}
                      onChange={(v) => setRanking((rows) => rows.map((x, j) => (j === i ? { ...x, isActive: v } : x)))}
                      label={`${r.label} active`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {rankingError && <p className="text-xs text-red-500 mt-3">{rankingError}</p>}
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-slate-500">Current version {Math.max(...ranking.map((r) => r.version))}</span>
            <div className="flex gap-2">
              <ActionButton disabled={!rankingChanged} onClick={() => setRanking(config.ranking)}>Undo</ActionButton>
              <ActionButton tone="dark" disabled={!rankingChanged || !!rankingError} onClick={() => setSaving("ranking")}>
                Save ranking rules
              </ActionButton>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Change history" className="mt-6">
        {config.history.length === 0 ? (
          <p className="text-sm text-slate-500">No rule changes yet.</p>
        ) : (
          <div className="space-y-2">
            {config.history.map((h: any, i: number) => (
              <div key={i} className="p-3 bg-slate-50 text-sm">
                <p className="font-medium text-luxury-black">{humanize(h.action.replace("config.", ""))}</p>
                <p className="text-slate-700">{h.reason}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {fmtDateTime(h.at)} · {h.actor}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <ReasonModal
        open={!!saving}
        title={saving === "quality" ? "Save quality rules" : "Save ranking rules"}
        description="A new rule version is created and every listing is recalculated. The reason is kept in the audit log."
        confirmLabel="Save and recalculate"
        reasonLabel="Reason for the change"
        onConfirm={save}
        onClose={() => setSaving(null)}
      />
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("w-11 h-6 rounded-full relative transition-colors", checked ? "bg-gold" : "bg-slate-300")}
    >
      <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}
