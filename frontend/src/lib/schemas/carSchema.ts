import { z } from "zod";
import {
  numberField,
  optionalNumberField,
  optionalText,
  requiredText,
  selectField,
  yearField,
} from "./common";
import { listingBaseShape, validateListingPhotos } from "./listingBase";

export const carSchema = z
  .object({
    ...listingBaseShape,
    brand: requiredText("Brand"),
    model: requiredText("Model"),
    year: yearField(),
    variant: optionalText("Variant"),
    mileage: numberField("Mileage", { min: 0 }),
    condition: selectField("Condition"),
    transmission: selectField("Transmission"),
    engineSize: optionalText("Engine size"),
    horsepower: optionalNumberField("Horsepower", { min: 0 }),
    color: requiredText("Color"),
    interiorColor: optionalText("Interior color"),
    warranty: z.boolean(),
    options: z.array(z.string()),
    negotiable: z.boolean(),
  })
  .superRefine((data, ctx) => {
    validateListingPhotos(data, ctx);
  });

export type CarFormData = z.infer<typeof carSchema>;
// Raw form values before zod's number preprocessing (inputs hold strings).
export type CarFormInput = z.input<typeof carSchema>;

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
