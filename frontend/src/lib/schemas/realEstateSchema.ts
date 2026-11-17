import { z } from "zod";
import {
  enumField,
  numberField,
  optionalNumberField,
  optionalText,
  requiredText,
  selectField,
} from "./common";
import { defaultLocationValues, listingBaseShape, validateListingPhotos } from "./listingBase";

/**
 * How the property is offered, and so which price the listing has:
 * sale / off-plan → sale price, yearly or monthly rent, short stay → per night.
 */
export const PROPERTY_OFFERINGS = ["SALE", "OFF_PLAN", "RENT_YEARLY", "RENT_MONTHLY", "SHORT_TERM"] as const;
export type PropertyOffering = (typeof PROPERTY_OFFERINGS)[number];

/** Property types (the listing's asset type). */
export const PROPERTY_TYPES = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "VILLA", label: "Villa" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "PENTHOUSE", label: "Penthouse" },
  { value: "OFFICE", label: "Office" },
  { value: "RETAIL", label: "Retail" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "LAND", label: "Land / plot" },
] as const;

export const realEstateSchema = z
  .object({
    ...listingBaseShape,
    status: enumField("Listing type", PROPERTY_OFFERINGS),
    propertyType: selectField("Property type"),
    permitNumber: optionalText("Permit number"),
    building: optionalText("Building / project", 150),
    bedrooms: numberField("Bedrooms", { min: 0, int: true }),
    bathrooms: numberField("Bathrooms", { min: 0, int: true }),
    builtUpArea: numberField("Built-up area", { gt: 0 }),
    plotArea: z.preprocess(
      (val) => (val === 0 || val === "" || val === null ? undefined : val),
      optionalNumberField("Plot area", { gt: 0 }),
    ),
    floor: optionalNumberField("Floor", { int: true }),
    totalFloors: optionalNumberField("Total floors", { min: 0, int: true }),
    parking: optionalNumberField("Parking spaces", { min: 0, int: true }),
    developer: optionalText("Developer"),
    completionStatus: optionalText("Completion status"),
    serviceCharge: optionalNumberField("Service charge", { min: 0 }),
    furnished: z.boolean().optional(),
    paymentPlan: optionalText("Payment plan"),

    views: z.array(z.string()),
    outdoor: z.array(z.string()),
    indoor: z.array(z.string()),
    communityFeatures: z.array(z.string()),
    amenities: z.array(z.string()),
    propertyTags: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    validateListingPhotos(data, ctx);
  });

export type RealEstateFormData = z.infer<typeof realEstateSchema>;
export type RealEstateFormInput = z.input<typeof realEstateSchema>;

export const defaultRealEstateValues: Partial<RealEstateFormData> = {
  title: "",
  description: "",
  price: 0,
  currency: "AED",
  photos: [],
  videoUrl: "",
  vrTourUrl: "",
  qualityNarrative: "",
  primaryEmail: "",
  primaryPhone: "",
  internalReferenceCode: "",
  licenseNumber: "",
  ...defaultLocationValues,
  status: "SALE",
  propertyType: "",
  permitNumber: "",
  building: "",
  bedrooms: 0,
  bathrooms: 0,
  builtUpArea: 0,
  plotArea: 0,
  floor: 0,
  parking: 0,
  developer: "",
  completionStatus: "",
  furnished: false,
  paymentPlan: "",
  views: [],
  outdoor: [],
  indoor: [],
  communityFeatures: [],
  amenities: [],
  propertyTags: [],
};
