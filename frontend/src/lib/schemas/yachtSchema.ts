import { z } from "zod";
import {
  numberField,
  optionalNumberField,
  optionalText,
  requiredText,
  yearField,
} from "./common";
import { listingBaseShape, validateListingPhotos } from "./listingBase";

export const yachtSchema = z
  .object({
    ...listingBaseShape,
    // Yacht Specific Fields
    yachtType: requiredText("Yacht type"),
    year: yearField(),
    make: requiredText("Make"),
    length: numberField("Length", { gt: 0 }),
    beam: numberField("Beam", { gt: 0 }),
    crewInfo: optionalText("Crew info"),
    engineHours: optionalNumberField("Engine hours", { min: 0 }),
    cabins: optionalNumberField("Cabins", { min: 0, int: true }),
    materials: optionalText("Materials"),
    navigation: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    validateListingPhotos(data, ctx);
  });

export type YachtFormData = z.infer<typeof yachtSchema>;
// Raw form values before zod's number preprocessing (inputs hold strings).
export type YachtFormInput = z.input<typeof yachtSchema>;

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
