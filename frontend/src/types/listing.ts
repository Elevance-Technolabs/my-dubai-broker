import type { ListingStatus } from "@/types/enums";

// Mapper-derived discriminant (see backend listings.mapper.ts's `type`
// field) — distinct from the Prisma CompanyCategory enum in types/enums.ts.
export const AssetType = {
  CAR: "CAR",
  YACHT: "YACHT",
  JET: "JET",
  HELICOPTER: "HELICOPTER",
  REAL_ESTATE: "REAL_ESTATE",
} as const;
export type ListingType = (typeof AssetType)[keyof typeof AssetType];
export type { ListingStatus };

export interface BaseListing {
  id: string;
  type: ListingType;
  title: string;
  slug: string;
  description: string;
  price: number;
  priceSuffix?: string;
  currency: string;
  status: ListingStatus;
  listingsStatus: ListingStatus;
  categoryType: string;
  media: {
    photos: string[];
    video?: string;
    vrTour?: string;
  };
  contact: {
    email: string;
    phone: string;
  };
  location?: {
    name: string;
    lat: number;
    lng: number;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    referenceCode?: string;
    licenseNumber?: string;
    adminRejectionReason?: string;
  };
  seller?: {
    id: string;
    name: string;
    email: string;
  };
  company?: {
    id: string;
    name: string;
  };
}

export interface CarListing extends BaseListing {
  type: "CAR";
  brand: string;
  model: string;
  year: number;
  variant?: string;
  mileage: number;
  condition: string;
  transmission: string;
  engineSize?: string;
  horsepower?: number;
  color: string;
  interiorColor?: string;
  warranty: boolean;
  options: string[];
  negotiable: boolean;
}

export interface YachtListing extends BaseListing {
  type: "YACHT";
  yachtType: string;
  make: string;
  year: number;
  length: number;
  beam: number;
  crewInfo?: string;
  engineHours?: number;
  cabins: number;
  materials?: string;
  navigation?: string[];
}

export interface JetListing extends BaseListing {
  type: "JET" | "HELICOPTER";
  manufacturer: string;
  model: string;
  year: number;
  totalHours?: number;
  rotorHours?: number; // Unique to Helicopter
  passengerCapacity?: number; // Jet
  seating?: number; // Helicopter
  range?: number;
  interiorDetails?: string;
  avionics?: string;
  maintenanceHistory?: string;
  maintenance?: string;
}

export interface RealEstateListing extends BaseListing {
  type: "REAL_ESTATE";
  propertyType: string;
  listingType?: "SALE" | "RENT";
  permitNumber?: string;
  bedrooms: number;
  bathrooms: number;
  builtUpArea: number;
  plotArea?: number;
  floor?: number; // For apartments
  parking?: number;
  developer?: string;
  furnished: boolean;
  paymentPlan?: string;
  views?: string[];
  outdoor?: string[];
  indoor?: string[];
  community?: string[];
  propertyTags?: string[];
  amenities?: string[];
}

export type Listing =
  | CarListing
  | YachtListing
  | JetListing
  | RealEstateListing;
