import { z } from "zod";

export const defaultListingSchema = z.object({
  categoryId: z.string().min(1, { message: "Category is required" }),
  price: z.number().min(0, { message: "Price must be a positive number" }),
  currency: z.string().min(1, { message: "Currency is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  roughNotes: z.string().optional(),

  // Dynamic fields (stored in an object or flattened)
  // For simplicity and matching current implementation, we'll flatten common ones
  // or use a Record for the dynamic ones
  dynamicValues: z.record(z.string(), z.string().or(z.number())).optional(),

  photoUrls: z
    .array(z.string().url())
    .min(1, { message: "At least one photo is required" }),
});

export type DefaultListingFormData = z.infer<typeof defaultListingSchema>;

export const defaultListingValues: DefaultListingFormData = {
  categoryId: "",
  price: 0,
  currency: "USD",
  title: "",
  description: "",
  roughNotes: "",
  dynamicValues: {},
  photoUrls: [],
};
