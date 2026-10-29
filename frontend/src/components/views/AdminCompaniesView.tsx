"use client";

function DocumentLink({
  href,
  label,
  value,
}: {
  href?: string;
  label: string;
  value?: string;
}) {
  if (!href && !value) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-gold/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-gold transition-colors">
          <FileText size={18} />
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
            {label}
          </span>
          <span className="text-xs font-bold text-slate-900">
            {value || "Uploaded Document"}
          </span>
        </div>
      </div>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold/10 text-slate-400 hover:text-gold transition-all"
        >
          <ExternalLink size={16} />
        </a>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { AdminService } from "@/services/admin.service";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Eye,
  Building2,
  Mail,
  Calendar,
  ShieldCheck,
  FileText,
  UserCheck,
  Car,
  Anchor,
  Plane,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import {
  CompanyCategory,
  CompanyStatus,
  COMPANY_STATUS_AWAITING_DECISION,
} from "@/types/enums";

const STATUS_FILTERS = [
  "ALL",
  CompanyStatus.SUBMITTED,
  CompanyStatus.PENDING_REVIEW,
  CompanyStatus.CHANGES_REQUIRED,
  CompanyStatus.APPROVED,
  CompanyStatus.REJECTED,
  CompanyStatus.SUSPENDED,
] as const;

export default function AdminCompaniesView() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [reasonModalAction, setReasonModalAction] = useState<
    typeof CompanyStatus.REJECTED | typeof CompanyStatus.CHANGES_REQUIRED
  >(CompanyStatus.REJECTED);

  const fetchCompanies = async () => {
    setLoading(true);
    const response = await AdminService.getCompanies(
      filter === "ALL" ? "" : filter,
    );
    if (response.success) {
      setCompanies((response.data as any)?.companies || response.data || []);
    } else {
      toast.error(response.error || "Failed to fetch companies");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, [filter]);

  const handleStatusUpdate = async (
    id: string,
    status: string,
    reason?: string,
  ) => {
    const response = await AdminService.updateCompanyStatus(id, status, reason);
    if (response.success) {
      toast.success(`Company ${status.toLowerCase()} successfully`);
      fetchCompanies();
      setSelectedCompany(null);
    } else {
      toast.error(response.error || "Failed to update status");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case CompanyStatus.APPROVED:
        return <CheckCircle2 className="text-emerald-500" size={16} />;
      case CompanyStatus.REJECTED:
      case CompanyStatus.SUSPENDED:
        return <XCircle className="text-rose-500" size={16} />;
      case CompanyStatus.CHANGES_REQUIRED:
        return <Clock className="text-orange-500" size={16} />;
      default:
        return <Clock className="text-amber-500" size={16} />;
    }
  };

  const STATUS_LABELS: Record<string, string> = {
    [CompanyStatus.DRAFT]: "Draft",
    [CompanyStatus.SUBMITTED]: "Submitted",
    [CompanyStatus.PENDING_REVIEW]: "Pending Review",
    [CompanyStatus.CHANGES_REQUIRED]: "Changes Required",
    [CompanyStatus.APPROVED]: "Approved",
    [CompanyStatus.REJECTED]: "Rejected",
    [CompanyStatus.SUSPENDED]: "Suspended",
  };

  const getStatusBadge = (status: string) => {
    const base =
      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit";
    const tone =
      status === CompanyStatus.APPROVED
        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
        : status === CompanyStatus.REJECTED || status === CompanyStatus.SUSPENDED
          ? "bg-rose-50 text-rose-700 border border-rose-100"
          : status === CompanyStatus.CHANGES_REQUIRED
            ? "bg-orange-50 text-orange-700 border border-orange-100"
            : "bg-amber-50 text-amber-700 border border-amber-100";

    return (
      <span className={cn(base, tone)}>
        {getStatusIcon(status)} {STATUS_LABELS[status] ?? status}
      </span>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case CompanyCategory.REAL_ESTATE:
        return <Home size={14} className="text-gold" />;
      case CompanyCategory.CARS:
        return <Car size={14} className="text-blue-500" />;
      case CompanyCategory.YACHTS:
        return <Anchor size={14} className="text-indigo-500" />;
      case CompanyCategory.PRIVATE_AVIATION:
        return <Plane size={14} className="text-purple-500" />;
      default:
        return <FileText size={14} className="text-slate-400" />;
    }
  };

  const getCategoryDocs = (category: string, company: any) => {
    switch (category) {
      case CompanyCategory.REAL_ESTATE:
        return [
          company.reraLicenseUrl
            ? { label: "RERA License", url: company.reraLicenseUrl }
            : null,
          company.brn ? { label: "BRN Number", value: company.brn } : null,
        ].filter(Boolean);
      case CompanyCategory.CARS:
        return [
          company.carDealerLicenseUrl
            ? { label: "Car Dealer License", url: company.carDealerLicenseUrl }
            : null,
          company.showroomRegistrationUrl
            ? {
                label: "Showroom Registration",
                url: company.showroomRegistrationUrl,
              }
            : null,
        ].filter(Boolean);
      case CompanyCategory.YACHTS:
        return [
          company.marineTradeLicenseUrl
            ? {
                label: "Marine Trade License",
                url: company.marineTradeLicenseUrl,
              }
            : null,
          company.boatDealerCertificateUrl
            ? {
                label: "Boat Dealer Certificate",
                url: company.boatDealerCertificateUrl,
              }
            : null,
        ].filter(Boolean);
      case CompanyCategory.PRIVATE_AVIATION:
        return [
          company.aviationDealerLicenseUrl
            ? {
                label: "Aviation Dealer License",
                url: company.aviationDealerLicenseUrl,
              }
            : null,
          company.aocOperatorDocumentUrl
            ? {
                label: "AOC Operator Document",
                url: company.aocOperatorDocumentUrl,
              }
            : null,
        ].filter(Boolean);
      default:
        return [];
    }
  };

  const columns: DataTableColumn<any>[] = [
    {
      header: "Company",
      render: (company) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
            {company.companyLogoUrl ? (
              <img
                src={company.companyLogoUrl}
                alt=""
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Building2 size={20} />
            )}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">
              {company.name}
            </div>
            <div className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
              <Mail size={12} /> {company.contactEmail}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Categories",
      render: (company) => (
        <div className="flex flex-wrap gap-1.5">
          {company.categories?.map((cat: string) => (
            <span
              key={cat}
              className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold tracking-wider uppercase"
            >
              {cat.replace("_", " ")}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: "Created At",
      render: (company) => (
        <div className="text-slate-900 text-xs font-medium">
          {new Date(company.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Status",
      render: (company) => getStatusBadge(company.status),
    },
    {
      header: "Actions",
      align: "right",
      render: (company) => (
        <button
          onClick={() => setSelectedCompany(company)}
          className="p-2 hover:bg-white hover:shadow-md rounded-lg transition-all text-slate-400 hover:text-gold"
        >
          <Eye size={18} />
        </button>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-canela text-slate-900 mb-2">
            Company Management
          </h1>
          <p className="text-slate-500 font-satoshi">
            Review and approve business applications
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f === "ALL" ? "" : f)}
                className={cn(
                  "px-4 py-2 text-[10px] font-bold tracking-widest uppercase rounded-lg transition-all",
                  filter === f || (f === "ALL" && !filter)
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {f === "ALL" ? "All" : STATUS_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={companies}
        rowKey={(company) => company.id}
        isLoading={loading}
        emptyIcon={
          <Building2 className="mx-auto text-slate-300 mb-4" size={48} />
        }
        emptyMessage="No companies found with this status"
      />

      {/* Detail Modal/Drawer */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-99 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-gold">
                  {selectedCompany.companyLogoUrl ? (
                    <img
                      src={selectedCompany.companyLogoUrl}
                      alt=""
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <Building2 size={28} />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-canela text-slate-900">
                    {selectedCompany.name}
                  </h2>
                  <p className="text-slate-500 text-sm flex items-center gap-1.5">
                    <Mail size={14} /> {selectedCompany.contactEmail} •{" "}
                    <Calendar size={14} />{" "}
                    {new Date(selectedCompany.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto grow">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <section className="space-y-8">
                    {/* 1. Identity Verification */}
                    <div>
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4 flex items-center gap-2">
                        <UserCheck size={14} className="text-gold" /> Identity
                        Verification
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {selectedCompany.emiratesIdUrl && (
                          <DocumentLink
                            href={selectedCompany.emiratesIdUrl}
                            label="Emirates ID"
                          />
                        )}
                        {selectedCompany.passportUrl && (
                          <DocumentLink
                            href={selectedCompany.passportUrl}
                            label="Passport Copy"
                          />
                        )}
                      </div>
                    </div>

                    {/* 2. SHARED Business Document */}
                    {selectedCompany.tradeLicenseUrl && (
                      <div>
                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4 flex items-center gap-2">
                          <ShieldCheck size={14} className="text-gold" />{" "}
                          General Business
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          <DocumentLink
                            href={selectedCompany.tradeLicenseUrl}
                            label="Trade License"
                          />
                        </div>
                      </div>
                    )}

                    {/* 3. Category Specific */}
                    {selectedCompany.categories?.map((category: string) => {
                      const docs = getCategoryDocs(category, selectedCompany);
                      if (docs.length === 0) return null;

                      return (
                        <div key={category}>
                          <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4 flex items-center gap-2">
                            {getCategoryIcon(category)}{" "}
                            {category.replace("_", " ")} Documents
                          </h3>
                          <div className="grid grid-cols-1 gap-3">
                            {docs.map((doc: any, idx: number) => (
                              <DocumentLink
                                key={idx}
                                href={doc.url}
                                label={doc.label}
                                value={doc.value}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </section>
                </div>

                <div className="space-y-8">
                  <section>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4 flex items-center gap-2">
                      <Building2 size={14} className="text-gold" /> Company
                      Profile Details
                    </h3>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                      <div>
                        <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                          Description
                        </label>
                        <p className="text-sm text-slate-800 font-satoshi mt-1 leading-relaxed">
                          {selectedCompany.description}
                        </p>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                          Address
                        </label>
                        <p className="text-sm text-slate-800 font-satoshi mt-1">
                          {selectedCompany.address}
                        </p>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                          Website
                        </label>
                        <a
                          href={selectedCompany.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-gold hover:underline block mt-1"
                        >
                          {selectedCompany.websiteUrl}
                        </a>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {COMPANY_STATUS_AWAITING_DECISION.includes(selectedCompany.status) && (
              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-4 shrink-0">
                <button
                  onClick={() => {
                    setReasonModalAction(CompanyStatus.REJECTED);
                    setIsRejectionModalOpen(true);
                  }}
                  className="px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-all"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => {
                    setReasonModalAction(CompanyStatus.CHANGES_REQUIRED);
                    setIsRejectionModalOpen(true);
                  }}
                  className="px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest text-orange-600 hover:bg-orange-50 transition-all"
                >
                  Request Changes
                </button>
                <button
                  onClick={() =>
                    handleStatusUpdate(
                      selectedCompany.id,
                      CompanyStatus.APPROVED,
                    )
                  }
                  className="px-10 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  Approve Company
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {isRejectionModalOpen && selectedCompany && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in font-satoshi">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-xl font-canela text-slate-900 mb-2 font-bold">
                {reasonModalAction === CompanyStatus.REJECTED
                  ? "Reject Application"
                  : "Request Changes"}
              </h3>
              <p className="text-slate-500 text-xs font-satoshi leading-relaxed">
                Please provide a reason{" "}
                {reasonModalAction === CompanyStatus.REJECTED
                  ? "for rejecting"
                  : "the changes needed from"}{" "}
                <span className="font-bold text-slate-900">
                  {selectedCompany.name}
                </span>
                . This message will be sent to the owner.
              </p>
            </div>

            <div className="p-8">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={
                  reasonModalAction === CompanyStatus.REJECTED
                    ? "Reason for rejection (e.g., Missing documents, invalid business name...)"
                    : "What needs to change (e.g., Trade license is expired, re-upload a valid copy)..."
                }
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all min-h-[140px] font-satoshi text-sm bg-slate-50/50 placeholder:text-slate-400"
                autoFocus
              />
            </div>

            <div className="p-8 bg-slate-50/30 flex items-center gap-4">
              <button
                onClick={() => {
                  setIsRejectionModalOpen(false);
                  setRejectionReason("");
                }}
                disabled={isUpdatingStatus}
                className="flex-1 py-4 px-4 rounded-xl text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!rejectionReason.trim()) {
                    toast.error("Please provide a reason");
                    return;
                  }
                  setIsUpdatingStatus(true);
                  await handleStatusUpdate(
                    selectedCompany.id,
                    reasonModalAction,
                    rejectionReason,
                  );
                  setIsUpdatingStatus(false);
                  setIsRejectionModalOpen(false);
                  setRejectionReason("");
                }}
                disabled={isUpdatingStatus || !rejectionReason.trim()}
                className="flex-[2] py-4 px-4 bg-rose-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {isUpdatingStatus
                  ? "Saving..."
                  : reasonModalAction === CompanyStatus.REJECTED
                    ? "Confirm Rejection"
                    : "Send Change Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
