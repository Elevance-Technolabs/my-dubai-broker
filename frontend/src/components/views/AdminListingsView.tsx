"use client";

import { useEffect, useState } from "react";
import { AdminService } from "@/services/admin.service";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Building2,
  Mail,
  Car,
  Anchor,
  Plane,
  Home,
  FileText,
  DollarSign,
  Phone,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import AdminListingCard from "@/components/admin/AdminListingCard";
import { computeCompleteness, formatListingPrice } from "@/lib/utils/listingCompleteness";
import { AssetType } from "@/types/listing";
import {
  CompanyCategory,
  ApprovalStatus,
  LISTING_APPROVAL_AWAITING_DECISION,
} from "@/types/enums";

const STATUS_FILTERS = [
  "ALL",
  ApprovalStatus.SUBMITTED,
  ApprovalStatus.PENDING_REVIEW,
  ApprovalStatus.CHANGES_REQUIRED,
  ApprovalStatus.APPROVED,
  ApprovalStatus.REJECTED,
] as const;

const STATUS_LABELS: Record<string, string> = {
  [ApprovalStatus.DRAFT]: "Draft",
  [ApprovalStatus.SUBMITTED]: "Submitted",
  [ApprovalStatus.PENDING_REVIEW]: "Pending Review",
  [ApprovalStatus.CHANGES_REQUIRED]: "Changes Required",
  [ApprovalStatus.APPROVED]: "Approved",
  [ApprovalStatus.REJECTED]: "Rejected",
};

export default function AdminListingsView() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [reasonModalAction, setReasonModalAction] = useState<
    typeof ApprovalStatus.REJECTED | typeof ApprovalStatus.CHANGES_REQUIRED
  >(ApprovalStatus.REJECTED);

  // Debounce the search box so we don't fire a request on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const fetchListings = async () => {
    setLoading(true);
    // map ALL to empty string for API
    const response = await AdminService.getListings(
      filter === "ALL" ? "" : filter,
      search,
    );
    if (response.success && response.data) {
      setListings(response.data.listings || response.data || []);
    } else {
      toast.error(response.error || "Failed to fetch listings");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, [filter, search]);

  const handleStatusUpdate = async (
    id: string,
    status: string,
    reason?: string,
  ): Promise<boolean> => {
    const response = await AdminService.updateListingStatus(id, status, reason);
    if (response.success) {
      toast.success(`Listing ${status.toLowerCase()} successfully`);
      fetchListings();
      setSelectedListing(null);
      return true;
    } else {
      toast.error(response.error || "Failed to update status");
      return false;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case ApprovalStatus.APPROVED:
        return <CheckCircle2 className="text-emerald-500" size={16} />;
      case ApprovalStatus.REJECTED:
        return <XCircle className="text-rose-500" size={16} />;
      case ApprovalStatus.CHANGES_REQUIRED:
        return <Clock className="text-orange-500" size={16} />;
      default:
        return <Clock className="text-amber-500" size={16} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const base =
      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit";
    const tone =
      status === ApprovalStatus.APPROVED
        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
        : status === ApprovalStatus.REJECTED
          ? "bg-rose-50 text-rose-700 border border-rose-100"
          : status === ApprovalStatus.CHANGES_REQUIRED
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
      case AssetType.REAL_ESTATE:
        return <Home size={14} className="text-gold" />;
      case AssetType.CAR:
      case CompanyCategory.CARS:
        return <Car size={14} className="text-blue-500" />;
      case AssetType.YACHT:
      case CompanyCategory.YACHTS:
        return <Anchor size={14} className="text-indigo-500" />;
      case AssetType.JET:
      case AssetType.HELICOPTER:
      case CompanyCategory.PRIVATE_AVIATION:
        return <Plane size={14} className="text-purple-500" />;
      default:
        return <FileText size={14} className="text-slate-400" />;
    }
  };

  const renderSpecifications = (listing: any) => {
    const d = listing.details ?? {};
    const yn = (v: boolean) => (v ? "Yes" : "No");
    const candidates: [string, any][] =
      listing.category === CompanyCategory.CARS
        ? [["Make", d.make], ["Model", d.model], ["Year", d.year], ["Mileage", d.mileage != null ? `${d.mileage} km` : null], ["Condition", d.condition], ["Transmission", d.transmission]]
        : listing.category === CompanyCategory.YACHTS
          ? [["Builder", d.builder], ["Model", d.model], ["Year", d.year], ["Length", d.lengthFt != null ? `${d.lengthFt} ft` : null], ["Cabins", d.cabins]]
          : listing.category === CompanyCategory.PRIVATE_AVIATION
            ? [["Manufacturer", d.manufacturer], ["Model", d.model], ["Year", d.year], ["Passengers", d.passengerCapacity], ["Total hours", d.totalHours]]
            : listing.category === CompanyCategory.REAL_ESTATE
              ? [["Property type", d.propertyType], ["Bedrooms", d.bedrooms], ["Bathrooms", d.bathrooms], ["Built-up area", d.builtUpArea != null ? `${d.builtUpArea} sqft` : null], ["Furnished", d.furnished != null ? yn(d.furnished) : null]]
              : [["Maker / Artist", d.makerOrArtist], ["Year", d.year], ["Condition", d.condition]];

    const specs = candidates
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([label, value]) => ({ label, value }));

    if (specs.length === 0) return null;

    return (
      <section>
        <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4 flex items-center gap-2">
          <FileText size={14} className="text-gold" /> Specifications
        </h3>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-2 gap-4">
          {specs.map((spec, i) => (
            <div key={i}>
              <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                {spec.label}
              </label>
              <p className="text-sm text-slate-800 font-medium mt-1">{spec.value}</p>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-canela text-slate-900 mb-2">
            Listings
          </h1>
          <p className="text-slate-500 font-satoshi">
            Review, approve, and manage every listing on the platform
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search title, ref, or company..."
              className="pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-gold transition-colors bg-white w-full sm:w-64"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 text-[10px] font-bold tracking-widest uppercase rounded-lg transition-all whitespace-nowrap",
                  filter === f
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

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-24">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-400 text-sm">No listings found with this status</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {listings.map((listing) => (
            <AdminListingCard
              key={listing.id}
              listing={listing}
              onOpen={() => setSelectedListing(listing)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal/Drawer */}
      {selectedListing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-99 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-gold">
                  {getCategoryIcon(selectedListing.assetType)}
                </div>
                <div>
                  <h2 className="text-2xl font-canela text-slate-900">
                    {selectedListing.title}
                  </h2>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
                    {selectedListing.company?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto grow bg-slate-50/30">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Visuals */}
                <div className="space-y-6">
                  {selectedListing.media?.photos?.[0] ? (
                    <div className="aspect-4/3 rounded-3xl overflow-hidden shadow-sm">
                      <img
                        src={selectedListing.media.photos[0]}
                        alt="Main"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-4/3 rounded-3xl bg-slate-100 flex items-center justify-center">
                      <FileText className="text-slate-300" size={64} />
                    </div>
                  )}
                  {selectedListing.media?.photos?.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                      {selectedListing.media.photos
                        .slice(1, 5)
                        .map((img: string, i: number) => (
                          <div
                            key={i}
                            className="aspect-square rounded-xl overflow-hidden shadow-sm"
                          >
                            <img
                              src={img}
                              alt={`Thumb ${i}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-8">
                  <section>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4 flex items-center gap-2">
                      <DollarSign size={14} className="text-gold" /> Pricing &
                      Overview
                    </h3>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                      <div>
                        <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                          Asking Price
                        </label>
                        <p className="text-xl text-slate-900 font-serif mt-1">
                          {formatListingPrice(selectedListing.pricing)}
                        </p>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                          Description
                        </label>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed line-clamp-6">
                          {selectedListing.description}
                        </p>
                      </div>
                    </div>
                  </section>

                  {renderSpecifications(selectedListing)}

                  {(() => {
                    const c = computeCompleteness(selectedListing);
                    return (
                      <section>
                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4 flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-gold" /> Completeness {c.score}/100 · {c.rating}
                        </h3>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                          {c.checks.map((ch) => (
                            <div key={ch.label} className="flex items-center justify-between text-sm">
                              <span className={ch.earned === ch.weight ? "text-slate-700" : "text-slate-400"}>
                                {ch.label}
                              </span>
                              <span className="text-xs font-bold text-slate-500">
                                {ch.earned}/{ch.weight}
                              </span>
                            </div>
                          ))}
                          <p className="text-[10px] text-slate-400 pt-2">
                            Interim score computed from listing data. The automated quality engine is not live yet.
                          </p>
                        </div>
                      </section>
                    );
                  })()}

                  <section>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4 flex items-center gap-2">
                      <Phone size={14} className="text-gold" /> Contact Flow
                    </h3>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                          Primary Email
                        </label>
                        <p className="text-sm text-slate-800 font-medium mt-1">
                          {selectedListing.contact?.email}
                        </p>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                          Primary Phone
                        </label>
                        <p className="text-sm text-slate-800 font-medium mt-1">
                          {selectedListing.contact?.phone}
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {LISTING_APPROVAL_AWAITING_DECISION.includes(
              selectedListing.approvalStatus,
            ) && (
              <div className="p-8 border-t border-slate-100 bg-white flex items-center justify-end gap-4 shrink-0">
                <button
                  onClick={() => {
                    setReasonModalAction(ApprovalStatus.REJECTED);
                    setIsRejectionModalOpen(true);
                  }}
                  className="px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-all"
                >
                  Reject Listing
                </button>
                <button
                  onClick={() => {
                    setReasonModalAction(ApprovalStatus.CHANGES_REQUIRED);
                    setIsRejectionModalOpen(true);
                  }}
                  className="px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest text-orange-600 hover:bg-orange-50 transition-all"
                >
                  Request Changes
                </button>
                <button
                  onClick={() =>
                    handleStatusUpdate(selectedListing.id, ApprovalStatus.APPROVED)
                  }
                  className="px-10 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  Approve Listing
                </button>
              </div>
            )}

            {selectedListing.approvalStatus === ApprovalStatus.REJECTED &&
              selectedListing.adminRejectionReason && (
                <div className="p-6 bg-rose-50 border-t border-rose-100 flex flex-col items-end shrink-0 text-right">
                  <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">
                    Rejection Reason
                  </span>
                  <p className="text-sm text-rose-700 font-medium mt-1">
                    {selectedListing.adminRejectionReason}
                  </p>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {isRejectionModalOpen && selectedListing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-99 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in font-satoshi">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-xl font-canela text-slate-900 mb-2 font-bold">
                {reasonModalAction === ApprovalStatus.REJECTED
                  ? "Reject Listing"
                  : "Request Changes"}
              </h3>
              <p className="text-slate-500 text-xs font-satoshi leading-relaxed">
                Please provide a reason{" "}
                {reasonModalAction === ApprovalStatus.REJECTED
                  ? "for rejecting"
                  : "the changes needed for"}{" "}
                <span className="font-bold text-slate-900">
                  {selectedListing.title}
                </span>
                . This will be shown to the company.
              </p>
            </div>

            <div className="p-8">
              <textarea
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (reasonError) setReasonError(null);
                }}
                placeholder={
                  reasonModalAction === ApprovalStatus.REJECTED
                    ? "Reason for rejection (e.g., Photos are blurry, Invalid pricing...)"
                    : "What needs to change (e.g., Add floor plan, correct the asking price...)"
                }
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all min-h-[140px] font-satoshi text-sm bg-slate-50/50 placeholder:text-slate-400"
                autoFocus
              />
              {reasonError && (
                <p className="text-sm text-red-500 mt-2">{reasonError}</p>
              )}
            </div>

            <div className="p-8 bg-slate-50/30 flex items-center gap-4">
              <button
                onClick={() => {
                  setIsRejectionModalOpen(false);
                  setRejectionReason("");
                  setReasonError(null);
                }}
                disabled={isUpdatingStatus}
                className="flex-1 py-4 px-4 rounded-xl text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const trimmed = rejectionReason.trim();
                  const problem = !trimmed
                    ? "Reason is required"
                    : trimmed.length < 3
                      ? "Reason must be at least 3 characters"
                      : trimmed.length > 500
                        ? "Reason must be at most 500 characters"
                        : null;
                  if (problem) {
                    setReasonError(problem);
                    toast.error(problem);
                    return;
                  }
                  setIsUpdatingStatus(true);
                  try {
                    const ok = await handleStatusUpdate(
                      selectedListing.id,
                      reasonModalAction,
                      trimmed,
                    );
                    // Keep the modal (and the typed reason) open on failure.
                    if (ok) {
                      setIsRejectionModalOpen(false);
                      setRejectionReason("");
                    }
                  } catch {
                    toast.error("Could not update the status. Please try again.");
                  } finally {
                    setIsUpdatingStatus(false);
                  }
                }}
                disabled={isUpdatingStatus}
                className="flex-2 py-4 px-4 bg-rose-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {isUpdatingStatus
                  ? "Saving..."
                  : reasonModalAction === ApprovalStatus.REJECTED
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
