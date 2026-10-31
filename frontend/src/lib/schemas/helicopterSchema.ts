import { z } from "zod";
import {
  enumField,
  numberField,
  optionalText,
  requiredText,
  yearField,
} from "./common";
import { listingBaseShape, validateListingPhotos } from "./listingBase";

export const helicopterSchema = z
  .object({
    ...listingBaseShape,
    offeringType: enumField("Offering type", ["SALE", "CHARTER"]).default("SALE"),
    rateBasis: enumField("Rate basis", ["HOUR", "DAY"]).default("HOUR"),
    // Helicopter Specific Fields
    manufacturer: requiredText("Manufacturer"),
    model: requiredText("Model"),
    year: yearField(),
    rotorHours: numberField("Rotor hours", { min: 0 }),
    seating: numberField("Seating capacity", { min: 1, int: true }),
    engineModel: requiredText("Engine model"),
    interiorDetails: optionalText("Interior details"),
    avionics: optionalText("Avionics"),
    maintenance: optionalText("Maintenance"),
  })
  .superRefine((data, ctx) => {
    validateListingPhotos(data, ctx);
    // Charter listings are priced per hour or per day, so both are needed.
    if (data.offeringType === "CHARTER" && !data.rateBasis) {
      ctx.addIssue({
        code: "custom",
        message: "Please select a rate basis",
        path: ["rateBasis"],
      });
    }
  });

export type HelicopterFormData = z.infer<typeof helicopterSchema>;
// Raw form values before zod's number preprocessing (inputs hold strings).
export type HelicopterFormInput = z.input<typeof helicopterSchema>;

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
