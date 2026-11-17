"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Upload } from "lucide-react";
import { toast } from "sonner";
import AuthGuard from "@/components/auth/AuthGuard";
import { invalidateCompanyStatus } from "@/components/layout/AdminPanelLayout";
import {
  ActionButton,
  CATEGORY_OPTIONS,
  DOCUMENT_LABELS,
  FieldError,
  FieldLabel,
  Spinner,
  fmtDate,
  inputClass,
} from "@/components/admin/AdminUI";
import { CompanyService } from "@/services/company.service";
import { UploadService } from "@/services/upload.service";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils/cn";
import { COMPANY_ROLES } from "@/types/enums";

/** Documents each category needs (backend upload field names). */
const CATEGORY_DOCUMENTS: Record<string, string[]> = {
  REAL_ESTATE: ["tradeLicense", "reraLicense"],
  CARS: ["carTradeLicense", "carDealerLicense", "showroomRegistration"],
  YACHTS: ["marineTradeLicense", "boatDealerCertificate"],
  PRIVATE_AVIATION: ["aviationDealerLicense", "aocOperatorDocument"],
  COLLECTIBLES: ["collectiblesTradeLicense", "consignmentAuthority"],
};
const OWNER_DOCUMENTS = ["emiratesId", "passport"];
const LANGUAGES = ["English", "Arabic", "Hindi", "Urdu", "Russian", "French", "German", "Chinese", "Italian", "Spanish"];

const toSnake = (f: string) => f.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toInputDate = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : "");

type DocDetails = { documentNumber: string; issuingAuthority: string; issueDate: string; expiryDate: string };

export default function RegistrationPage() {
  return (
    <AuthGuard allowedRoles={COMPANY_ROLES}>
      <EditRegistration />
    </AuthGuard>
  );
}

/**
 * The company owner corrects the registration the platform sent back
 * ("changes required") and resubmits it for review.
 */
function EditRegistration() {
  const router = useRouter();
  const { data: session } = useSession();
  const isOwner = (session?.user as any)?.role === "company_owner";
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    websiteUrl: "",
    categories: [] as string[],
    languages: [] as string[],
  });
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [details, setDetails] = useState<Record<string, DocDetails>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    CompanyService.getMyCompany().then((res) => {
      const c = res.success ? res.data : null;
      setCompany(c);
      if (c) {
        setForm({
          name: c.name ?? "",
          description: c.description ?? "",
          address: c.address ?? "",
          contactEmail: c.contactEmail ?? "",
          contactPhone: c.contactPhone ?? "",
          websiteUrl: c.websiteUrl ?? "",
          categories: c.categories ?? [],
          languages: c.languages ?? [],
        });
        const d: Record<string, DocDetails> = {};
        for (const doc of c.documents ?? []) {
          d[doc.documentType] = {
            documentNumber: doc.documentNumber ?? "",
            issuingAuthority: doc.issuingAuthority ?? "",
            issueDate: toInputDate(doc.issueDate),
            expiryDate: toInputDate(doc.expiryDate),
          };
        }
        setDetails(d);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;
  if (!company) {
    return <Notice title="No company found" text="This account is not linked to a company." />;
  }
  if (company.status !== "CHANGES_REQUIRED") {
    return (
      <Notice
        title="Nothing to update"
        text="The registration can only be changed when the platform has asked for changes."
        action={<Link href="/dashboard" className="text-luxury-gold text-sm">Go to your dashboard</Link>}
      />
    );
  }
  if (!isOwner) {
    return <Notice title="Owner only" text="Only the company owner can update and resubmit the registration." />;
  }

  const docsByType = new Map<string, any>((company.documents ?? []).map((d: any) => [d.documentType, d]));
  const neededFields = [...new Set([...form.categories.flatMap((c) => CATEGORY_DOCUMENTS[c] ?? []), ...OWNER_DOCUMENTS])];
  // Also show documents already on file for categories no longer selected.
  const shownFields = [
    ...neededFields,
    ...Object.values(CATEGORY_DOCUMENTS)
      .flat()
      .filter((f) => !neededFields.includes(f) && docsByType.has(toSnake(f))),
  ];

  const set = (key: keyof typeof form, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };
  const toggle = (key: "categories" | "languages", value: string) =>
    set(key, form[key].includes(value) ? form[key].filter((v) => v !== value) : [...form[key], value]);
  const setDetail = (type: string, key: keyof DocDetails, value: string) => {
    setDetails((d) => ({
      ...d,
      [type]: { ...(d[type] ?? { documentNumber: "", issuingAuthority: "", issueDate: "", expiryDate: "" }), [key]: value },
    }));
    setErrors((e) => ({ ...e, [`doc_${type}`]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Company name is required.";
    if (form.description.trim().length < 10) e.description = "Description should be at least 10 characters.";
    if (form.address.trim().length < 5) e.address = "Address must be at least 5 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) e.contactEmail = "Enter a valid email address.";
    if (form.contactPhone.trim().length < 5) e.contactPhone = "Contact phone must be at least 5 characters.";
    if (form.websiteUrl.trim() && !/^https?:\/\/\S+\.\S+/.test(form.websiteUrl.trim()))
      e.websiteUrl = "Website must be a valid URL (including https://).";
    if (form.categories.length === 0) e.categories = "Choose at least one category.";
    if (form.languages.length === 0) e.languages = "Choose at least one language.";
    for (const field of neededFields) {
      const type = toSnake(field);
      if (!docsByType.has(type) && !files[field]) e[`doc_${type}`] = `${DOCUMENT_LABELS[type] ?? type} is required.`;
      const d = details[type];
      if (d?.issueDate && d?.expiryDate && d.expiryDate <= d.issueDate) e[`doc_${type}`] = "Expiry date must be after the issue date.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: form.name.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        websiteUrl: form.websiteUrl.trim(),
        categories: form.categories,
        languages: form.languages,
        documentDetails: {} as Record<string, any>,
      };
      for (const field of shownFields) {
        const type = toSnake(field);
        const file = files[field];
        if (file) {
          const up = await UploadService.uploadImage(file, { documents: true, context: "company-document" });
          payload[`${field}UploadId`] = up.uploadId;
        }
        const d = details[type];
        if (d && (file || docsByType.has(type))) {
          payload.documentDetails[field] = {
            documentNumber: d.documentNumber.trim() || undefined,
            issuingAuthority: d.issuingAuthority.trim() || undefined,
            issueDate: d.issueDate || undefined,
            expiryDate: d.expiryDate || undefined,
          };
        }
      }
      const res = await CompanyService.resubmitRegistration(payload);
      if (!res.success) {
        if (res.fieldErrors) setErrors(res.fieldErrors as Record<string, string>);
        toast.error(res.error || "Could not resubmit the registration");
        return;
      }
      toast.success("Registration resubmitted", { description: "It is back with the platform team for review." });
      invalidateCompanyStatus();
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "A file could not be uploaded");
    } finally {
      setSaving(false);
    }
  };

  const text = (key: keyof typeof form, label: string, opts: { type?: string; placeholder?: string } = {}) => (
    <div>
      <FieldLabel required={key !== "websiteUrl"} optional={key === "websiteUrl"}>{label}</FieldLabel>
      <input
        type={opts.type ?? "text"}
        value={form[key] as string}
        placeholder={opts.placeholder}
        onChange={(e) => set(key, e.target.value)}
        className={inputClass(!!errors[key])}
      />
      <FieldError message={errors[key]} />
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in-up">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 hover:text-luxury-black mb-8">
          <ArrowLeft size={14} /> Back
        </Link>
        <h1 className="text-4xl font-serif text-luxury-black mb-2">Update your registration</h1>
        <p className="text-gray-400 font-light text-sm tracking-wide mb-8">
          Make the changes the platform team asked for, then resubmit. Your company goes back into review.
        </p>

        {company.rejectionReason && (
          <div className="mb-10 border-l-2 border-amber-500 bg-amber-50/60 px-6 py-5">
            <p className="text-[10px] uppercase tracking-widest text-amber-700 mb-1">Changes requested</p>
            <p className="text-sm text-luxury-black whitespace-pre-wrap">{company.rejectionReason}</p>
          </div>
        )}

        <Section title="Company">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {text("name", "Company name")}
            {text("websiteUrl", "Website", { placeholder: "https://" })}
            <div className="md:col-span-2">
              <FieldLabel required>Description</FieldLabel>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className={cn(inputClass(!!errors.description), "resize-none")}
              />
              <FieldError message={errors.description} />
            </div>
            <div className="md:col-span-2">{text("address", "Address")}</div>
            {text("contactEmail", "Contact email", { type: "email" })}
            {text("contactPhone", "Contact phone")}
          </div>
        </Section>

        <Section title="Categories and languages">
          <FieldLabel required>Categories</FieldLabel>
          <Chips options={CATEGORY_OPTIONS} selected={form.categories} onToggle={(v) => toggle("categories", v)} />
          <FieldError message={errors.categories} />
          <div className="mt-6">
            <FieldLabel required>Languages</FieldLabel>
            <Chips
              options={[...new Set([...LANGUAGES, ...form.languages])].map((l) => ({ value: l, label: l }))}
              selected={form.languages}
              onToggle={(v) => toggle("languages", v)}
            />
            <FieldError message={errors.languages} />
          </div>
        </Section>

        <Section title="Documents">
          <p className="text-sm text-gray-500 mb-6">
            Upload a new file only for the documents you need to replace. Details can be corrected without a new file.
          </p>
          <div className="space-y-5">
            {shownFields.map((field) => {
              const type = toSnake(field);
              const doc = docsByType.get(type);
              const d = details[type] ?? { documentNumber: "", issuingAuthority: "", issueDate: "", expiryDate: "" };
              const file = files[field];
              const required = neededFields.includes(field);
              return (
                <div key={field} className={cn("border p-6", errors[`doc_${type}`] ? "border-red-300" : "border-gray-100")}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                    <div>
                      <p className="font-serif text-xl text-luxury-black">
                        {DOCUMENT_LABELS[type] ?? type}
                        {required && <span className="text-red-500 text-sm"> *</span>}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {file ? `New file: ${file.name}` : doc ? `Uploaded ${fmtDate(doc.createdAt)}` : "Not uploaded yet"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {doc?.viewUrl && !file && (
                        <a
                          href={doc.viewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 h-9 px-4 border border-gray-200 text-[10px] font-medium uppercase tracking-[0.15em] text-luxury-black hover:border-luxury-gold hover:text-luxury-gold transition-colors"
                        >
                          View <ExternalLink size={12} />
                        </a>
                      )}
                      <label className="inline-flex items-center gap-1.5 h-9 px-4 border border-luxury-black bg-luxury-black text-white text-[10px] font-medium uppercase tracking-[0.15em] cursor-pointer hover:bg-slate-800 transition-colors">
                        <Upload size={12} /> {doc || file ? "Replace" : "Upload"}
                        <input
                          type="file"
                          accept="application/pdf,image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            if (f && f.size > 5 * 1024 * 1024) {
                              toast.error("File must be 5 MB or smaller");
                              return;
                            }
                            setFiles((x) => ({ ...x, [field]: f }));
                            setErrors((er) => ({ ...er, [`doc_${type}`]: "" }));
                          }}
                        />
                      </label>
                      {file && (
                        <button
                          type="button"
                          className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-luxury-black"
                          onClick={() => setFiles((x) => ({ ...x, [field]: null }))}
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  </div>
                  {(doc || file) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                      <div>
                        <FieldLabel optional>Document number</FieldLabel>
                        <input className={inputClass()} value={d.documentNumber} onChange={(e) => setDetail(type, "documentNumber", e.target.value)} />
                      </div>
                      <div>
                        <FieldLabel optional>Issuing authority</FieldLabel>
                        <input className={inputClass()} value={d.issuingAuthority} onChange={(e) => setDetail(type, "issuingAuthority", e.target.value)} />
                      </div>
                      <div>
                        <FieldLabel optional>Issue date</FieldLabel>
                        <input type="date" className={inputClass()} value={d.issueDate} onChange={(e) => setDetail(type, "issueDate", e.target.value)} />
                      </div>
                      <div>
                        <FieldLabel optional>Expiry date</FieldLabel>
                        <input type="date" className={inputClass()} value={d.expiryDate} onChange={(e) => setDetail(type, "expiryDate", e.target.value)} />
                      </div>
                    </div>
                  )}
                  <FieldError message={errors[`doc_${type}`]} />
                </div>
              );
            })}
          </div>
        </Section>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-8 border-t border-gray-100">
          <ActionButton size="md" onClick={() => router.push("/dashboard")} disabled={saving}>
            Cancel
          </ActionButton>
          <ActionButton size="md" tone="gold" onClick={submit} loading={saving}>
            {saving ? "Resubmitting" : "Resubmit for review"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-[10px] uppercase tracking-widest font-medium text-gray-500 mb-5 pb-3 border-b border-gray-100">{title}</h2>
      {children}
    </section>
  );
}

function Chips({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.value)}
            aria-pressed={on}
            className={cn(
              "h-9 px-4 border text-[10px] font-medium uppercase tracking-[0.15em] transition-colors cursor-pointer",
              on ? "border-luxury-gold bg-luxury-gold text-white" : "border-gray-200 text-gray-500 hover:border-luxury-gold hover:text-luxury-black",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Notice({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center border border-gray-100 p-12">
        <h1 className="text-2xl font-serif text-luxury-black mb-3">{title}</h1>
        <p className="text-sm text-gray-500 mb-6">{text}</p>
        {action}
      </div>
    </div>
  );
}
