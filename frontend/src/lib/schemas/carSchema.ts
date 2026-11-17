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

/** For sale, or rented out per day or per month. */
export const CAR_OFFERINGS = ["SALE", "SHORT_TERM_RENT", "LONG_TERM_RENT"] as const;

export const carSchema = z
  .object({
    ...listingBaseShape,
    offeringType: enumField("Listing type", CAR_OFFERINGS).default("SALE"),
    brand: requiredText("Brand"),
    model: requiredText("Model"),
    bodyType: selectField("Body type"),
    year: yearField(),
    variant: optionalText("Variant"),
    mileage: numberField("Mileage", { min: 0, int: true }),
    condition: selectField("Condition"),
    transmission: selectField("Transmission"),
    fuelType: optionalText("Fuel type"),
    engineSize: optionalText("Engine size"),
    horsepower: optionalNumberField("Horsepower", { min: 0, int: true }),
    color: requiredText("Color"),
    interiorColor: optionalText("Interior color"),
    doors: optionalNumberField("Doors", { min: 1, max: 9, int: true }),
    seats: optionalNumberField("Seats", { min: 1, max: 60, int: true }),
    regionalSpec: optionalText("Regional specification"),
    registrationYear: optionalNumberField("Registration year", { min: 1900, max: new Date().getFullYear() + 1, int: true }),
    plateNumber: optionalText("Plate number", 30),
    chassisNumber: optionalText("Chassis number (VIN)", 30),
    warranty: z.boolean(),
    serviceHistory: z.boolean().optional(),
    options: z.array(z.string()),
    rentalTerms: optionalText("Rental terms", 2000),
    negotiable: z.boolean(),
  })
  .superRefine((data, ctx) => {
    validateListingPhotos(data, ctx);
  });

export type CarFormData = z.infer<typeof carSchema>;
export type CarFormInput = z.input<typeof carSchema>;

export const defaultCarValues: Partial<CarFormData> = {
  title: "",
  description: "",
  price: 0,
  currency: "AED",
  photos: [],
  videoUrl: "",
  vrTourUrl: "",
  qualityNarrative: "",
  internalReferenceCode: "",
  licenseNumber: "",
  primaryEmail: "",
  primaryPhone: "",
  ...defaultLocationValues,
  offeringType: "SALE",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  variant: "",
  mileage: 0,
  bodyType: "",
  condition: "",
  transmission: "",
  fuelType: "",
  engineSize: "",
  horsepower: 0,
  color: "",
  interiorColor: "",
  regionalSpec: "",
  plateNumber: "",
  chassisNumber: "",
  warranty: false,
  serviceHistory: false,
  options: [],
  rentalTerms: "",
  negotiable: false,
};
