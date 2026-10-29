"use client";

import React, { useState, useEffect } from "react";
import ImageWithLoader from "@/components/ui/ImageWithLoader";
import Button from "@/components/ui/Button";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ShieldCheck,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { listingService } from "@/services/listing.service";
import { toast } from "sonner";

// Shape returned by the backend's mapToListing (listings.mapper.ts) — the
// shared `Listing` type in types/listing.ts predates the unified API.
interface ListingDetail {
  id: string;
  title: string;
  description?: string | null;
  categoryLabel: string;
  approvalStatus: string;
  approvalLabel: string;
  publicationLabel: string;
  adminRejectionReason?: string | null;
  pricing: {
    currency: string;
    offeringLabel: string;
    priceOnRequest?: boolean;
    salePrice?: number;
    annualRent?: number;
    monthlyRent?: number;
    dailyRate?: number;
    charterRate?: number;
  };
  media: { photos: string[] };
  agent?: { name?: string | null };
  company?: { name?: string | null };
  timestamps: { createdAt: string };
}

const APPROVAL_BADGE_CLASS: Record<string, string> = {
  DRAFT: "bg-gray-500",
  SUBMITTED: "bg-luxury-black",
  PENDING_REVIEW: "bg-luxury-black",
  CHANGES_REQUIRED: "bg-amber-600",
  APPROVED: "bg-luxury-gold",
  REJECTED: "bg-rose-600",
};

const formatPrice = (p: ListingDetail["pricing"]) => {
  const amount =
    p.salePrice ?? p.annualRent ?? p.monthlyRent ?? p.dailyRate ?? p.charterRate;
  if (p.priceOnRequest || amount == null) return "Price on Request";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: p.currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const StatusBadge = ({ status, label }: { status: string; label: string }) => (
  <span
    className={`px-3 py-1.5 text-[9px] font-medium uppercase tracking-widest text-white backdrop-blur-sm ${APPROVAL_BADGE_CLASS[status] ?? "bg-gray-400"}`}
  >
    {label}
  </span>
);

export default function ListingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchListing = async () => {
      setLoading(true);
      setError(null);

      const response = await listingService.getListingById(id);
      if (cancelled) return;

      if (response.success && response.data) {
        setListing(response.data as unknown as ListingDetail);
      } else {
        setError(response.error || "Failed to load this listing.");
      }
      setLoading(false);
    };

    fetchListing();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // For demonstration, toggle this to see public view style logic if needed
  // In dashboard context, usually isPublic is false.
  const isPublic = false;

  const galleryImages = listing?.media?.photos ?? [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + galleryImages.length) % galleryImages.length,
    );
  };

  const canSubmit =
    listing?.approvalStatus === "DRAFT" ||
    listing?.approvalStatus === "CHANGES_REQUIRED";

  const handleSubmit = async () => {
    if (!listing) return;
    setSubmitting(true);
    const res = await listingService.submitListing(listing.id);
    setSubmitting(false);
    if (res.success) {
      toast.success("Listing submitted for review");
      setListing({ ...listing, approvalStatus: "SUBMITTED", approvalLabel: "Submitted" });
    } else {
      toast.error(res.error || "Could not submit listing");
    }
  };

  const onBack = () => {
    router.back();
  };

  const navigate = (path: string) => {
    router.push(path);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-400">{error || "Listing not found"}</p>
        <Button variant="dark" onClick={onBack}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div
      className={
        isPublic
          ? "bg-white min-h-screen pt-24 flex flex-col"
          : "animate-slide-up pb-12"
      }
    >
      <div
        className={isPublic ? "max-w-7xl mx-auto px-8 pb-24 grow w-full" : ""}
      >
        {/* Header Navigation */}
        <div className="mb-8 flex justify-between items-center">
          <button
            onClick={onBack}
            className="flex items-center text-[10px] uppercase tracking-widest text-gray-400 hover:text-luxury-black transition-colors group"
          >
            <ArrowLeft
              size={14}
              className="mr-2 group-hover:-translate-x-1 transition-transform"
            />
            {isPublic ? "Back to Collection" : "Return to Overview"}
          </button>
          {!isPublic && (
            <div className="flex items-center gap-4">
              <StatusBadge status={listing.approvalStatus} label={`${listing.approvalLabel} · ${listing.publicationLabel}`} />
              {canSubmit && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 bg-luxury-black text-white text-[10px] uppercase tracking-widest font-bold hover:bg-luxury-gold transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit for Review"}
                </button>
              )}
              <button
                onClick={() => navigate(`/listings/${listing.id}/edit`)}
                className="text-[10px] uppercase tracking-widest text-luxury-gold hover:text-luxury-black transition-colors font-bold"
              >
                Edit Listing
              </button>
            </div>
          )}
        </div>

        {/* Hero Section with Carousel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
          {/* Left Column: Image Carousel */}
          <div className="lg:col-span-7 relative group select-none">
            <div className="aspect-4/3 overflow-hidden relative border border-gray-100 bg-gray-50">
              {galleryImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    idx === currentImageIndex
                      ? "opacity-100 z-10"
                      : "opacity-0 z-0"
                  }`}
                >
                  <ImageWithLoader
                    src={img}
                    alt={`${listing.title} - View ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}

              {/* Carousel Controls - Show on hover */}
              {galleryImages.length > 1 && (
                <div className="absolute inset-0 z-20 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="p-3 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-black transition-colors rounded-full pointer-events-auto"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="p-3 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-black transition-colors rounded-full pointer-events-auto"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}

              {/* Indicators */}
              {galleryImages.length > 1 && (
                <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center space-x-2">
                  {galleryImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`h-0.5 transition-all duration-300 ${
                        idx === currentImageIndex
                          ? "w-8 bg-white"
                          : "w-4 bg-white/40 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {galleryImages.length > 1 && (
              <div className="flex space-x-4 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative h-20 w-28 shrink-0 overflow-hidden border transition-all duration-300 ${
                      idx === currentImageIndex
                        ? "border-luxury-gold opacity-100"
                        : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    <ImageWithLoader
                      src={img}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="mb-8">
              <p className="text-[10px] uppercase tracking-widest text-luxury-gold mb-4">
                {listing.categoryLabel} Collection
              </p>
              <h1 className="text-4xl md:text-5xl font-serif text-luxury-black leading-tight mb-6">
                {listing.title}
              </h1>
              <p className="text-3xl font-light text-gray-600 font-serif">
                {formatPrice(listing.pricing)}
              </p>
            </div>

            <div className="border-t border-gray-100 pt-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-gray-400">
                  Seller Reference
                </span>
                <span className="font-serif text-luxury-black">
                  {listing.company?.name || listing.agent?.name || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-gray-400">
                  Date Listed
                </span>
                <span className="font-serif text-luxury-black">
                  {new Date(listing.timestamps.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-gray-400">
                  Asset ID
                </span>
                <span className="font-sans text-xs text-gray-400 font-light">
                  #{listing.id.toUpperCase()}
                </span>
              </div>
            </div>

            {!isPublic && listing.adminRejectionReason && (
              <div className="mt-8 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <p className="text-[10px] uppercase tracking-widest mb-1">
                  Reviewer note
                </p>
                {listing.adminRejectionReason}
              </div>
            )}

            {/* Public Action Button */}
            {isPublic && (
              <div className="mt-12">
                <Button variant="primary" className="w-full h-12 text-sm">
                  Inquire About Asset
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Description & Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-t border-gray-100 pt-12 mb-24">
          <div className="lg:col-span-7">
            <h3 className="text-xl font-serif text-luxury-black mb-6">
              Asset Narrative
            </h3>
            <div className="prose prose-p:text-gray-500 prose-p:font-light prose-p:leading-loose prose-p:font-sans max-w-none text-sm text-justify">
              {(listing.description ?? "")
                .split("\n")
                .filter((p: string) => p.trim())
                .map((paragraph: string, idx: number) => (
                  <p
                    key={idx}
                    className={`mb-6 ${idx === 0 ? "first-letter:text-5xl first-letter:font-serif first-letter:text-luxury-black first-letter:float-left first-letter:mr-3 first-letter:mt-[-6px]" : ""}`}
                  >
                    {paragraph}
                  </p>
                ))}
            </div>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <div className="bg-gray-50 p-8 border border-gray-100">
              <h3 className="text-sm font-sans uppercase tracking-widest text-luxury-black mb-6 border-b border-gray-200 pb-4">
                Verification
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start text-sm text-gray-500 font-light">
                  <ShieldCheck
                    size={16}
                    className="text-luxury-gold mr-3 mt-0.5"
                  />
                  <span>Verified listing</span>
                </li>
                <li className="flex items-start text-sm text-gray-500 font-light">
                  <Clock size={16} className="text-luxury-gold mr-3 mt-0.5" />
                  <span>
                    Listed{" "}
                    {Math.floor(
                      (new Date().getTime() -
                        new Date(listing.timestamps.createdAt).getTime()) /
                        (1000 * 3600 * 24),
                    )}{" "}
                    days ago
                  </span>
                </li>
                <li className="flex items-start text-sm text-gray-500 font-light">
                  <CheckCircle
                    size={16}
                    className="text-luxury-gold mr-3 mt-0.5"
                  />
                  <span>Pre-qualified assets only</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer would go here if isPublic is true */}
    </div>
  );
}
