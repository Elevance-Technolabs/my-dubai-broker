import { z } from "zod";
import { PropertyListingType } from "@/types/enums";
import {
  enumField,
  numberField,
  optionalNumberField,
  optionalText,
  requiredText,
} from "./common";
import { listingBaseShape, validateListingPhotos } from "./listingBase";

export const realEstateSchema = z
  .object({
    ...listingBaseShape,
    // Real Estate Specific Fields
    propertyType: requiredText("Property type"),
    status: enumField("Status", Object.values(PropertyListingType) as [string, ...string[]]),
    permitNumber: optionalText("Permit number"),
    bedrooms: numberField("Bedrooms", { min: 0, int: true }),
    bathrooms: numberField("Bathrooms", { min: 0, int: true }),
    builtUpArea: numberField("Built-up area", { gt: 0 }),
    plotArea: z.preprocess(
      (val) => (val === 0 || val === "" || val === null ? undefined : val),
      optionalNumberField("Plot area", { gt: 0 }),
    ),
    floor: optionalNumberField("Floor", { int: true }),
    parking: optionalNumberField("Parking spaces", { min: 0, int: true }),
    developer: optionalText("Developer"),
    furnished: z.boolean().optional(),
    paymentPlan: optionalText("Payment plan"),

    // Arrays / Tags
    views: z.string().optional(),
    outdoor: z.string().optional(),
    indoor: z.string().optional(),
    community: z.string().optional(),
    propertyTags: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    validateListingPhotos(data, ctx);
  });

export type RealEstateFormData = z.infer<typeof realEstateSchema>;
// Raw form values before zod's number preprocessing (inputs hold strings).
export type RealEstateFormInput = z.input<typeof realEstateSchema>;

export const defaultRealEstateValues: Partial<RealEstateFormData> = {
  title: "",
  description: "",
  price: 0,
  currency: "AED",
  photoFiles: [],
  existingPhotoKeys: [],
  videoUrl: "",
  qualityNarrative: "",
  primaryEmail: "",
  primaryPhone: "",
  internalReferenceCode: "",
  licenseNumber: "",
  propertyType: "",
  status: "SALE",
  permitNumber: "",
  bedrooms: 0,
  bathrooms: 0,
  builtUpArea: 0,
  plotArea: 0,
  floor: 0,
  parking: 0,
  developer: "",
  furnished: false,
  paymentPlan: "",
  views: "",
  outdoor: "",
  indoor: "",
  community: "",
  propertyTags: "",
};
