import { z } from "zod";
import { MAX_ORIGINAL_IMAGE_BYTES } from "@/lib/utils/imageOptimize";
import { Currency } from "@/types/enums";
import {
  emailField,
  numberField,
  optionalText,
  phoneField,
  requiredText,
  urlField,
} from "./common";

export const MAX_LISTING_PHOTOS = 10;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
// Photos are shrunk to WebP in the browser before upload (see imageOptimize),
// so large originals straight from a phone or camera are fine.
const MAX_PHOTO_BYTES = MAX_ORIGINAL_IMAGE_BYTES;

/** Fields every listing category shares (same limits as the backend). */
export const listingBaseShape = {
  title: requiredText("Title", { min: 5, max: 200 }),
  description: requiredText("Description", { min: 20 }),
  price: numberField("Price", { gt: 0 }),
  currency: z.enum(Object.values(Currency) as [string, ...string[]], {
    error: "Please select a currency",
  }),
  photoFiles: z.array(z.custom<File>((value) => value instanceof File)),
  existingPhotoKeys: z.array(z.string()).default([]),
  videoUrl: urlField("Video link"),
  qualityNarrative: requiredText("Quality narrative"),
  primaryEmail: emailField("Email"),
  primaryPhone: phoneField("Phone number"),
  internalReferenceCode: optionalText("Reference code"),
  licenseNumber: requiredText("License number"),
};

/** Photo rules: at least one, at most 10, allowed type, 25 MB each before compression. */
export const validateListingPhotos = (
  data: { photoFiles: File[]; existingPhotoKeys: string[] },
  ctx: z.RefinementCtx,
) => {
  const total = data.photoFiles.length + data.existingPhotoKeys.length;
  if (total < 1) {
    ctx.addIssue({
      code: "custom",
      message: "At least one photo is required",
      path: ["photoFiles"],
    });
    return;
  }
  if (total > MAX_LISTING_PHOTOS) {
    ctx.addIssue({
      code: "custom",
      message: `You can upload up to ${MAX_LISTING_PHOTOS} photos`,
      path: ["photoFiles"],
    });
  }
  for (const file of data.photoFiles) {
    if (!PHOTO_TYPES.includes(file.type)) {
      ctx.addIssue({
        code: "custom",
        message: `"${file.name}" must be a JPG, PNG or WebP image`,
        path: ["photoFiles"],
      });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      ctx.addIssue({
        code: "custom",
        message: `"${file.name}" must be 25 MB or smaller`,
        path: ["photoFiles"],
      });
      return;
    }
  }
};
