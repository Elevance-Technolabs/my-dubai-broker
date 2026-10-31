import { z } from "zod";
import {
  enumField,
  numberField,
  optionalText,
  requiredText,
  yearField,
} from "./common";
import { listingBaseShape, validateListingPhotos } from "./listingBase";

export const jetSchema = z
  .object({
    ...listingBaseShape,
    offeringType: enumField("Offering type", ["SALE", "CHARTER"]).default("SALE"),
    rateBasis: enumField("Rate basis", ["HOUR", "DAY"]).default("HOUR"),
    // Jet Specific Fields
    manufacturer: requiredText("Manufacturer"),
    model: requiredText("Model"),
    year: yearField(),
    totalHours: numberField("Total hours", { min: 0 }),
    passengerCapacity: numberField("Passenger capacity", { min: 1, int: true }),
    range: numberField("Range", { gt: 0, int: true }),
    interiorDetails: optionalText("Interior details"),
    avionics: optionalText("Avionics"),
    maintenanceHistory: optionalText("Maintenance history"),
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

export type JetFormData = z.infer<typeof jetSchema>;
// Raw form values before zod's number preprocessing (inputs hold strings).
export type JetFormInput = z.input<typeof jetSchema>;

export const defaultJetValues: Partial<JetFormData> = {
  title: "",
  description: "",
  price: 0,
  offeringType: "SALE",
  rateBasis: "HOUR",
  currency: "USD", // Jets commonly priced in USD
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
  totalHours: 0,
  passengerCapacity: 0,
  range: 0,
  interiorDetails: "",
  avionics: "",
  maintenanceHistory: "",
};
