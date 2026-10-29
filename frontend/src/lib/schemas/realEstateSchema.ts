import { z } from "zod";
import { Currency, PropertyListingType } from "@/types/enums";

export const realEstateSchema = z
  .object({
    // Common Fields
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    price: z.coerce
      .number()
      .min(1, { message: "Price must be a positive number" }),
    currency: z.enum(Object.values(Currency) as [string, ...string[]], {
      message: "Currency is required",
    }),
    photoFiles: z.array(z.custom<File>((value) => value instanceof File)),
    existingPhotoKeys: z.array(z.string()).default([]),
    videoUrl: z.string().url().optional().or(z.literal("")),
    qualityNarrative: z
      .string()
      .min(1, { message: "Quality narrative is required" }),
    primaryEmail: z.string().email({ message: "Invalid email address" }),
    primaryPhone: z.string().min(1, { message: "Phone number is required" }),
    internalReferenceCode: z.string().optional(),
    licenseNumber: z.string().min(1, { message: "License number is required" }),

    // Real Estate Specific Fields
    propertyType: z.string().min(1, { message: "Property type is required" }),
    status: z.enum(Object.values(PropertyListingType) as [string, ...string[]]),
    permitNumber: z.string().optional(),
    bedrooms: z.coerce.number().int().min(0),
    bathrooms: z.coerce.number().int().min(0),
    builtUpArea: z.coerce
      .number()
      .positive({ message: "Built-up area must be a positive number" }),
    plotArea: z.preprocess(
      (val) => (val === 0 || val === "" || val === null ? undefined : val),
      z.coerce.number().positive().optional(),
    ),
    floor: z.coerce.number().int().optional(),
    parking: z.coerce.number().int().min(0).optional(),
    developer: z.string().optional(),
    furnished: z.boolean().optional(),
    paymentPlan: z.string().optional(),

    // Arrays / Tags
    views: z.string().optional(),
    outdoor: z.string().optional(),
    indoor: z.string().optional(),
    community: z.string().optional(),
    propertyTags: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.photoFiles.length + data.existingPhotoKeys.length < 1) {
      ctx.addIssue({
        code: "custom",
        message: "At least one photo is required",
        path: ["photoFiles"],
      });
    }
  });

export type RealEstateFormData = z.infer<typeof realEstateSchema>;

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
