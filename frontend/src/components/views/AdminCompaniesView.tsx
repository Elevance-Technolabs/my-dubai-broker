"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Building2, ExternalLink, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AdminService } from "@/services/admin.service";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  ActionButton,
  CATEGORY_OPTIONS,
  COMPANY_STATUS_OPTIONS,
  DOCUMENT_LABELS,
  DateField,
  Drawer,
  EmptyState,
  ExportButton,
  FieldError,
  FieldLabel,
  FilterBar,
  FilterSelect,
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
  Tabs,
  downloadCsv,
  fmtAge,
  fmtDate,
  fmtDateTime,
  humanize,
  inputClass,
} from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils/cn";

type Reviewer = { id: string; name: string };
type Decision = "APPROVED" | "CHANGES_REQUIRED" | "REJECTED" | "SUSPENDED";

const AWAITING = ["SUBMITTED", "PENDING_REVIEW"];
const CATEGORY_LABELS = Object.fromEntries(CATEGORY_OPTIONS.map((o) => [o.value, o.label]));

const DECISIONS: Record<
  Decision,
  { title: string; confirm: string; reasonRequired: boolean; reasonLabel: string; tone: "dark" | "danger" | "gold"; success: string }
> = {
  APPROVED: { title: "Approve company", confirm: "Approve", reasonRequired: false, reasonLabel: "Message to the partner", tone: "gold", success: "Company approved" },
  CHANGES_REQUIRED: { title: "Request changes", confirm: "Request changes", reasonRequired: true, reasonLabel: "What must the partner change?", tone: "dark", success: "Changes requested" },
  REJECTED: { title: "Reject application", confirm: "Reject", reasonRequired: true, reasonLabel: "Reason for rejection", tone: "danger", success: "Company rejected" },
  SUSPENDED: { title: "Suspend company", confirm: "Suspend", reasonRequired: true, reasonLabel: "Reason for suspension", tone: "danger", success: "Company suspended" },
};

/** Which decisions make sense from each status. */
const actionsFor = (status: string): Decision[] => {
  if (status === "SUBMITTED" || status === "PENDING_REVIEW" || status === "CHANGES_REQUIRED") return ["APPROVED", "CHANGES_REQUIRED", "REJECTED"];
  if (status === "APPROVED") return ["SUSPENDED"];
  if (status === "SUSPENDED" || status === "REJECTED") return ["APPROVED"];
  return [];
};

const ACTION_LABEL: Record<Decision, string> = {
  APPROVED: "Approve",
  CHANGES_REQUIRED: "Changes",
  REJECTED: "Reject",
  SUSPENDED: "Suspend",
};

/** Saves a company's reviewer and reports the outcome; true when saved. */
async function saveCompanyReviewer(companyId: string, reviewerId: string | null) {
  const res = await AdminService.setCompanyReviewer(companyId, reviewerId);
  if (res.success) toast.success(reviewerId ? "Reviewer assigned" : "Reviewer removed");
  else toast.error(res.error || "Failed to assign reviewer");
  return res.success;
}

const emptyFilters = { search: "", status: "", category: "", reviewerId: "", dateFrom: "", dateTo: "", sort: "oldest" };

export default function AdminCompaniesView() {
  // Super admins assign reviewers; a reviewer only sees what is assigned to them.
  const { data: session } = useSession();
  const isSuperAdmin = (session?.user as any)?.role === "super_admin";
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<{ company: any; status: Decision } | null>(null);
  // Opened from a notification (?company=…): show that company straight away.
  const linkedCompanyId = useSearchParams().get("company");
  useEffect(() => {
    if (linkedCompanyId) setSelectedId(linkedCompanyId);
  }, [linkedCompanyId]);

  const setFilter = (key: keyof typeof emptyFilters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AdminService.getCompanies({ ...filters, page, limit: 20 });
    if (res.success) setData(res.data);
    else toast.error(res.error || "Failed to load companies");
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    AdminService.getReviewers().then((res) => res.success && res.data && setReviewers(res.data));
  }, [isSuperAdmin]);

  const assignReviewer = async (companyId: string, reviewerId: string | null) => {
    const ok = await saveCompanyReviewer(companyId, reviewerId);
    if (ok) {
      // Update the row in place instead of reloading the whole table.
      const reviewer = reviewers.find((r) => r.id === reviewerId) ?? null;
      setData((d: any) =>
        d ? { ...d, companies: d.companies.map((c: any) => (c.id === companyId ? { ...c, assignedReviewer: reviewer } : c)) } : d,
      );
    }
    return ok;
  };

  const confirmDecision = async (reason: string, internalNote: string) => {
    if (!decision) return false;
    const res = await AdminService.updateCompanyStatus(decision.company.id, decision.status, reason || undefined, internalNote);
    if (!res.success) {
      toast.error(res.error || "Failed to update company");
      return false;
    }
    toast.success(DECISIONS[decision.status].success);
    load();
    return true;
  };

  const companies: any[] = data?.companies ?? [];
  const reviewerOptions = [{ value: "unassigned", label: "Unassigned" }, ...reviewers.map((r) => ({ value: r.id, label: r.name }))];

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Company Approvals"
        subtitle={
          isSuperAdmin
            ? "Review applications, documents and decisions for every partner company."
            : "Companies assigned to you for review."
        }
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("/admin/reports/export/companies", { from: filters.dateFrom, to: filters.dateTo }, `companies-${new Date().toISOString().slice(0, 10)}.csv`)
            }
          />
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatTile label="Shown" value={data?.pagination?.total ?? "—"} />
        <StatTile
          label="Overdue reviews"
          value={data?.summary?.overdue ?? "—"}
          tone={(data?.summary?.overdue ?? 0) > 0 ? "red" : "slate"}
          hint="Waiting more than 48 hours"
        />
        <StatTile label="Awaiting decision" value={companies.filter((c) => AWAITING.includes(c.status)).length} hint="On this page" />
        {isSuperAdmin ? (
          <StatTile label="Unassigned" value={companies.filter((c) => !c.assignedReviewer).length} hint="On this page" />
        ) : (
          <StatTile label="Assigned to you" value={data?.pagination?.total ?? "—"} />
        )}
      </div>

      <FilterBar onReset={() => { setFilters(emptyFilters); setPage(1); }}>
        <SearchField value={filters.search} onChange={(v) => setFilter("search", v)} placeholder="Company, email or owner email" />
        <FilterSelect label="Status" value={filters.status} onChange={(v) => setFilter("status", v)} options={COMPANY_STATUS_OPTIONS} />
        <FilterSelect label="Category" value={filters.category} onChange={(v) => setFilter("category", v)} options={CATEGORY_OPTIONS} />
        {isSuperAdmin && (
          <FilterSelect label="Reviewer" value={filters.reviewerId} onChange={(v) => setFilter("reviewerId", v)} options={reviewerOptions} />
        )}
        <DateField label="Created from" value={filters.dateFrom} onChange={(v) => setFilter("dateFrom", v)} />
        <DateField label="Created to" value={filters.dateTo} onChange={(v) => setFilter("dateTo", v)} />
        <FilterSelect
          label="Sort"
          value={filters.sort}
          allLabel={null}
          onChange={(v) => setFilter("sort", v)}
          options={[
            { value: "oldest", label: "Oldest first" },
            { value: "newest", label: "Newest first" },
            { value: "name", label: "Name A–Z" },
          ]}
        />
      </FilterBar>

      {loading && !data ? (
        <Spinner />
      ) : companies.length === 0 ? (
        <EmptyState message="No companies match these filters." />
      ) : (
        <div className="bg-white border border-gray-100 overflow-x-auto">
          <table className="w-full text-left min-w-[1100px]">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-slate-500">
                <th className="px-5 py-4 font-medium">Company</th>
                <th className="px-5 py-4 font-medium">Categories</th>
                {isSuperAdmin && <th className="px-5 py-4 font-medium">Reviewer</th>}
                <th className="px-5 py-4 font-medium">Submitted</th>
                <th className="px-5 py-4 font-medium">Waiting</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {companies.map((c) => (
                <tr key={c.id} className={cn("hover:bg-slate-50/50", c.overdue && "bg-rose-50/30")}>
                  <td className="px-5 py-4">
                    <button onClick={() => setSelectedId(c.id)} className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                        {c.companyLogoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img loading="lazy" decoding="async" src={c.companyLogoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 size={18} className="text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-luxury-black hover:text-luxury-gold truncate max-w-[220px]">{c.name}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[220px]">{c.users?.[0]?.email ?? c.contactEmail ?? "—"}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {(c.categories ?? []).map((cat: string) => (
                        <Pill key={cat}>{CATEGORY_LABELS[cat] ?? humanize(cat)}</Pill>
                      ))}
                    </div>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-5 py-4">
                      <ReviewerSelect
                        value={c.assignedReviewer?.id}
                        reviewers={reviewers}
                        onSave={(id) => assignReviewer(c.id, id)}
                        className="w-44"
                        ariaLabel={`Reviewer for ${c.name}`}
                      />
                    </td>
                  )}
                  <td className="px-5 py-4 text-sm text-slate-700">{fmtDate(c.onboardingCompletedAt ?? c.createdAt)}</td>
                  <td className="px-5 py-4">
                    {AWAITING.includes(c.status) ? (
                      <span className={cn("text-sm font-medium flex items-center gap-1.5", c.overdue ? "text-rose-600" : "text-slate-700")}>
                        {c.overdue && <AlertTriangle size={14} />}
                        {fmtAge(c.ageHours)}
                        {c.overdue && <Pill tone="red">Overdue</Pill>}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1.5 flex-wrap">
                      {actionsFor(c.status).map((a) => (
                        <ActionButton
                          key={a}
                          tone={a === "APPROVED" ? "gold" : a === "REJECTED" || a === "SUSPENDED" ? "danger" : "outline"}
                          onClick={() => setDecision({ company: c, status: a })}
                        >
                          {c.status === "SUSPENDED" && a === "APPROVED" ? "Reactivate" : ACTION_LABEL[a]}
                        </ActionButton>
                      ))}
                      <ActionButton onClick={() => setSelectedId(c.id)}>Open</ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={data?.pagination?.totalPages ?? 1} total={data?.pagination?.total} onChange={setPage} />

      {selectedId && (
        <CompanyDrawer
          companyId={selectedId}
          canAssign={isSuperAdmin}
          reviewers={reviewers}
          onClose={() => setSelectedId(null)}
          onDecision={(company, status) => setDecision({ company, status })}
          onChanged={load}
        />
      )}

      <ReasonModal
        open={!!decision}
        title={decision ? DECISIONS[decision.status].title : ""}
        description={
          decision && (
            <>
              <span className="font-medium text-luxury-black">{decision.company.name}</span>
              {DECISIONS[decision.status].reasonRequired
                ? " — the reason is shown to the partner and saved in the decision history."
                : " — an optional message is shown to the partner."}
            </>
          )
        }
        confirmLabel={decision ? DECISIONS[decision.status].confirm : ""}
        reasonLabel={decision ? DECISIONS[decision.status].reasonLabel : ""}
        reasonRequired={decision ? DECISIONS[decision.status].reasonRequired : true}
        tone={decision ? DECISIONS[decision.status].tone : "dark"}
        withInternalNote
        onConfirm={confirmDecision}
        onClose={() => setDecision(null)}
      />
    </div>
  );
}

// ─── Company detail drawer ──────────────────────────────────────

type DrawerTab = "overview" | "documents" | "notes" | "history";

function CompanyDrawer({
  companyId,
  canAssign,
  reviewers,
  onClose,
  onDecision,
  onChanged,
}: {
  companyId: string;
  canAssign: boolean;
  reviewers: Reviewer[];
  onClose: () => void;
  onDecision: (company: any, status: Decision) => void;
  onChanged: () => void;
}) {
  const [company, setCompany] = useState<any>(null);
  const [tab, setTab] = useState<DrawerTab>("overview");

  const load = useCallback(async () => {
    const res = await AdminService.getCompanyDetail(companyId);
    if (res.success) setCompany(res.data);
    else toast.error(res.error || "Failed to load company");
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    load();
    onChanged();
  };

  const owner = company?.users?.find((u: any) => u.role === "company_owner");

  return (
    <Drawer
      open
      onClose={onClose}
      title={company?.name ?? "Loading..."}
      subtitle={
        company && (
          <span className="flex items-center gap-2 flex-wrap">
            <StatusPill status={company.status} />
            <span>Reviewer: {company.assignedReviewer?.name ?? "Unassigned"}</span>
          </span>
        )
      }
      footer={
        company && (
          <div className="flex flex-wrap gap-3 justify-end">
            {actionsFor(company.status).map((a) => (
              <ActionButton
                key={a}
                size="md"
                tone={a === "APPROVED" ? "gold" : a === "REJECTED" || a === "SUSPENDED" ? "danger" : "outline"}
                onClick={() => onDecision(company, a)}
              >
                {company.status === "SUSPENDED" && a === "APPROVED" ? "Reactivate" : DECISIONS[a].confirm}
              </ActionButton>
            ))}
          </div>
        )
      }
    >
      {!company ? (
        <Spinner />
      ) : (
        <>
          <Tabs<DrawerTab>
            className="mb-6"
            active={tab}
            onChange={setTab}
            tabs={[
              { key: "overview", label: "Overview" },
              { key: "documents", label: "Documents", count: company.documents?.length ?? 0 },
              { key: "notes", label: "Notes", count: company.reviewNotes?.length ?? 0 },
              { key: "history", label: "History", count: company.statusHistory?.length ?? 0 },
            ]}
          />

          {tab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard title="Company">
                <Field label="Description" value={company.description} />
                <Field label="Address" value={company.address} />
                <Field label="Contact email" value={company.contactEmail} />
                <Field label="Contact phone" value={company.contactPhone} />
                <Field
                  label="Website"
                  value={
                    company.websiteUrl ? (
                      <a href={company.websiteUrl} target="_blank" rel="noreferrer" className="text-gold hover:underline">
                        {company.websiteUrl}
                      </a>
                    ) : null
                  }
                />
                <Field label="Languages" value={(company.languages ?? []).join(", ")} />
              </SectionCard>
              <SectionCard title="Owner and team">
                <Field label="Owner" value={owner ? `${owner.name} (${owner.email})` : "No owner account"} />
                <Field label="Team members" value={String(company.users?.length ?? 0)} />
                <Field label="Listings" value={String(company._count?.listings ?? 0)} />
                <Field label="Leads" value={String(company._count?.leads ?? 0)} />
                <Field label="Categories" value={(company.categories ?? []).map((c: string) => CATEGORY_LABELS[c] ?? c).join(", ")} />
                <Field label="Submitted" value={fmtDateTime(company.onboardingCompletedAt ?? company.createdAt)} />
              </SectionCard>
              <SectionCard title="Assigned reviewer" className="md:col-span-2">
                {canAssign ? (
                  <ReviewerSelect
                    value={company.assignedReviewer?.id}
                    reviewers={reviewers}
                    className="w-full md:w-80"
                    onSave={async (id) => {
                      const ok = await saveCompanyReviewer(company.id, id);
                      if (ok) refresh();
                      return ok;
                    }}
                  />
                ) : (
                  <p className="text-sm text-luxury-black">{company.assignedReviewer?.name ?? "Unassigned"}</p>
                )}
                {company.rejectionReason && (
                  <p className="text-sm text-slate-600 mt-4">
                    <span className="font-bold">Last reason shown to partner: </span>
                    {company.rejectionReason}
                  </p>
                )}
              </SectionCard>
            </div>
          )}

          {tab === "documents" && (
            <div className="space-y-4">
              {(company.documents ?? []).length === 0 && <EmptyState message="No documents were uploaded." />}
              {(company.documents ?? []).map((doc: any) => (
                <DocumentCard key={doc.id} companyId={company.id} doc={doc} onSaved={refresh} />
              ))}
            </div>
          )}

          {tab === "notes" && <NotesPanel company={company} onSaved={refresh} />}

          {tab === "history" && (
            <div className="space-y-3">
              {(company.statusHistory ?? []).length === 0 && <EmptyState message="No decisions recorded yet." />}
              {(company.statusHistory ?? []).map((h: any) => (
                <div key={h.id} className="flex gap-4 p-4 border border-gray-100">
                  <div className="w-2 h-2 rounded-full bg-gold mt-2 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-luxury-black">
                      {h.entityType === "document" ? "Document review: " : ""}
                      {h.fromStatus ? `${humanize(h.fromStatus)} → ` : ""}
                      {humanize(h.toStatus)}
                    </p>
                    {h.reason && <p className="text-sm text-slate-600 mt-0.5">{h.reason}</p>}
                    <p className="text-xs text-slate-500 mt-1">
                      {fmtDateTime(h.createdAt)} · {h.actorName ?? "System"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] uppercase tracking-widest font-medium text-slate-500">{label}</p>
      <div className="text-sm text-slate-800 break-words">{value || <span className="text-slate-400">—</span>}</div>
    </div>
  );
}

const toInputDate = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : "");

function DocumentCard({ companyId, doc, onSaved }: { companyId: string; doc: any; onSaved: () => void }) {
  const [form, setForm] = useState({
    documentNumber: doc.documentNumber ?? "",
    issuingAuthority: doc.issuingAuthority ?? "",
    issueDate: toInputDate(doc.issueDate),
    expiryDate: toInputDate(doc.expiryDate),
    // The pill shows the status as of today (e.g. Expiring); the form edits
    // the stored review status.
    status: doc.storedStatus ?? doc.status,
    reviewNote: doc.reviewNote ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError(null);
  };

  const save = async () => {
    if (form.issueDate && form.expiryDate && form.expiryDate <= form.issueDate) {
      setError("Expiry date must be after the issue date.");
      return;
    }
    setSaving(true);
    const res = await AdminService.updateCompanyDocument(companyId, doc.id, {
      documentNumber: form.documentNumber || null,
      issuingAuthority: form.issuingAuthority || null,
      issueDate: form.issueDate || null,
      expiryDate: form.expiryDate || null,
      status: form.status,
      reviewNote: form.reviewNote || null,
    });
    setSaving(false);
    if (res.success) {
      toast.success("Document saved");
      onSaved();
    } else {
      setError(res.fieldErrors ? Object.values(res.fieldErrors).join(" ") : res.error || "Failed to save document");
    }
  };

  const field = (label: string, control: React.ReactNode) => (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {control}
    </div>
  );
  return (
    <div className="border border-gray-100 p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="font-serif text-xl text-luxury-black">{DOCUMENT_LABELS[doc.documentType] ?? humanize(doc.documentType)}</p>
          <p className="text-xs text-gray-400 mt-1">Uploaded {fmtDate(doc.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={doc.status} />
          {doc.viewUrl && (
            <a
              href={doc.viewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-4 border border-gray-200 text-[10px] font-medium uppercase tracking-[0.15em] text-luxury-black hover:border-luxury-gold hover:text-luxury-gold transition-colors"
            >
              View <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
        {field("Document number", <input className={inputClass()} value={form.documentNumber} onChange={(e) => set("documentNumber", e.target.value)} />)}
        {field("Issuing authority", <input className={inputClass()} value={form.issuingAuthority} onChange={(e) => set("issuingAuthority", e.target.value)} />)}
        {field("Issue date", <input type="date" className={inputClass()} value={form.issueDate} onChange={(e) => set("issueDate", e.target.value)} />)}
        {field("Expiry date", <input type="date" className={inputClass()} value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />)}
        {field(
          "Review status",
          <select className={inputClass()} value={form.status} onChange={(e) => set("status", e.target.value)}>
            {["UPLOADED", "UNDER_REVIEW", "VALID", "MISSING"].map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </select>,
        )}
        {field("Review note", <input className={inputClass()} value={form.reviewNote} onChange={(e) => set("reviewNote", e.target.value)} placeholder="Optional" />)}
      </div>
      <FieldError message={error} />
      <div className="flex justify-end mt-5">
        <ActionButton tone="dark" size="md" onClick={save} loading={saving}>
          Save document
        </ActionButton>
      </div>
    </div>
  );
}

function NotesPanel({ company, onSaved }: { company: any; onSaved: () => void }) {
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [saving, setSaving] = useState(false);
  const notes: any[] = company.reviewNotes ?? [];

  const add = async () => {
    if (body.trim().length < 2) {
      toast.error("Write a note of at least 2 characters.");
      return;
    }
    setSaving(true);
    const res = await AdminService.addCompanyNote(company.id, body.trim(), isInternal);
    setSaving(false);
    if (res.success) {
      setBody("");
      toast.success(isInternal ? "Internal note added" : "Comment sent to the partner");
      onSaved();
    } else toast.error(res.error || "Failed to add note");
  };

  return (
    <div className="space-y-6">
      <div className="border border-gray-100 p-6">
        <div className="flex mb-4">
          <ActionButton tone={isInternal ? "dark" : "outline"} onClick={() => setIsInternal(true)}>
            Internal note
          </ActionButton>
          <ActionButton className="-ml-px" tone={!isInternal ? "dark" : "outline"} onClick={() => setIsInternal(false)}>
            Comment to partner
          </ActionButton>
        </div>
        <FieldLabel>{isInternal ? "Note (only platform staff can see it)" : "Comment (the partner sees it and gets a notification)"}</FieldLabel>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className={cn(inputClass(), "resize-none")} />
        <div className="flex justify-end mt-4">
          <ActionButton tone="dark" size="md" onClick={add} loading={saving}>
            {isInternal ? "Add note" : "Send comment"}
          </ActionButton>
        </div>
      </div>

      {(["internal", "partner"] as const).map((group) => {
        const list = notes.filter((n) => (group === "internal" ? n.isInternal : !n.isInternal));
        return (
          <div key={group}>
            <h4 className="text-[10px] uppercase tracking-widest font-medium text-gray-500 mb-3">
              {group === "internal" ? "Internal notes (staff only)" : "Comments visible to the partner"}
            </h4>
            {list.length === 0 ? (
              <p className="text-sm text-slate-400">None yet.</p>
            ) : (
              <div className="space-y-2">
                {list.map((n) => (
                  <div
                    key={n.id}
                    className={cn("p-4 text-sm border-l-2", n.isInternal ? "bg-gray-50 border-gray-300" : "bg-luxury-gold/5 border-luxury-gold")}
                  >
                    <p className="text-slate-800 whitespace-pre-wrap">{n.body}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {n.author?.name ?? "—"} · {fmtDateTime(n.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
