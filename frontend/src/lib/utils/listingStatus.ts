import { ListingStatus } from "@/types/enums";

const STATUS_BADGES: Record<
  ListingStatus,
  { label: string; className: string }
> = {
  [ListingStatus.DRAFT]: { label: "Draft", className: "bg-gray-500" },
  [ListingStatus.PENDING_REVIEW]: {
    label: "Reviewing",
    className: "bg-luxury-black",
  },
  [ListingStatus.ACTIVE]: { label: "Active", className: "bg-luxury-gold" },
  [ListingStatus.INACTIVE]: { label: "Inactive", className: "bg-gray-500" },
  [ListingStatus.REJECTED]: { label: "Rejected", className: "bg-rose-600" },
  [ListingStatus.SOLD_RENTED]: {
    label: "Sold / Rented",
    className: "bg-luxury-black",
  },
};

const FALLBACK_BADGE = { label: "Unknown", className: "bg-gray-400" };

export const getListingStatusBadge = (status: string) =>
  STATUS_BADGES[status as ListingStatus] ?? FALLBACK_BADGE;
