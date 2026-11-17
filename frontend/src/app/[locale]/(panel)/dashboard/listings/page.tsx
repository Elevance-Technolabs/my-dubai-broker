"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import AssetCard from "@/components/dashboard/AssetCard";
import { Spinner, Tabs } from "@/components/admin/AdminUI";
import { listingService } from "@/services/listing.service";
import { useSession } from "@/lib/auth-client";
import { COMPANY_MANAGEMENT_ROLES, LISTING_CREATE_ROLES, UserRole } from "@/types/enums";

/** One status per listing, combining review and website state. */
type StatusKey = "DRAFT" | "PENDING" | "CHANGES_REQUIRED" | "LIVE" | "UNPUBLISHED" | "SOLD_OUT" | "REJECTED" | "DELETED";

const STATUS_LABEL: Record<StatusKey, string> = {
  DRAFT: "Draft",
  PENDING: "Pending review",
  CHANGES_REQUIRED: "Changes required",
  LIVE: "Live",
  UNPUBLISHED: "Unpublished",
  SOLD_OUT: "Sold out",
  REJECTED: "Rejected",
  DELETED: "Deleted",
};

const statusOf = (l: any): StatusKey => {
  if (l.publicationStatus === "DELETED") return "DELETED";
  if (l.approvalStatus === "SUBMITTED" || l.approvalStatus === "PENDING_REVIEW") return "PENDING";
  if (l.approvalStatus === "APPROVED") {
    if (l.publicationStatus === "SOLD_OUT") return "SOLD_OUT";
    if (l.publicationStatus === "LIVE") return "LIVE";
    return "UNPUBLISHED";
  }
  if (l.approvalStatus === "CHANGES_REQUIRED") return "CHANGES_REQUIRED";
  if (l.approvalStatus === "REJECTED") return "REJECTED";
  return "DRAFT";
};

type Tab = "ALL" | StatusKey;
const TABS: Tab[] = ["ALL", "DRAFT", "PENDING", "CHANGES_REQUIRED", "LIVE", "UNPUBLISHED", "SOLD_OUT", "REJECTED", "DELETED"];

const formatPrice = (p?: any) => {
  const amount = p?.salePrice ?? p?.annualRent ?? p?.monthlyRent ?? p?.dailyRate ?? p?.charterRate;
  if (!p || p.priceOnRequest || amount == null) return "Price on Request";
  return `${p.currency} ${Number(amount).toLocaleString()}`;
};

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1920&auto=format&fit=crop";

/**
 * Every listing the user can work on — drafts, under review, live,
 * unpublished, sold out, rejected and deleted — with a Create button.
 */
export default function ListingsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as UserRole | undefined;
  const canManageCompany = !!userRole && COMPANY_MANAGEMENT_ROLES.includes(userRole);
  const canCreate = !!userRole && LISTING_CREATE_ROLES.includes(userRole);

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!userRole) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Owners and managers see the whole company's book; everyone else
      // sees the listings they created.
      const res = canManageCompany
        ? await listingService.getListings({ limit: 100 })
        : await listingService.getMyListings({ limit: 100 });
      if (cancelled) return;
      if (res.success && res.data) {
        setListings(Array.isArray(res.data) ? res.data : ((res.data as any).listings ?? []));
      } else {
        toast.error(res.error || "Failed to load listings");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userRole, canManageCompany]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: 0 };
    for (const l of listings) {
      const k = statusOf(l);
      c[k] = (c[k] ?? 0) + 1;
      if (k !== "DELETED") c.ALL += 1;
    }
    return c;
  }, [listings]);

  const q = search.trim().toLowerCase();
  const shown = listings.filter((l) => {
    const k = statusOf(l);
    if (tab === "ALL" ? k === "DELETED" : k !== tab) return false;
    if (!q) return true;
    return [l.title, l.publicRef, l.location?.city, l.location?.area].some((v) => String(v ?? "").toLowerCase().includes(q));
  });

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-gray-100 pb-8">
        <div>
          <h2 className="text-3xl font-serif text-luxury-black">{canManageCompany ? "Listings" : "My Listings"}</h2>
          <p className="text-gray-500 mt-2 font-light text-sm tracking-wide">
            Every listing, from draft to live. Deleted listings stay under their own tab as history.
          </p>
        </div>
        {canCreate && (
          <Link href="/listings">
            <Button variant="dark" className="h-11 px-6 text-[10px] tracking-widest">
              <Plus className="w-3 h-3 mr-2" /> Create Listing
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <Tabs<Tab>
          active={tab}
          onChange={setTab}
          tabs={TABS.filter((t) => t === "ALL" || t === tab || (counts[t] ?? 0) > 0).map((t) => ({
            key: t,
            label: t === "ALL" ? "All" : STATUS_LABEL[t],
            count: counts[t] ?? 0,
          }))}
        />
        <label className="relative w-full lg:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, reference or area"
            className="w-full h-10 pl-9 pr-3 border border-gray-200 text-sm bg-white focus:outline-none focus:border-luxury-gold transition-colors"
          />
        </label>
      </div>

      {loading ? (
        <Spinner />
      ) : shown.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200">
          <p className="text-gray-400 text-sm">
            {listings.length === 0
              ? canCreate
                ? "No listings yet. Create your first listing."
                : "No listings yet."
              : tab === "DELETED"
                ? "No deleted listings."
                : "No listings match."}
          </p>
          {listings.length === 0 && canCreate && (
            <Link href="/listings" className="inline-block mt-6">
              <Button variant="dark" className="h-11 px-6 text-[10px] tracking-widest">
                <Plus className="w-3 h-3 mr-2" /> Create Listing
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {shown.map((l) => {
            const k = statusOf(l);
            const when = k === "DELETED" ? l.deleted?.at : l.timestamps?.createdAt;
            return (
              <AssetCard
                key={l.id}
                id={l.id}
                categoryLabel={l.categoryLabel}
                title={l.title}
                price={formatPrice(l.pricing)}
                image={l.media?.photos?.[0] || PLACEHOLDER}
                approvalStatus={k}
                statusLabel={STATUS_LABEL[k]}
                secondaryLabel={l.pendingChanges && k !== "DELETED" ? "Changes pending" : null}
                date={when ? new Date(when).toLocaleDateString() : "N/A"}
                rejectionReason={l.adminRejectionReason}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
