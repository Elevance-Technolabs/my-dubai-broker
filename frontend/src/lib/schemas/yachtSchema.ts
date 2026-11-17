import { z } from "zod";
import {
  enumField,
  numberField,
  optionalNumberField,
  optionalText,
  requiredText,
  selectField,
  yearField,
} from "./common";
import { defaultLocationValues, listingBaseShape, validateListingPhotos } from "./listingBase";

export const yachtSchema = z
  .object({
    ...listingBaseShape,
    offeringType: enumField("Listing type", ["SALE", "CHARTER"]).default("SALE"),
    rateBasis: enumField("Rate basis", ["HOUR", "DAY"]).default("DAY"),
    yachtType: selectField("Yacht type"),
    year: yearField(),
    make: requiredText("Make"),
    model: optionalText("Model"),
    length: numberField("Length", { gt: 0 }),
    beam: numberField("Beam", { gt: 0 }),
    draft: optionalNumberField("Draft", { gt: 0 }),
    engineHours: optionalNumberField("Engine hours", { min: 0, int: true }),
    engines: optionalText("Engines"),
    cabins: optionalNumberField("Cabins", { min: 0, int: true }),
    guestCapacity: optionalNumberField("Guests", { min: 0, int: true }),
    crewCapacity: optionalNumberField("Crew", { min: 0, int: true }),
    crewIncluded: z.boolean().optional(),
    materials: optionalText("Materials"),
    flag: optionalText("Flag"),
    registrationNumber: optionalText("Registration number"),
    classification: optionalText("Classification"),
    charterAvailability: optionalText("Charter availability"),
    navigation: z.array(z.string()),
    amenities: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    validateListingPhotos(data, ctx);
  });

export type YachtFormData = z.infer<typeof yachtSchema>;
export type YachtFormInput = z.input<typeof yachtSchema>;

export const defaultYachtValues: Partial<YachtFormData> = {
  title: "",
  description: "",
  price: 0,
  currency: "AED",
  photos: [],
  videoUrl: "",
  vrTourUrl: "",
  qualityNarrative: "",
  primaryEmail: "",
  primaryPhone: "",
  internalReferenceCode: "",
  licenseNumber: "",
  ...defaultLocationValues,
  offeringType: "SALE",
  rateBasis: "DAY",
  yachtType: "",
  year: new Date().getFullYear(),
  make: "",
  model: "",
  length: 0,
  beam: 0,
  engineHours: 0,
  engines: "",
  cabins: 0,
  crewIncluded: false,
  materials: "",
  flag: "",
  registrationNumber: "",
  classification: "",
  charterAvailability: "",
  navigation: [],
  amenities: [],
};
