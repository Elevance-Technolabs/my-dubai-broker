import { z } from "zod";
import { Currency } from "@/types/enums";

export const helicopterSchema = z
  .object({
    // Common Fields
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    price: z.coerce
      .number()
      .min(1, { message: "Price must be a positive number" }),
    offeringType: z.enum(["SALE", "CHARTER"]).default("SALE"),
    rateBasis: z.enum(["HOUR", "DAY"]).default("HOUR"),
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

    // Helicopter Specific Fields
    manufacturer: z.string().min(1, { message: "Manufacturer is required" }),
    model: z.string().min(1, { message: "Model is required" }),
    year: z.coerce
      .number()
      .min(1900)
      .max(new Date().getFullYear() + 1),
    rotorHours: z.coerce
      .number()
      .min(0, { message: "Rotor hours must be positive" }),
    seating: z.coerce
      .number()
      .int()
      .min(1, { message: "Seating capacity must be at least 1" }),
    engineModel: z.string().min(1, { message: "Engine model is required" }),
    interiorDetails: z.string().optional(),
    avionics: z.string().optional(),
    maintenance: z.string().optional(),
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

export type HelicopterFormData = z.infer<typeof helicopterSchema>;

export const defaultHelicopterValues: Partial<HelicopterFormData> = {
  title: "",
  description: "",
  price: 0,
  offeringType: "SALE",
  rateBasis: "HOUR",
  currency: "USD",
  photoFiles: [],
  existingPhotoKeys: [],
  videoUrl: "",
  qualityNarrative: "",
  primaryEmail: "",
  primaryPhone: "",
  internalReferenceCode: "",
  licenseNumber: "",
  manufacturer: "",
  model: "",
  year: new Date().getFullYear(),
  rotorHours: 0,
  seating: 0,
  engineModel: "",
  interiorDetails: "",
  avionics: "",
  maintenance: "",
};
