"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronDown, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { API_BASE_URL } from "@/core/env";
import { getAuthToken } from "@/lib/auth-token";
import { toast } from "sonner";

// ─── Formatting ─────────────────────────────────────────────────

export const fmtDate = (v?: string | Date | null) =>
  v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (v?: string | Date | null) =>
  v
    ? new Date(v).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const fmtNumber = (v?: number | null) => (v == null ? "—" : v.toLocaleString("en-US"));

/** 0–1 ratio as a percentage. */
export const fmtPercent = (v?: number | null, digits = 1) =>
  v == null ? "—" : `${(v * 100).toFixed(digits).replace(/\.0$/, "")}%`;

export const fmtMoney = (amount?: number | null, currency?: string | null, onRequest?: boolean) => {
  if (onRequest) return "On request";
  if (amount == null) return "—";
  return `${currency ?? "AED"} ${amount.toLocaleString("en-US")}`;
};

export const fmtMinutes = (v?: number | null) => {
  if (v == null) return "—";
  if (v < 60) return `${v} min`;
  const h = Math.floor(v / 60);
  if (h < 48) return `${h} h ${v % 60} min`;
  return `${Math.round(h / 24)} days`;
};

export const fmtAge = (hours?: number | null) => {
  if (hours == null) return "—";
  if (hours < 1) return "< 1 h";
  if (hours < 48) return `${hours} h`;
  return `${Math.floor(hours / 24)} days`;
};

/** "PENDING_REVIEW" → "Pending Review". */
export const humanize = (v?: string | null) =>
  v
    ? v
        .toLowerCase()
        .split(/[_\s]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "—";

// ─── Layout pieces ──────────────────────────────────────────────

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
      <div>
        <h1 className="text-4xl font-serif text-luxury-black mb-2">{title}</h1>
        {subtitle && <p className="text-gray-400 font-light text-sm tracking-wide">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

const TONES = {
  slate: "bg-slate-100 text-slate-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-rose-50 text-rose-700",
  blue: "bg-blue-50 text-blue-700",
  gold: "bg-gold/10 text-[#8a6d1e]",
} as const;
export type Tone = keyof typeof TONES;

export function Pill({ children, tone = "slate", className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, Tone> = {
  APPROVED: "green",
  LIVE: "green",
  VALID: "green",
  WON: "green",
  SUBMITTED: "blue",
  PENDING_REVIEW: "amber",
  UNDER_REVIEW: "amber",
  UPLOADED: "blue",
  CHANGES_REQUIRED: "amber",
  EXPIRING: "amber",
  SCHEDULED: "blue",
  PAUSED: "slate",
  DRAFT: "slate",
  UNPUBLISHED: "slate",
  DELETED: "red",
  SOLD_OUT: "gold",
  REJECTED: "red",
  SUSPENDED: "red",
  EXPIRED: "red",
  MISSING: "red",
  LOST: "red",
  NEW: "blue",
};

export function StatusPill({ status, label }: { status?: string | null; label?: string }) {
  if (!status) return <span className="text-slate-400">—</span>;
  return <Pill tone={STATUS_TONES[status] ?? "slate"}>{label ?? humanize(status)}</Pill>;
}

export function StatTile({
  label,
  value,
  hint,
  tone = "slate",
  onClick,
  active,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: Tone;
  onClick?: () => void;
  active?: boolean;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "text-left bg-white border p-6 transition-colors",
        active ? "border-luxury-gold" : "border-gray-100",
        onClick && "hover:border-luxury-gold/60 cursor-pointer",
      )}
    >
      <p className="text-[10px] uppercase tracking-widest font-medium text-gray-500 mb-3">{label}</p>
      <p className={cn("text-3xl font-serif", tone === "red" ? "text-rose-600" : tone === "amber" ? "text-amber-600" : tone === "green" ? "text-emerald-600" : "text-slate-900")}>
        {value}
      </p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </Tag>
  );
}

// ─── Filters ────────────────────────────────────────────────────

const fieldClass =
  "h-10 px-3 border border-gray-200 bg-white text-sm text-luxury-black focus:outline-none focus:border-luxury-gold transition-colors";

export function FilterBar({ children, onReset }: { children: React.ReactNode; onReset?: () => void }) {
  return (
    <div className="bg-white border border-gray-100 p-5 mb-6">
      <div className="flex flex-wrap items-end gap-3">
        {children}
        {onReset && (
          <button
            onClick={onReset}
            className="h-10 px-4 text-[10px] font-medium uppercase tracking-[0.15em] text-gray-500 hover:text-luxury-gold transition-colors cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

export function FilterField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[10px] uppercase tracking-widest text-gray-500">{label}</span>
      {children}
    </label>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = "All",
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  allLabel?: string | null;
  className?: string;
}) {
  return (
    <FilterField label={label} className={className}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(fieldClass, "min-w-[150px]")}>
        {allLabel !== null && <option value="">{allLabel}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FilterField>
  );
}

/** Text search that reports its value 400ms after the user stops typing. */
export function SearchField({
  label = "Search",
  value,
  onChange,
  placeholder,
  className,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (draft.trim() !== value) onChange(draft.trim());
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);
  return (
    <FilterField label={label} className={className}>
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className={cn(fieldClass, "min-w-[220px]")}
      />
    </FilterField>
  );
}

export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <FilterField label={label}>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass} />
    </FilterField>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <FilterField label={label}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(fieldClass, "w-24")}
      />
    </FilterField>
  );
}

// ─── Tabs, pagination ───────────────────────────────────────────

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { key: T; label: string; count?: number }[];
  active: T;
  onChange: (key: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-x-8 gap-y-2 border-b border-gray-100", className)}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={cn(
            "-mb-px pb-3 border-b-2 text-[11px] font-medium uppercase tracking-[0.15em] transition-colors cursor-pointer",
            active === t.key ? "border-luxury-gold text-luxury-black" : "border-transparent text-gray-400 hover:text-luxury-black",
          )}
        >
          {t.label}
          {t.count != null && <span className={cn("ml-2", active === t.key ? "text-luxury-gold" : "text-gray-300")}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total?: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return total != null ? <p className="text-xs text-gray-500 mt-4">{total} result{total === 1 ? "" : "s"}</p> : null;
  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-xs text-gray-500">
        Page {page} of {totalPages}
        {total != null && ` · ${total} results`}
      </p>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="h-9 w-9 flex items-center justify-center border border-gray-200 hover:border-luxury-gold hover:text-luxury-gold transition-colors disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-inherit cursor-pointer"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="h-9 w-9 flex items-center justify-center border border-gray-200 hover:border-luxury-gold hover:text-luxury-gold transition-colors disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-inherit cursor-pointer"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Drawer and modal ───────────────────────────────────────────

/**
 * Renders popups straight into <body>, so they always cover the whole screen
 * (sidebar included) whatever page container they are declared in, and stops
 * the page behind them from scrolling.
 */
// Open popups, innermost last: Escape closes only the one on top (a decision
// dialog opened from a side panel closes first, the panel stays).
const openPopups: symbol[] = [];

function PopupPortal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const closeRef = React.useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    setMounted(true);
    const id = Symbol("popup");
    openPopups.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openPopups[openPopups.length - 1] === id) closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      openPopups.splice(openPopups.indexOf(id), 1);
      if (openPopups.length === 0) document.body.style.overflow = "";
    };
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="p-2 -mr-2 -mt-1 text-gray-400 hover:text-luxury-black transition-colors cursor-pointer"
      aria-label="Close"
    >
      <X size={20} strokeWidth={1.5} />
    </button>
  );
}

/** Side panel for a record's full details (company, listing). */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "max-w-4xl",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  if (!open) return null;
  return (
    <PopupPortal onClose={onClose}>
      <div className="fixed inset-0 z-[200] flex justify-end bg-black/50 backdrop-blur-sm animate-overlay-in" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          className={cn("h-full w-full bg-white shadow-2xl flex flex-col animate-panel-in font-satoshi", width)}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-8 pt-8 pb-6 border-b border-gray-100 flex items-start justify-between gap-6 shrink-0">
            <div className="min-w-0">
              <h2 className="text-3xl font-serif text-luxury-black truncate">{title}</h2>
              {subtitle && <div className="text-sm text-gray-500 mt-2">{subtitle}</div>}
            </div>
            <CloseButton onClose={onClose} />
          </div>
          <div className="flex-1 overflow-y-auto px-8 py-6">{children}</div>
          {footer && <div className="px-8 py-5 border-t border-gray-100 bg-white shrink-0">{footer}</div>}
        </div>
      </div>
    </PopupPortal>
  );
}

/** Centred dialog used for every confirmation and short form. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  if (!open) return null;
  return (
    <PopupPortal onClose={onClose}>
      <div
        className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-overlay-in"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          className={cn("bg-white w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 animate-dialog-in font-satoshi", width)}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-8 pt-8 pb-5 flex items-start justify-between gap-6 shrink-0">
            <div className="min-w-0">
              <h3 className="text-2xl font-serif text-luxury-black">{title}</h3>
              {description && <div className="text-sm text-gray-500 mt-2 leading-relaxed">{description}</div>}
            </div>
            <CloseButton onClose={onClose} />
          </div>
          {children && <div className="px-8 pb-2 overflow-y-auto">{children}</div>}
          {footer && <div className="px-8 py-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 shrink-0">{footer}</div>}
        </div>
      </div>
    </PopupPortal>
  );
}

/** Form field label in the site's style: small, uppercase, widely spaced. */
export function FieldLabel({
  children,
  required,
  optional,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  optional?: string | boolean;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">
      {children}
      {required && <span className="text-red-500"> *</span>}
      {optional && (
        <span className="normal-case tracking-normal text-gray-400"> ({optional === true ? "optional" : optional})</span>
      )}
    </label>
  );
}

/** Input, select and textarea styling shared by every admin form. */
export const inputClass = (hasError?: boolean) =>
  cn(
    "w-full px-4 py-3 border text-sm bg-white text-luxury-black placeholder:text-gray-300 focus:outline-none focus:border-luxury-gold transition-colors disabled:bg-gray-50 disabled:text-gray-400",
    hasError ? "border-red-400 bg-red-50" : "border-gray-200",
  );

export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-1.5">{message}</p>;
}

/**
 * Decision dialog: optional or mandatory reason shown to the partner, plus
 * an optional internal note that only platform staff can see.
 */
export function ReasonModal({
  open,
  title,
  description,
  confirmLabel,
  reasonLabel = "Reason",
  reasonRequired = true,
  withInternalNote = false,
  tone = "dark",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  reasonLabel?: string;
  reasonRequired?: boolean;
  withInternalNote?: boolean;
  tone?: "dark" | "danger" | "gold";
  onConfirm: (reason: string, internalNote: string) => Promise<boolean | void> | boolean | void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setReason("");
      setNote("");
      setError(null);
      setBusy(false);
    }
  }, [open]);

  const submit = async () => {
    if (reasonRequired && reason.trim().length < 3) {
      setError(`${reasonLabel} is required (at least 3 characters).`);
      return;
    }
    setBusy(true);
    const ok = await onConfirm(reason.trim(), note.trim());
    setBusy(false);
    if (ok !== false) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={title}
      description={description}
      footer={
        <>
          <ActionButton size="md" onClick={onClose} disabled={busy}>
            Cancel
          </ActionButton>
          <ActionButton size="md" tone={tone === "danger" ? "dangerSolid" : tone} onClick={submit} loading={busy}>
            {confirmLabel}
          </ActionButton>
        </>
      }
    >
      <FieldLabel required={reasonRequired} optional={!reasonRequired}>
        {reasonLabel}
      </FieldLabel>
      <textarea
        value={reason}
        onChange={(e) => {
          setReason(e.target.value);
          setError(null);
        }}
        rows={4}
        autoFocus
        className={cn(inputClass(!!error), "resize-none")}
      />
      <FieldError message={error} />
      {withInternalNote && (
        <div className="mt-5">
          <FieldLabel optional="staff only, never shown to the partner">Internal note</FieldLabel>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={cn(inputClass(), "resize-none")} />
        </div>
      )}
    </Modal>
  );
}

export function SectionCard({ title, actions, children, className }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white border border-gray-100 p-6", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-5 gap-3">
          {title && <h3 className="text-[10px] uppercase tracking-widest font-medium text-gray-500">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 bg-white border border-dashed border-gray-200">
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/** Small inline spinner for buttons and inline saves. */
export function InlineSpinner({ className }: { className?: string }) {
  return <span className={cn("inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin", className)} />;
}

/**
 * Button in the site's style (square, uppercase, widely spaced): the admin
 * counterpart of components/ui/Button, sized for tables and dialogs.
 */
export function ActionButton({
  children,
  onClick,
  tone = "outline",
  size = "sm",
  disabled,
  loading,
  className,
  title,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  tone?: "outline" | "dark" | "danger" | "dangerSolid" | "success" | "gold";
  size?: "sm" | "md";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  title?: string;
  type?: "button" | "submit";
}) {
  const tones = {
    outline: "bg-white border-gray-200 text-luxury-black hover:border-luxury-gold hover:text-luxury-gold",
    dark: "bg-luxury-black border-luxury-black text-white hover:bg-slate-800 hover:border-slate-800",
    gold: "bg-luxury-gold border-luxury-gold text-white hover:bg-gold-hover hover:border-gold-hover",
    success: "bg-luxury-gold border-luxury-gold text-white hover:bg-gold-hover hover:border-gold-hover",
    danger: "bg-white border-rose-200 text-rose-600 hover:bg-rose-600 hover:border-rose-600 hover:text-white",
    dangerSolid: "bg-rose-600 border-rose-600 text-white hover:bg-rose-700 hover:border-rose-700",
  };
  const sizes = {
    sm: "h-9 px-4 text-[10px]",
    md: "h-11 px-7 text-[11px]",
  };
  return (
    <button
      type={type}
      title={title}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 border font-satoshi font-medium uppercase tracking-[0.15em] whitespace-nowrap transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        sizes[size],
        tones[tone],
        className,
      )}
    >
      {loading && <InlineSpinner />}
      {children}
    </button>
  );
}

// ─── Reviewer assignment ────────────────────────────────────────

/**
 * Reviewer dropdown that saves on change. The new choice shows immediately
 * with a spinner, the control is locked until the save finishes, and it
 * reverts if the save fails.
 */
export function ReviewerSelect({
  value,
  reviewers,
  onSave,
  className,
  ariaLabel = "Assigned reviewer",
}: {
  value: string | null | undefined;
  reviewers: { id: string; name: string }[];
  onSave: (reviewerId: string | null) => Promise<boolean>;
  className?: string;
  ariaLabel?: string;
}) {
  const [current, setCurrent] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!saving) setCurrent(value ?? "");
  }, [value, saving]);

  const change = async (next: string) => {
    const previous = current;
    setCurrent(next);
    setSaving(true);
    const ok = await onSave(next || null);
    setSaving(false);
    if (!ok) setCurrent(previous);
  };

  return (
    <div className={cn("relative", className)}>
      <select
        value={current}
        disabled={saving}
        aria-label={ariaLabel}
        aria-busy={saving}
        onChange={(e) => change(e.target.value)}
        className={cn(
          "w-full h-9 pl-3 pr-9 appearance-none border border-gray-200 bg-white text-sm text-luxury-black focus:outline-none focus:border-luxury-gold transition-colors cursor-pointer disabled:cursor-wait disabled:bg-gray-50",
          saving ? "text-gray-400" : null,
        )}
      >
        <option value="">Unassigned</option>
        {reviewers.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      {saving ? (
        <InlineSpinner className="absolute right-3 top-1/2 -translate-y-1/2 text-luxury-gold pointer-events-none" />
      ) : (
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      )}
    </div>
  );
}

// ─── CSV export ─────────────────────────────────────────────────

/** Downloads a CSV from an authenticated API endpoint. */
export async function downloadCsv(endpoint: string, params: Record<string, string | number | boolean | undefined>, filename: string) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") search.append(k, String(v));
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}${search.toString() ? `?${search}` : ""}`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(res.status === 403 ? "You do not have permission to export this." : "Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Export failed");
  }
}

export function ExportButton({ onClick, label = "Export CSV" }: { onClick: () => void; label?: string }) {
  return (
    <ActionButton onClick={onClick} tone="outline" className="h-10">
      <Download size={14} />
      {label}
    </ActionButton>
  );
}

// ─── Shared option lists ────────────────────────────────────────

export const CATEGORY_OPTIONS = [
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "CARS", label: "Cars" },
  { value: "YACHTS", label: "Yachts" },
  { value: "PRIVATE_AVIATION", label: "Private Aviation" },
  { value: "COLLECTIBLES", label: "Collectibles" },
];

export const OFFERING_OPTIONS = [
  { value: "SALE", label: "For Sale" },
  { value: "LONG_TERM_RENT", label: "Long-Term Rent" },
  { value: "SHORT_TERM_RENT", label: "Short-Term Rent" },
  { value: "OFF_PLAN", label: "Off-Plan" },
  { value: "CHARTER", label: "Charter" },
  { value: "PRICE_ON_REQUEST", label: "Price on Request" },
];

const ASSET_TYPE_LABEL_OVERRIDES: Record<string, string> = {
  SUV: "SUV",
  WINE_SPIRITS: "Wine & Spirits",
  COINS_STAMPS: "Coins & Stamps",
};

export const ASSET_TYPE_OPTIONS = [
  "APARTMENT", "VILLA", "TOWNHOUSE", "PENTHOUSE", "OFFICE", "RETAIL", "WAREHOUSE", "LAND",
  "SEDAN", "SUV", "SPORTS_CAR", "CONVERTIBLE", "TRUCK", "VAN", "MOTORCYCLE",
  "MOTOR_YACHT", "SAILING_YACHT", "SUPER_YACHT", "SPEED_BOAT", "CATAMARAN",
  "JET", "HELICOPTER", "TURBOPROP",
  "WATCH", "ART", "JEWELLERY", "HANDBAG", "WINE_SPIRITS", "COINS_STAMPS", "OTHER_COLLECTIBLE",
].map((v) => ({ value: v, label: ASSET_TYPE_LABEL_OVERRIDES[v] ?? humanize(v) }));

const APPROVAL_LABELS: Record<string, string> = { SUBMITTED: "Pending review", PENDING_REVIEW: "In review" };
export const APPROVAL_OPTIONS = ["DRAFT", "SUBMITTED", "PENDING_REVIEW", "CHANGES_REQUIRED", "APPROVED", "REJECTED"].map((v) => ({
  value: v,
  label: APPROVAL_LABELS[v] ?? humanize(v),
}));

export const PUBLICATION_OPTIONS = ["UNPUBLISHED", "SCHEDULED", "LIVE", "PAUSED", "EXPIRED", "SOLD_OUT", "DELETED"].map((v) => ({
  value: v,
  label: humanize(v),
}));

export const COMPANY_STATUS_OPTIONS = ["DRAFT", "SUBMITTED", "PENDING_REVIEW", "CHANGES_REQUIRED", "APPROVED", "REJECTED", "SUSPENDED"].map((v) => ({
  value: v,
  label: humanize(v),
}));

export const LEAD_STAGE_OPTIONS = ["NEW", "CONTACTED", "QUALIFIED", "APPOINTMENT", "NEGOTIATION", "WON", "LOST"].map((v) => ({
  value: v,
  label: humanize(v),
}));

export const DOCUMENT_LABELS: Record<string, string> = {
  trade_license: "Real estate trade license",
  rera_license: "RERA license",
  emirates_id: "Owner Emirates ID",
  passport: "Owner passport",
  car_trade_license: "Car trade license",
  car_dealer_license: "Car dealer license",
  showroom_registration: "Showroom registration",
  marine_trade_license: "Marine trade license",
  boat_dealer_certificate: "Boat dealer certificate",
  aviation_dealer_license: "Aviation dealer license",
  aoc_operator_document: "AOC / operator document",
  collectibles_trade_license: "Collectibles trade license",
  consignment_authority: "Ownership / consignment authority",
};
