"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ImageOff, LayoutGrid, Rows3 } from "lucide-react";
import { toast } from "sonner";
import { AdminService } from "@/services/admin.service";
import { listingService } from "@/services/listing.service";
import { useSession } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import ListingInsightsTabs from "@/components/listing-insights/ListingInsightsTabs";
import {
  APPROVAL_OPTIONS,
  ASSET_TYPE_OPTIONS,
  ActionButton,
  CATEGORY_OPTIONS,
  DateField,
  Drawer,
  EmptyState,
  ExportButton,
  FilterBar,
  FilterSelect,
  NumberField,
  OFFERING_OPTIONS,
  PUBLICATION_OPTIONS,
  PageHeader,
  Pagination,
  Pill,
  ReasonModal,
  ReviewerSelect,
  SearchField,
  SectionCard,
  Spinner,
  StatTile,
  StatusPill,
  downloadCsv,
  fmtAge,
  fmtDate,
  fmtMoney,
  fmtNumber,
  fmtPercent,
} from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils/cn";

type Mode = "all" | "queue";
type Decision = "APPROVED" | "CHANGES_REQUIRED" | "REJECTED";
type Option = { value: string; label: string };

const AWAITING = ["SUBMITTED", "PENDING_REVIEW"];
const VIEW_KEY = "mdb_admin_listing_view";

const DECISIONS: Record<Decision, { title: string; confirm: string; reasonRequired: boolean; reasonLabel: string; tone: "dark" | "danger" | "gold"; success: string }> = {
  APPROVED: { title: "Approve listing", confirm: "Approve", reasonRequired: false, reasonLabel: "Message to the partner", tone: "gold", success: "Listing approved and live" },
  CHANGES_REQUIRED: { title: "Request changes", confirm: "Request changes", reasonRequired: true, reasonLabel: "What must the partner change?", tone: "dark", success: "Changes requested" },
  REJECTED: { title: "Reject listing", confirm: "Reject", reasonRequired: true, reasonLabel: "Reason for rejection", tone: "danger", success: "Listing rejected" },
};

/** Decisions apply to submissions still in play; deleted listings are history only. */
const canDecide = (row: { approvalStatus: string; publicationStatus?: string }) =>
  row.publicationStatus !== "DELETED" && (AWAITING.includes(row.approvalStatus) || row.approvalStatus === "CHANGES_REQUIRED");

const SORT_OPTIONS: Option[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "waiting", label: "Waiting longest" },
  { value: "price_high", label: "Price: high to low" },
  { value: "price_low", label: "Price: low to high" },
  { value: "quality", label: "Quality score" },
  { value: "visibility", label: "Visibility" },
  { value: "views", label: "Views" },
  { value: "enquiries", label: "Enquiries" },
  { value: "expiry", label: "Expiry date" },
];

const emptyFilters = {
  search: "",
  category: "",
  offeringType: "",
  assetType: "",
  companyId: "",
  creatorId: "",
  reviewerId: "",
  approvalStatus: "",
  publicationStatus: "",
  scoreMin: "",
  scoreMax: "",
  dateFrom: "",
  dateTo: "",
  sort: "",
};

export default function AdminListingsView({ mode = "all" }: { mode?: Mode }) {
  const { data: session } = useSession();
  const isSuperAdmin = (session?.user as any)?.role === "super_admin";
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "cards">("table");
  const [reviewers, setReviewers] = useState<Option[]>([]);
  const [companies, setCompanies] = useState<Option[]>([]);
  const [users, setUsers] = useState<Option[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [decision, setDecision] = useState<{ row: any; status: Decision } | null>(null);
  const searchParams = useSearchParams();
  const linkedListingId = searchParams.get("listing");

  // Opened from a notification: show that listing's details straight away.
  useEffect(() => {
    if (!linkedListingId) return;
    AdminService.getListingTable({ listing: linkedListingId, limit: 1 }).then((res) => {
      const row = res.success ? res.data?.listings?.[0] : null;
      if (row) setSelected(row);
      else toast.error("That listing could not be found.");
    });
  }, [linkedListingId]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === "cards" || saved === "table") setView(saved);
    } catch {
      // ignore
    }
    AdminService.getReviewers().then((r) => r.success && r.data && setReviewers(r.data.map((u) => ({ value: u.id, label: u.name }))));
    AdminService.getCompanies({ limit: 100, sort: "name" }).then(
      (r) => r.success && setCompanies((r.data?.companies ?? []).map((c: any) => ({ value: c.id, label: c.name }))),
    );
    AdminService.getAllUsers({ type: "partner", limit: 100 }).then(
      (r) => r.success && setUsers((r.data?.users ?? []).map((u: any) => ({ value: u.id, label: `${u.name} (${u.company?.name ?? "—"})` }))),
    );
  }, []);

  const changeView = (v: "table" | "cards") => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      // ignore
    }
  };

  const setFilter = (key: keyof typeof emptyFilters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const query = { ...filters, queue: mode === "queue" ? "true" : undefined };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AdminService.getListingTable({ ...query, page, limit: 25 });
    if (res.success) setData(res.data);
    else toast.error(res.error || "Failed to load listings");
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, mode]);

  useEffect(() => {
    load();
  }, [load]);

  const assignReviewer = async (listingId: string, reviewerId: string | null) => {
    const res = await AdminService.setListingReviewer(listingId, reviewerId);
    if (!res.success) {
      toast.error(res.error || "Failed to assign reviewer");
      return false;
    }
    toast.success(reviewerId ? "Reviewer assigned" : "Reviewer removed");
    // Update the row in place instead of reloading the whole table.
    const reviewer = reviewers.find((r) => r.value === reviewerId);
    setData((d: any) =>
      d
        ? {
            ...d,
            listings: d.listings.map((l: any) =>
              l.id === listingId
                ? { ...l, reviewerAssigned: !!reviewerId, reviewer: reviewer ? { id: reviewer.value, name: reviewer.label } : null }
                : l,
            ),
          }
        : d,
    );
    return true;
  };

  const [changesDecision, setChangesDecision] = useState<{ row: any; kind: "approve" | "reject" } | null>(null);

  const confirmChangesDecision = async (reason: string) => {
    const d = changesDecision;
    if (!d) return false;
    const res =
      d.kind === "approve"
        ? await AdminService.approveListingChanges(d.row.id, reason)
        : await AdminService.rejectListingChanges(d.row.id, reason);
    if (!res.success) {
      toast.error(res.error || "Failed to update the changes");
      return false;
    }
    toast.success(d.kind === "approve" ? "Changes approved and live" : "Changes rejected. The partner has been told why.");
    setSelected(null);
    load();
    return true;
  };

  const confirmDecision = async (reason: string, internalNote: string) => {
    if (!decision) return false;
    const res = await AdminService.updateListingStatus(decision.row.id, decision.status, reason || undefined, internalNote);
    if (!res.success) {
      toast.error(res.error || "Failed to update listing");
      return false;
    }
    toast.success(DECISIONS[decision.status].success);
    setSelected(null);
    load();
    return true;
  };

  const pause = async (row: any) => {
    const res = await AdminService.pauseListing(row.id);
    if (res.success) {
      toast.success("Listing paused");
      load();
    } else toast.error(res.error || "Failed to pause listing");
  };

  const rows: any[] = data?.listings ?? [];
  const reviewerOptions = [{ value: "unassigned", label: "Unassigned" }, ...reviewers];

  const decisionButtons = (row: any) =>
    canDecide(row) && (
      <>
        <ActionButton tone="gold" onClick={(e) => { e.stopPropagation(); setDecision({ row, status: "APPROVED" }); }}>Approve</ActionButton>
        <ActionButton onClick={(e) => { e.stopPropagation(); setDecision({ row, status: "CHANGES_REQUIRED" }); }}>Changes</ActionButton>
        <ActionButton tone="danger" onClick={(e) => { e.stopPropagation(); setDecision({ row, status: "REJECTED" }); }}>Reject</ActionButton>
      </>
    );

  const reviewerList = reviewers.map((r) => ({ id: r.value, name: r.label }));
  // Only super admins assign reviewers; a reviewer sees the name.
  const reviewerSelect = (row: any, className = "w-44") =>
    !isSuperAdmin ? (
      <span className="text-sm text-luxury-black whitespace-nowrap">{row.reviewerAssigned ? row.reviewer?.name : "Unassigned"}</span>
    ) : (
    <div onClick={(e) => e.stopPropagation()}>
      <ReviewerSelect
        value={row.reviewerAssigned ? row.reviewer?.id : ""}
        reviewers={reviewerList}
        onSave={(id) => assignReviewer(row.id, id)}
        className={className}
        ariaLabel={`Reviewer for ${row.title}`}
      />
    </div>
  );
  // The drawer reads the live row, so a reviewer change shows there too.
  const selectedRow = selected ? rows.find((r) => r.id === selected.id) ?? selected : null;

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title={mode === "queue" ? "Listing Approvals" : "All Listings"}
        subtitle={
          !isSuperAdmin
            ? mode === "queue"
              ? "Listings assigned to you that are waiting for a decision, oldest first."
              : "Every listing assigned to you."
            : mode === "queue"
              ? "Submissions waiting for a decision, oldest first."
              : "Every listing across every company and category."
        }
        actions={
          <>
            <div className="flex border border-gray-200 h-10">
              <button
                onClick={() => changeView("table")}
                className={cn("w-10 flex items-center justify-center transition-colors cursor-pointer", view === "table" ? "bg-luxury-black text-white" : "bg-white text-gray-400 hover:text-luxury-black")}
                aria-label="Table view"
              >
                <Rows3 size={16} />
              </button>
              <button
                onClick={() => changeView("cards")}
                className={cn("w-10 flex items-center justify-center transition-colors cursor-pointer", view === "cards" ? "bg-luxury-black text-white" : "bg-white text-gray-400 hover:text-luxury-black")}
                aria-label="Card view"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            <ExportButton
              onClick={() => downloadCsv("/listings/admin/export", query, `listings-${new Date().toISOString().slice(0, 10)}.csv`)}
            />
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatTile label={mode === "queue" ? "Waiting for review" : "Listings"} value={data?.pagination?.total ?? "—"} />
        <StatTile
          label="Overdue reviews"
          value={data?.summary?.overdue ?? "—"}
          tone={(data?.summary?.overdue ?? 0) > 0 ? "red" : "slate"}
          hint="Waiting more than 48 hours"
        />
        {isSuperAdmin ? (
          <StatTile label="No reviewer assigned" value={data?.summary?.unassigned ?? "—"} />
        ) : (
          <StatTile label="Assigned to you" value={data?.pagination?.total ?? "—"} />
        )}
        <StatTile label="Showing" value={rows.length} hint={`Page ${page}`} />
      </div>

      <FilterBar onReset={() => { setFilters(emptyFilters); setPage(1); }}>
        <SearchField value={filters.search} onChange={(v) => setFilter("search", v)} placeholder="Title, reference, company, agent, location, permit" />
        <FilterSelect label="Category" value={filters.category} onChange={(v) => setFilter("category", v)} options={CATEGORY_OPTIONS} />
        <FilterSelect label="Offering" value={filters.offeringType} onChange={(v) => setFilter("offeringType", v)} options={OFFERING_OPTIONS} />
        <FilterSelect label="Asset type" value={filters.assetType} onChange={(v) => setFilter("assetType", v)} options={ASSET_TYPE_OPTIONS} />
        <FilterSelect label="Company" value={filters.companyId} onChange={(v) => setFilter("companyId", v)} options={companies} />
        <FilterSelect label="User" value={filters.creatorId} onChange={(v) => setFilter("creatorId", v)} options={users} />
        {isSuperAdmin && (
          <FilterSelect label="Reviewer" value={filters.reviewerId} onChange={(v) => setFilter("reviewerId", v)} options={reviewerOptions} />
        )}
        <FilterSelect
          label="Approval"
          value={filters.approvalStatus}
          onChange={(v) => setFilter("approvalStatus", v)}
          options={mode === "queue" ? APPROVAL_OPTIONS.filter((o) => AWAITING.includes(o.value)) : APPROVAL_OPTIONS}
        />
        {mode === "all" && (
          <FilterSelect label="Publication" value={filters.publicationStatus} onChange={(v) => setFilter("publicationStatus", v)} options={PUBLICATION_OPTIONS} />
        )}
        <NumberField label="Score min" value={filters.scoreMin} min={0} max={100} onChange={(v) => setFilter("scoreMin", v)} />
        <NumberField label="Score max" value={filters.scoreMax} min={0} max={100} onChange={(v) => setFilter("scoreMax", v)} />
        <DateField label="Created from" value={filters.dateFrom} onChange={(v) => setFilter("dateFrom", v)} />
        <DateField label="Created to" value={filters.dateTo} onChange={(v) => setFilter("dateTo", v)} />
        <FilterSelect
          label="Sort"
          value={filters.sort}
          allLabel={mode === "queue" ? "Waiting longest" : "Newest"}
          onChange={(v) => setFilter("sort", v)}
          options={SORT_OPTIONS}
        />
      </FilterBar>

      {loading && !data ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState message={mode === "queue" ? "Nothing is waiting for review." : "No listings match these filters."} />
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((row) => (
            <div
              key={row.id}
              onClick={() => setSelected(row)}
              className={cn("bg-white border overflow-hidden cursor-pointer hover:border-luxury-gold/60 transition-colors", row.overdue ? "border-rose-200" : "border-gray-100")}
            >
              <div className="aspect-video bg-slate-100 relative">
                {row.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img loading="lazy" decoding="async" src={row.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageOff /></div>
                )}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <StatusPill status={row.approvalStatus} />
                  <StatusPill status={row.publicationStatus} />
                </div>
              </div>
              <div className="p-4 space-y-2">
                <p className="font-medium text-luxury-black truncate">{row.title}</p>
                <p className="text-xs text-slate-500">{row.publicRef} · {row.company?.name}</p>
                <p className="text-sm text-slate-800">{fmtMoney(row.price, row.currency, row.priceOnRequest)}</p>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <Pill>{row.categoryLabel}</Pill>
                  <Pill>{row.offeringLabel}</Pill>
                  {row.qualityScore != null && <Pill tone="gold">Quality {row.qualityScore}</Pill>}
                  {row.visibilityLevel && <Pill tone="blue">{row.visibilityLevel}</Pill>}
                  {row.pendingChanges && <Pill tone="gold">Changes pending</Pill>}
                  {row.overdue && <Pill tone="red">Overdue</Pill>}
                </div>
                {row.actionRequired && <p className="text-xs text-amber-700">{row.actionRequired}</p>}
                <div className="flex flex-wrap gap-2 pt-3" onClick={(e) => e.stopPropagation()}>
                  {decisionButtons(row)}
                  {reviewerSelect(row, "w-full")}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[2400px]">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-slate-500">
                {[
                  "Listing", "Location", "Category / offering / type", "Price", "Company", "Owner", "Assigned user",
                  "Approval", "Publication", ...(mode === "queue" ? ["Waiting"] : []), "Reviewer", "Action required",
                  "Views", "Enquiries", "Conversion", "Quality", "Visibility", "Last calculated", "Availability",
                  "Expiry", "Created", "Updated", "Actions",
                ].map((h) => (
                  <th key={h} className="px-4 py-4 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row) => (
                <tr key={row.id} onClick={() => setSelected(row)} className={cn("hover:bg-slate-50/50 cursor-pointer", row.overdue && "bg-rose-50/30")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-10 bg-slate-100 overflow-hidden shrink-0">
                        {row.thumbnail && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img loading="lazy" decoding="async" src={row.thumbnail} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-luxury-black truncate max-w-[220px]">{row.title}</p>
                        <p className="text-xs text-slate-500">{row.publicRef}{row.internalRef ? ` · ${row.internalRef}` : ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 max-w-[180px] truncate">{row.location ?? "—"}</td>
                  <td className="px-4 py-3">
                    <p className="text-slate-800">{row.categoryLabel}</p>
                    <p className="text-xs text-slate-500">{row.offeringLabel} · {row.assetTypeLabel}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmtMoney(row.price, row.currency, row.priceOnRequest)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.company?.name ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.owner ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.assignedUser?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <StatusPill status={row.approvalStatus} label={row.approvalLabel} />
                      {row.pendingChanges && <Pill tone="gold">Changes pending</Pill>}
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusPill status={row.publicationStatus} label={row.publicationLabel} /></td>
                  {mode === "queue" && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn("flex items-center gap-1.5", row.overdue ? "text-rose-600 font-bold" : "text-slate-700")}>
                        {row.overdue && <AlertTriangle size={14} />}
                        {fmtAge(row.ageHours)}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3">{reviewerSelect(row)}</td>
                  <td className="px-4 py-3 text-xs text-amber-700 max-w-[200px]">{row.actionRequired ?? <span className="text-slate-400">—</span>}</td>
                  <td className="px-4 py-3">{fmtNumber(row.views)}</td>
                  <td className="px-4 py-3">{fmtNumber(row.enquiries)}</td>
                  <td className="px-4 py-3">{fmtPercent(row.conversionRate)}</td>
                  <td className="px-4 py-3">{row.qualityScore != null ? <span title={row.qualityRating}>{row.qualityScore}/100</span> : "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.visibilityLevel ?? "—"}{row.visibilityBand ? <span className="text-xs text-slate-500 block">{row.visibilityBand}</span> : null}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmtDate(row.lastCalculatedAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.availability ? (
                      <>
                        {row.availability.isAvailable ? "Available" : "Not available"}
                        <span className="text-xs text-slate-500 block">Due {fmtDate(row.availability.nextConfirmDue)}</span>
                      </>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmtDate(row.expiresAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmtDate(row.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmtDate(row.updatedAt)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1.5">
                      {decisionButtons(row)}
                      {isSuperAdmin && row.publicationStatus === "LIVE" && <ActionButton onClick={() => pause(row)}>Pause</ActionButton>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={data?.pagination?.totalPages ?? 1} total={data?.pagination?.total} onChange={setPage} />

      {selectedRow && (
        <ListingDrawer
          row={selectedRow}
          onClose={() => setSelected(null)}
          onDecision={(status) => setDecision({ row: selectedRow, status })}
          onChangesDecision={(kind) => setChangesDecision({ row: selectedRow, kind })}
          reviewerSelect={reviewerSelect(selectedRow, "w-56")}
        />
      )}

      <ReasonModal
        open={!!decision}
        title={decision ? DECISIONS[decision.status].title : ""}
        description={decision && <><span className="font-medium text-luxury-black">{decision.row.title}</span> — {decision.row.company?.name}</>}
        confirmLabel={decision ? DECISIONS[decision.status].confirm : ""}
        reasonLabel={decision ? DECISIONS[decision.status].reasonLabel : ""}
        reasonRequired={decision ? DECISIONS[decision.status].reasonRequired : true}
        tone={decision ? DECISIONS[decision.status].tone : "dark"}
        withInternalNote
        onConfirm={confirmDecision}
        onClose={() => setDecision(null)}
      />

      <ReasonModal
        open={!!changesDecision}
        title={changesDecision?.kind === "approve" ? "Approve changes" : "Reject changes"}
        description={
          changesDecision && (
            <>
              <span className="font-medium text-luxury-black">{changesDecision.row.title}</span> —{" "}
              {changesDecision.kind === "approve"
                ? "the changes replace the current version."
                : "the changes are discarded and the current version stays. The partner sees your reason."}
            </>
          )
        }
        confirmLabel={changesDecision?.kind === "approve" ? "Approve changes" : "Reject changes"}
        reasonLabel={changesDecision?.kind === "approve" ? "Message to the partner" : "Reason shown to the partner"}
        reasonRequired={changesDecision?.kind === "reject"}
        tone={changesDecision?.kind === "approve" ? "gold" : "danger"}
        onConfirm={confirmChangesDecision}
        onClose={() => setChangesDecision(null)}
      />

    </div>
  );
}

function ListingDrawer({
  row,
  onClose,
  onDecision,
  onChangesDecision,
  reviewerSelect,
}: {
  row: any;
  onClose: () => void;
  onDecision: (status: Decision) => void;
  onChangesDecision: (kind: "approve" | "reject") => void;
  reviewerSelect: React.ReactNode;
}) {
  const [listing, setListing] = useState<any>(null);
  useEffect(() => {
    listingService.getListingById(row.id).then((res) => {
      if (res.success) setListing(res.data);
      else toast.error(res.error || "Failed to load listing");
    });
  }, [row.id]);

  const details = listing?.details ?? {};
  const overview = !listing ? (
    <Spinner />
  ) : (
    <div className="space-y-4">
      {listing.deleted && (
        <div className="p-4 bg-rose-50/60 border-l-2 border-rose-500 text-sm text-luxury-black">
          <span className="font-medium">Deleted by the company</span>
          {` on ${fmtDate(listing.deleted.at)}`}
          {listing.deleted.byName ? ` by ${listing.deleted.byName}` : ""}. It is no longer on the website and is kept as history.
        </div>
      )}
      {!listing.deleted && listing.pendingChanges && (
        <SectionCard title="Changes waiting for review">
          <p className="text-sm text-gray-500 mb-4">
            Submitted {fmtDate(listing.pendingChanges.at)}. The version below is live until you approve these changes.
          </p>
          {listing.pendingChanges.changes.length === 0 ? (
            <p className="text-sm text-gray-500">No field differs from the live version.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-gray-100">
                  <th className="text-left font-medium py-2 pr-4">Field</th>
                  <th className="text-left font-medium py-2 pr-4">Live now</th>
                  <th className="text-left font-medium py-2">Changed to</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listing.pendingChanges.changes.map((c: any) => (
                  <tr key={c.field} className="align-top">
                    <td className="py-2 pr-4 text-luxury-black whitespace-nowrap">{c.label}</td>
                    <td className="py-2 pr-4 text-gray-400 line-through break-words max-w-xs">{c.from}</td>
                    <td className="py-2 text-luxury-black break-words max-w-xs">{c.to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      )}
      {!listing.deleted && listing.adminRejectionReason && ["CHANGES_REQUIRED", "REJECTED"].includes(listing.approvalStatus) && (
        <div className="p-4 bg-luxury-gold/5 border-l-2 border-luxury-gold text-sm text-luxury-black">
          <span className="font-medium">Reason shown to partner: </span>
          {listing.adminRejectionReason}
        </div>
      )}
      {(listing.media?.photos ?? []).length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {listing.media.photos.slice(0, 8).map((src: string, i: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" decoding="async" key={i} src={src} alt="" className="aspect-square object-cover" />
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Listing">
          <dl className="space-y-2 text-sm">
            <Row label="Reference" value={listing.publicRef} />
            <Row label="Category" value={listing.categoryLabel} />
            <Row label="Asset type" value={row.assetTypeLabel} />
            <Row label="Offering" value={listing.pricing?.offeringLabel} />
            <Row label="Price" value={fmtMoney(row.price, row.currency, row.priceOnRequest)} />
            <Row label="Permit / licence" value={listing.licenseNumber} />
            <Row label="Location" value={row.location} />
          </dl>
        </SectionCard>
        <SectionCard title="Ownership">
          <dl className="space-y-2 text-sm">
            <Row label="Company" value={listing.company?.name} />
            <Row label="Owner" value={row.owner} />
            <Row label="Assigned user" value={listing.agent ? `${listing.agent.name} (${listing.agent.email})` : null} />
            <Row label="Submitted" value={fmtDate(listing.timestamps?.submittedAt)} />
            <Row label="Created" value={fmtDate(listing.timestamps?.createdAt)} />
            <Row label="Updated" value={fmtDate(listing.timestamps?.updatedAt)} />
          </dl>
        </SectionCard>
      </div>
      <SectionCard title="Description">
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{listing.description}</p>
      </SectionCard>
      {Object.keys(details).length > 0 && (
        <SectionCard title="Category details">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {Object.entries(details)
              .filter(([, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0))
              .map(([k, v]) => (
                <Row key={k} label={k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())} value={Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v)} />
              ))}
          </dl>
        </SectionCard>
      )}
    </div>
  );

  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-5xl"
      title={row.title}
      subtitle={
        <span className="flex items-center gap-2 flex-wrap">
          <StatusPill status={row.approvalStatus} label={row.approvalLabel} />
          <StatusPill status={row.publicationStatus} label={row.publicationLabel} />
          <span>{row.company?.name}</span>
        </span>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest text-gray-500">Reviewer</span>
            {reviewerSelect}
          </div>
          {!canDecide(row) && row.pendingChanges && row.publicationStatus !== "DELETED" && (
            <div className="flex flex-wrap gap-3">
              <ActionButton size="md" tone="gold" onClick={() => onChangesDecision("approve")}>Approve changes</ActionButton>
              <ActionButton size="md" tone="danger" onClick={() => onChangesDecision("reject")}>Reject changes</ActionButton>
            </div>
          )}
          {canDecide(row) && (
            <div className="flex flex-wrap gap-3">
              <ActionButton size="md" tone="gold" onClick={() => onDecision("APPROVED")}>Approve</ActionButton>
              <ActionButton size="md" onClick={() => onDecision("CHANGES_REQUIRED")}>Request changes</ActionButton>
              <ActionButton size="md" tone="danger" onClick={() => onDecision("REJECTED")}>Reject</ActionButton>
            </div>
          )}
        </div>
      }
    >
      <ListingInsightsTabs listingId={row.id} viewer="staff" overview={overview} />
    </Drawer>
  );
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-luxury-black text-right">{value || "—"}</dd>
    </div>
  );
}
