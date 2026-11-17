"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import AssetCard from "@/components/dashboard/AssetCard";
import { listingService } from "@/services/listing.service";
import { CompanyService } from "@/services/company.service";
import { useSession } from "@/lib/auth-client";
import {
  COMPANY_MANAGEMENT_ROLES,
  LEAD_ROLES,
  LISTING_CREATE_ROLES,
  UserRole,
} from "@/types/enums";
import {
  CATEGORY_OPTIONS,
  DateField,
  FilterBar,
  FilterSelect,
  Pill,
  SectionCard,
  StatTile,
  Tabs,
  fmtDate,
  fmtDateTime,
  fmtMinutes,
  fmtNumber,
  fmtPercent,
} from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils/cn";

const formatPrice = (p?: {
  currency: string;
  priceOnRequest?: boolean;
  salePrice?: number;
  annualRent?: number;
  monthlyRent?: number;
  dailyRate?: number;
  charterRate?: number;
}) => {
  const amount =
    p?.salePrice ?? p?.annualRent ?? p?.monthlyRent ?? p?.dailyRate ?? p?.charterRate;
  if (!p || p.priceOnRequest || amount == null) return "Price on Request";
  return `${p.currency} ${amount.toLocaleString()}`;
};

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

/**
 * Company dashboard (plan Sections 5–6). Owners and managers get the full
 * operating centre; agents, coordinators and viewers get the parts that
 * apply to their role, scoped as the backend decides.
 */
export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as UserRole | undefined;
  const canManageCompany = !!userRole && COMPANY_MANAGEMENT_ROLES.includes(userRole);
  const canSeeLeads = !!userRole && LEAD_ROLES.includes(userRole);
  const canCreateListing = !!userRole && LISTING_CREATE_ROLES.includes(userRole);

  const [filters, setFilters] = useState({ from: daysAgo(30), to: daysAgo(0), category: "" });
  const [dashboard, setDashboard] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  // Deleted listings stay on record; they are shown under their own tab.
  const [listingTab, setListingTab] = useState<"active" | "deleted">("active");
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!userRole) return;
    if (filters.from && filters.to && filters.from > filters.to) {
      toast.error("The start date must be before the end date.");
      return;
    }
    const res = await CompanyService.getDashboard(filters);
    if (res.success) setDashboard(res.data);
    else toast.error(res.error || "Failed to load dashboard");
  }, [userRole, filters]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!userRole) return;
    const fetchListings = async () => {
      try {
        setIsLoading(true);
        // Owners/managers run the whole company's book; everyone else
        // (agents, viewers) sees only what's assigned to them.
        const response = canManageCompany
          ? await listingService.getListings()
          : await listingService.getMyListings();

        if (response?.success && response?.data) {
          // Handle both possible shapes (direct array or object with listings) safely
          const data = Array.isArray(response.data)
            ? response.data
            : (response.data as any).listings || [];
          setListings(data);
        }
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchListings();
  }, [userRole, canManageCompany]);

  const activeListings = listings.filter((l) => l.publicationStatus !== "DELETED");
  const deletedListings = listings.filter((l) => l.publicationStatus === "DELETED");
  const shownListings = listingTab === "deleted" ? deletedListings : activeListings;

  const d = dashboard;
  const ownScope = d?.scope === "own";

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-gray-100 pb-8">
        <div>
          <h2 className="text-3xl font-serif text-luxury-black">
            {canManageCompany ? "Overview" : "My Overview"}
          </h2>
          <p className="text-gray-500 mt-2 font-light text-sm tracking-wide">
            {canManageCompany
              ? "What is live, what needs attention and how your listings perform."
              : "Your listings, leads and next actions."}
          </p>
        </div>

        {canCreateListing && (
          <Link href="/listings">
            <Button
              variant="dark"
              className="h-10 px-6 text-[10px] tracking-widest shadow-md hover:shadow-lg"
            >
              <Plus className="w-3 h-3 mr-2" /> NEW LISTING
            </Button>
          </Link>
        )}
      </div>

      <FilterBar>
        <DateField label="From" value={filters.from} onChange={(v) => setFilters((f) => ({ ...f, from: v }))} />
        <DateField label="To" value={filters.to} onChange={(v) => setFilters((f) => ({ ...f, to: v }))} />
        <FilterSelect label="Category" value={filters.category} onChange={(v) => setFilters((f) => ({ ...f, category: v }))} options={CATEGORY_OPTIONS} />
      </FilterBar>

      {!d ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-6 mb-10">
          {/* Listing state */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
            <StatTile label={ownScope ? "My live listings" : "Live listings"} value={d.counts.live} tone="green" />
            <StatTile label="Drafts" value={d.counts.draft} />
            <StatTile label="Pending review" value={d.counts.pendingReview} />
            <StatTile label="Changes required" value={d.counts.changesRequired} tone={d.counts.changesRequired ? "amber" : "slate"} />
            <StatTile label="Rejected" value={d.counts.rejected} tone={d.counts.rejected ? "red" : "slate"} />
            <StatTile label="Expiring (30 days)" value={d.counts.expiring} tone={d.counts.expiring ? "amber" : "slate"} />
            {d.counts.newEnquiries != null && (
              <StatTile label="New enquiries" value={d.counts.newEnquiries} tone={d.counts.newEnquiries ? "amber" : "slate"} />
            )}
          </div>

          {/* Performance */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile label="Views" value={fmtNumber(d.performance.views)} hint={`${fmtDate(filters.from)} – ${fmtDate(filters.to)}`} />
            <StatTile label="Enquiries" value={fmtNumber(d.performance.enquiries)} />
            <StatTile label="Enquiry conversion" value={fmtPercent(d.performance.conversionRate)} hint="Enquiries ÷ views" />
            <StatTile
              label="Avg first response"
              value={<span className="text-2xl">{fmtMinutes(d.performance.avgFirstResponseMinutes)}</span>}
              hint={`Response window ${fmtMinutes(d.company.leadSlaMinutes)}`}
            />
          </div>

          {/* Action required */}
          <SectionCard title="Action required">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {d.actionRequired.map((a: any) => (
                <div
                  key={a.key}
                  className={cn(
                    "p-4 rounded-2xl border",
                    a.count > 0 ? "border-amber-200 bg-amber-50/40" : "border-slate-100 bg-slate-50/40",
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] uppercase tracking-widest font-bold text-slate-700">{a.title}</p>
                    <Pill tone={a.count > 0 ? "amber" : "green"}>{a.count > 0 ? a.count : "OK"}</Pill>
                  </div>
                  <p className="text-sm text-slate-700">{a.count > 0 ? a.description : "Nothing to do here."}</p>
                  {a.items?.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {a.items.map((item: any) => (
                        <li key={item.id}>
                          <Link href={item.href} className="text-sm text-slate-900 hover:text-gold flex items-center gap-1">
                            <ArrowRight size={12} className="shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </Link>
                          {item.detail && <p className="text-xs text-slate-500 ml-4 line-clamp-2">{item.detail}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Agent / own work */}
          {canSeeLeads && !canManageCompany && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard title="Today's new leads" actions={<Link href="/dashboard/leads" className="text-xs font-bold text-gold">All leads</Link>}>
                <LinkList items={d.todayLeads} empty="No new leads today." />
              </SectionCard>
              <SectionCard title="Waiting for your response">
                <LinkList items={d.overdueLeads} empty="Every lead has been answered." />
              </SectionCard>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Top listings by enquiries">
              <MetricList items={d.topListings} empty="No views or enquiries in this period yet." />
            </SectionCard>
            <SectionCard title="High views, low enquiries">
              <MetricList items={d.highViewsLowConversion} empty="No listings with many views and few enquiries." />
            </SectionCard>
          </div>

          {canManageCompany && (
            <SectionCard
              title="Agent response performance"
              actions={d.unassignedLeads ? <Pill tone="amber">{d.unassignedLeads} unassigned leads</Pill> : null}
            >
              {d.agentResponse.length === 0 ? (
                <p className="text-sm text-slate-500">No enquiries in this period.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-slate-500">
                      <th className="py-2">Agent</th>
                      <th className="py-2">Leads</th>
                      <th className="py-2">Answered in time</th>
                      <th className="py-2">Avg first response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {d.agentResponse.map((a: any) => (
                      <tr key={a.id}>
                        <td className="py-2 font-medium">{a.name}</td>
                        <td className="py-2">{a.leads}</td>
                        <td className="py-2">{fmtPercent(a.responseRate)}</td>
                        <td className="py-2">{fmtMinutes(a.avgFirstResponseMinutes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SectionCard>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Upcoming expiries">
              <div className="space-y-3">
                {d.expiries.map((e: any) => (
                  <div key={e.days}>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">
                      Next {e.days} days · {e.listings.length + e.documents.length}
                    </p>
                    {e.listings.length + e.documents.length === 0 ? (
                      <p className="text-sm text-slate-400">Nothing expiring.</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {e.listings.map((l: any) => (
                          <li key={l.id}>
                            <Link href={l.href} className="hover:text-gold">{l.label}</Link> <span className="text-slate-500">· {fmtDate(l.date)}</span>
                          </li>
                        ))}
                        {e.documents.map((doc: any) => (
                          <li key={doc.id} className="capitalize">
                            {doc.label} <span className="text-slate-500 normal-case">· document · {fmtDate(doc.date)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Recent activity">
              {d.recentActivity.length === 0 ? (
                <p className="text-sm text-slate-500">No activity yet.</p>
              ) : (
                <ul className="space-y-3">
                  {d.recentActivity.map((a: any, i: number) => (
                    <li key={i} className="text-sm">
                      <Link href={a.href} className="text-slate-900 hover:text-gold">
                        {a.title}
                      </Link>
                      {a.detail && <p className="text-xs text-slate-600">{a.detail}</p>}
                      <p className="text-xs text-slate-500">
                        {fmtDateTime(a.at)}
                        {a.actor ? ` · ${a.actor}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {/* Listings */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <h3 className="text-[11px] uppercase tracking-widest font-medium text-gray-500">
          {canManageCompany ? "Company listings" : "My listings"}
        </h3>
        <Tabs<"active" | "deleted">
          active={listingTab}
          onChange={setListingTab}
          tabs={[
            { key: "active", label: "Active", count: activeListings.length },
            { key: "deleted", label: "Deleted", count: deletedListings.length },
          ]}
        />
      </div>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm">Refining your collection...</p>
        </div>
      ) : shownListings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm">
            {listingTab === "deleted"
              ? "No deleted listings. Listings you delete stay here as history."
              : canCreateListing
                ? "No listings found. Create your first listing!"
                : "No listings found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {shownListings.map((listing) => (
            <AssetCard
              key={listing.id}
              id={listing.id}
              categoryLabel={listing.categoryLabel}
              title={listing.title}
              price={formatPrice(listing.pricing)}
              image={
                listing.media?.photos?.[0] ||
                "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1920&auto=format&fit=crop"
              }
              approvalStatus={listing.publicationStatus === "DELETED" ? "DELETED" : listing.approvalStatus}
              statusLabel={listing.publicationStatus === "DELETED" ? "Deleted" : listing.approvalLabel}
              date={
                (listing.publicationStatus === "DELETED" ? listing.deleted?.at : listing.timestamps?.createdAt)
                  ? new Date(
                      listing.publicationStatus === "DELETED" ? listing.deleted?.at : listing.timestamps.createdAt,
                    ).toLocaleDateString()
                  : "N/A"
              }
              rejectionReason={listing.adminRejectionReason}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LinkList({ items, empty }: { items?: { id: string; label: string; href: string }[] | null; empty: string }) {
  if (!items || items.length === 0) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((i) => (
        <li key={i.id}>
          <Link href={i.href} className="text-sm text-slate-900 hover:text-gold flex items-center gap-1">
            <ArrowRight size={12} /> {i.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function MetricList({ items, empty }: { items: any[]; empty: string }) {
  if (!items || items.length === 0) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[10px] uppercase tracking-widest text-slate-500">
          <th className="py-2">Listing</th>
          <th className="py-2">Views</th>
          <th className="py-2">Enquiries</th>
          <th className="py-2">Conversion</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {items.map((l) => (
          <tr key={l.id}>
            <td className="py-2">
              <Link href={l.href} className="hover:text-gold">{l.label}</Link>
            </td>
            <td className="py-2">{fmtNumber(l.views)}</td>
            <td className="py-2">{fmtNumber(l.enquiries)}</td>
            <td className="py-2">{fmtPercent(l.conversionRate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
