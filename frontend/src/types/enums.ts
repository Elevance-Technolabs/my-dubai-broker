// Mirrors the Prisma enums in backend/prisma/schema.prisma.
// Keep these in sync with the backend — do not hardcode these string
// literals anywhere else in the frontend.

export const UserRole = {
  SUPER_ADMIN: "super_admin",
  PLATFORM_REVIEWER: "platform_reviewer",
  COMPANY_OWNER: "company_owner",
  COMPANY_MANAGER: "company_manager",
  AGENT: "agent",
  LISTING_COORDINATOR: "listing_coordinator",
  VIEWER: "viewer",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// Roles that manage company-level settings/team/listings (owner + manager).
export const COMPANY_MANAGEMENT_ROLES: UserRole[] = [
  UserRole.COMPANY_OWNER,
  UserRole.COMPANY_MANAGER,
];

// Roles with any access to a company's workspace at all.
export const COMPANY_ROLES: UserRole[] = [
  UserRole.COMPANY_OWNER,
  UserRole.COMPANY_MANAGER,
  UserRole.AGENT,
  UserRole.LISTING_COORDINATOR,
  UserRole.VIEWER,
];

// Roles with platform-wide admin access (super_admin | platform_reviewer).
export const PLATFORM_STAFF_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.PLATFORM_REVIEWER,
];

export const CompanyCategory = {
  REAL_ESTATE: "REAL_ESTATE",
  CARS: "CARS",
  YACHTS: "YACHTS",
  PRIVATE_AVIATION: "PRIVATE_AVIATION",
  COLLECTIBLES: "COLLECTIBLES",
} as const;
export type CompanyCategory =
  (typeof CompanyCategory)[keyof typeof CompanyCategory];

export const CompanyStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  PENDING_REVIEW: "PENDING_REVIEW",
  CHANGES_REQUIRED: "CHANGES_REQUIRED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
} as const;
export type CompanyStatus = (typeof CompanyStatus)[keyof typeof CompanyStatus];

// Statuses meaning "an admin decision is needed" — used to gate the
// approve/reject/request-changes actions in the admin queue.
export const COMPANY_STATUS_AWAITING_DECISION: CompanyStatus[] = [
  CompanyStatus.SUBMITTED,
  CompanyStatus.PENDING_REVIEW,
];

// Listing.approvalStatus — the admin-controlled review status (dual-track
// with PublicationStatus below, matches backend prisma.ApprovalStatus).
// NOT the same as the legacy ListingStatus below, which several older
// frontend call sites still (incorrectly) read from a non-existent
// `listingsStatus` field — see PENDING.md.
export const ApprovalStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  PENDING_REVIEW: "PENDING_REVIEW",
  CHANGES_REQUIRED: "CHANGES_REQUIRED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

// Statuses meaning "an admin decision is needed" for a listing — mirrors
// COMPANY_STATUS_AWAITING_DECISION above.
export const LISTING_APPROVAL_AWAITING_DECISION: ApprovalStatus[] = [
  ApprovalStatus.SUBMITTED,
  ApprovalStatus.PENDING_REVIEW,
];

// Status of a Listing row (cars, jets, helicopters, yachts, real estate).
export const ListingStatus = {
  DRAFT: "DRAFT",
  PENDING_REVIEW: "PENDING_REVIEW",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  REJECTED: "REJECTED",
  SOLD_RENTED: "SOLD_RENTED",
} as const;
export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus];

// RealEstateListing.status — sale/rent/off-plan classification.
// Named "Property..." to avoid clashing with the mapper-derived
// Listing["type"] discriminant in src/types/listing.ts.
export const PropertyListingType = {
  SALE: "SALE",
  RENT: "RENT",
  OFF_PLAN: "OFF_PLAN",
  NEW: "NEW",
  PRE_OWNED: "PRE_OWNED",
} as const;
export type PropertyListingType =
  (typeof PropertyListingType)[keyof typeof PropertyListingType];

export const Currency = {
  AED: "AED",
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
} as const;
export type Currency = (typeof Currency)[keyof typeof Currency];

// Maps the onboarding wizard's category checkbox labels to the
// CompanyCategory enum. Single source shared by onboarding and listing
// creation so the two never drift apart.
export const CATEGORY_LABEL_TO_ENUM = {
  "Real Estate": CompanyCategory.REAL_ESTATE,
  Cars: CompanyCategory.CARS,
  Yachts: CompanyCategory.YACHTS,
  "Private Jets / Helicopters": CompanyCategory.PRIVATE_AVIATION,
} as const;

export const CATEGORY_LABELS = Object.keys(
  CATEGORY_LABEL_TO_ENUM,
) as (keyof typeof CATEGORY_LABEL_TO_ENUM)[];
export type CategoryLabel = keyof typeof CATEGORY_LABEL_TO_ENUM;
