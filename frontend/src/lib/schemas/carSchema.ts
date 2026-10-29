import { z } from "zod";
import { Currency } from "@/types/enums";

export const carSchema = z
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
    internalReferenceCode: z.string().optional(),
    licenseNumber: z.string().min(1, { message: "License number is required" }),
    primaryEmail: z.string().email({ message: "Invalid email address" }),
    primaryPhone: z.string().min(1, { message: "Phone number is required" }),
    brand: z.string().min(1, { message: "Brand is required" }),
    model: z.string().min(1, { message: "Model is required" }),
    year: z.coerce
      .number()
      .min(1900)
      .max(new Date().getFullYear() + 1),
    variant: z.string().optional(),
    mileage: z.coerce.number().min(0),
    condition: z.string().min(1, { message: "Condition is required" }),
    transmission: z.string().min(1, { message: "Transmission is required" }),
    engineSize: z.string().optional(),
    horsepower: z.coerce.number().optional(),
    color: z.string().min(1, { message: "Color is required" }),
    interiorColor: z.string().optional(),
    warranty: z.boolean(),
    options: z.array(z.string()),
    negotiable: z.boolean(),
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

export type CarFormData = z.infer<typeof carSchema>;

export const defaultCarValues: Partial<CarFormData> = {
  title: "",
  description: "",
  price: 0,
  currency: "AED",
  photoFiles: [],
  existingPhotoKeys: [],
  videoUrl: "",
  qualityNarrative: "",
  internalReferenceCode: "",
  licenseNumber: "",
  primaryEmail: "",
  primaryPhone: "",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  variant: "",
  mileage: 0,
  condition: "",
  transmission: "",
  engineSize: "",
  horsepower: 0,
  color: "",
  interiorColor: "",
  warranty: false,
  options: [],
  negotiable: false,
};
