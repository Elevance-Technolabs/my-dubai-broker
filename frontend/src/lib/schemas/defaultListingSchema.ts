import { z } from "zod";
import { numberField, requiredText, selectField } from "./common";

export const defaultListingSchema = z.object({
  categoryId: selectField("Category"),
  price: numberField("Price", { gt: 0 }),
  currency: selectField("Currency"),
  title: requiredText("Title", { min: 5, max: 200 }),
  description: requiredText("Description", { min: 20 }),
  roughNotes: z.string().optional(),

  // Dynamic fields (stored in an object or flattened)
  // For simplicity and matching current implementation, we'll flatten common ones
  // or use a Record for the dynamic ones
  dynamicValues: z.record(z.string(), z.string().or(z.number())).optional(),

  photoUrls: z
    .array(z.string())
    .min(1, { message: "At least one photo is required" })
    .max(10, { message: "You can upload up to 10 photos" }),
});

export type DefaultListingFormData = z.infer<typeof defaultListingSchema>;
// Raw form values before zod's number preprocessing (inputs hold strings).
export type DefaultListingFormInput = z.input<typeof defaultListingSchema>;

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
