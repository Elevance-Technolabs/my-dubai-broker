import { z } from "zod";
import { Currency } from "@/types/enums";

export const yachtSchema = z
  .object({
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

    // Yacht Specific Fields
    yachtType: z.string().min(1, { message: "Yacht type is required" }),
    year: z.coerce
      .number()
      .min(1900)
      .max(new Date().getFullYear() + 1),
    make: z.string().min(1, { message: "Make is required" }),
    length: z.coerce
      .number()
      .positive({ message: "Length must be a positive number" }),
    beam: z.coerce
      .number()
      .positive({ message: "Beam must be a positive number" }),
    crewInfo: z.string().optional(),
    engineHours: z.coerce.number().min(0).optional(),
    cabins: z.coerce.number().int().min(0).optional(),
    materials: z.string().optional(),
    navigation: z.array(z.string()).optional(),
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

export type YachtFormData = z.infer<typeof yachtSchema>;

export const defaultYachtValues: Partial<YachtFormData> = {
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
  yachtType: "",
  year: new Date().getFullYear(),
  make: "",
  length: 0,
  beam: 0,
  crewInfo: "",
  engineHours: 0,
  cabins: 0,
  materials: "",
  navigation: [],
};
