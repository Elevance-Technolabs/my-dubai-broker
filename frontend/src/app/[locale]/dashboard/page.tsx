"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Loader2, List, Contact } from "lucide-react";
import Button from "@/components/ui/Button";
import AssetCard from "@/components/dashboard/AssetCard";
import { listingService } from "@/services/listing.service";
import { LeadService } from "@/services/lead.service";
import { useSession } from "@/lib/auth-client";
import { COMPANY_MANAGEMENT_ROLES, UserRole } from "@/types/enums";

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

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as UserRole | undefined;
  const canManageCompany = !!userRole && COMPANY_MANAGEMENT_ROLES.includes(userRole);

  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myLeadsCount, setMyLeadsCount] = useState<number | null>(null);

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

    if (!canManageCompany) {
      LeadService.getMyLeads().then((response) => {
        if (response?.success && response?.data) {
          setMyLeadsCount(response.data.pagination?.total ?? 0);
        }
      });
    }
  }, [userRole, canManageCompany]);

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-gray-100 pb-8">
        <div>
          <h2 className="text-3xl font-serif text-luxury-black">
            {canManageCompany ? "Overview" : "My Overview"}
          </h2>
          <p className="text-gray-400 mt-2 font-light text-sm tracking-wide">
            {canManageCompany
              ? "Manage your active assets."
              : "Your listings and leads at a glance."}
          </p>
        </div>

        <Link href="/listings">
          <Button
            variant="dark"
            className="h-10 px-6 text-[10px] tracking-widest shadow-md hover:shadow-lg"
          >
            <Plus className="w-3 h-3 mr-2" /> NEW LISTING
          </Button>
        </Link>
      </div>

      {/* Personal stat strip — agents/viewers only */}
      {!canManageCompany && (
        <div className="grid grid-cols-2 gap-6 mb-10">
          <Link
            href="/listings"
            className="flex items-center gap-4 p-6 border border-gray-100 hover:border-luxury-gold transition-colors"
          >
            <List className="w-5 h-5 text-luxury-gold shrink-0" />
            <div>
              <p className="text-2xl font-serif text-luxury-black">
                {isLoading ? "—" : listings.length}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">
                My Listings
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/leads"
            className="flex items-center gap-4 p-6 border border-gray-100 hover:border-luxury-gold transition-colors"
          >
            <Contact className="w-5 h-5 text-luxury-gold shrink-0" />
            <div>
              <p className="text-2xl font-serif text-luxury-black">
                {myLeadsCount === null ? "—" : myLeadsCount}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">
                My Leads
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Logic for Loading, Empty, or Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm">Refining your collection...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm">
            No listings found. Create your first listing!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {listings.map((listing) => (
            <AssetCard
              key={listing.id}
              id={listing.id}
              categoryLabel={listing.categoryLabel}
              title={listing.title}
              price={formatPrice(listing.pricing)}
              image={
                listing.media?.photos?.[0] ||
                "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2671&auto=format&fit=crop"
              }
              approvalStatus={listing.approvalStatus}
              statusLabel={listing.approvalLabel}
              date={
                listing.timestamps?.createdAt
                  ? new Date(listing.timestamps.createdAt).toLocaleDateString()
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