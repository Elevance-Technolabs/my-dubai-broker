import { z } from "zod";
import { MAX_ORIGINAL_IMAGE_BYTES } from "@/lib/utils/imageOptimize";
import { isPlayableVideoLink } from "@/lib/utils/videoEmbed";
import { Currency } from "@/types/enums";
import {
  emailField,
  numberField,
  optionalNumberField,
  optionalText,
  phoneField,
  requiredText,
  urlField,
} from "./common";

/** Same limits as the backend: a cover plus at least 4 more, at most 30. */
export const MIN_LISTING_PHOTOS = 5;
export const MAX_LISTING_PHOTOS = 30;
export const LISTING_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
// Photos are shrunk to WebP in the browser before upload (see imageOptimize),
// so large originals straight from a phone or camera are fine.
export const MAX_LISTING_PHOTO_BYTES = MAX_ORIGINAL_IMAGE_BYTES;

/**
 * One photo in a listing form, in display order (the first is the cover).
 * Either already on the listing (`url`) or picked now and not yet uploaded (`file`).
 */
export type ListingPhoto = {
  id: string;
  url?: string;
  file?: File;
  /** What to show in the form: the photo's URL, or a local preview of the file. */
  preview: string;
};

const listingPhoto = z.custom<ListingPhoto>(
  (v) =>
    !!v &&
    typeof v === "object" &&
    typeof (v as ListingPhoto).id === "string" &&
    (typeof (v as ListingPhoto).url === "string" || (v as ListingPhoto).file instanceof File),
);

/** Fields every listing category shares (same limits as the backend). */
export const listingBaseShape = {
  title: requiredText("Title", { min: 5, max: 200 }),
  description: requiredText("Description", { min: 20 }),
  price: numberField("Price", { gt: 0 }),
  currency: z.enum(Object.values(Currency) as [string, ...string[]], {
    error: "Please select a currency",
  }),
  photos: z.array(listingPhoto),
  videoUrl: urlField("Video link").refine(
    (v) => isPlayableVideoLink(v),
    "Use a YouTube, Vimeo or Google Drive video link (or a direct .mp4 link)",
  ),
  vrTourUrl: urlField("Virtual tour link"),
  qualityNarrative: requiredText("Quality narrative"),
  primaryEmail: emailField("Email"),
  primaryPhone: phoneField("Phone number"),
  internalReferenceCode: optionalText("Reference code", 100),
  licenseNumber: requiredText("License number"),

  // Location (shown on the public page with a map when a pin is set).
  country: optionalText("Country", 100),
  city: optionalText("City", 100),
  area: optionalText("Area", 150),
  address: optionalText("Address", 300),
  hideExactLocation: z.boolean().optional(),
  latitude: optionalNumberField("Latitude", { min: -90, max: 90 }),
  longitude: optionalNumberField("Longitude", { min: -180, max: 180 }),
  operatingBase: optionalText("Base", 150),
};

/** Location values every new listing starts with. */
export const defaultLocationValues = {
  country: "United Arab Emirates",
  city: "Dubai",
  area: "",
  address: "",
  hideExactLocation: false,
  operatingBase: "",
};

/** Photo rules: at least 5, at most 30, allowed type, 25 MB each before compression. */
export const validateListingPhotos = (
  data: { photos: ListingPhoto[]; latitude?: number; longitude?: number },
  ctx: z.RefinementCtx,
) => {
  const total = data.photos.length;
  if (total < MIN_LISTING_PHOTOS) {
    ctx.addIssue({
      code: "custom",
      message:
        total === 0
          ? `Add at least ${MIN_LISTING_PHOTOS} photos: a cover photo and ${MIN_LISTING_PHOTOS - 1} more`
          : `Add at least ${MIN_LISTING_PHOTOS} photos (${MIN_LISTING_PHOTOS - total} more needed)`,
      path: ["photos"],
    });
  }
  if (total > MAX_LISTING_PHOTOS) {
    ctx.addIssue({
      code: "custom",
      message: `You can add up to ${MAX_LISTING_PHOTOS} photos`,
      path: ["photos"],
    });
  }
  for (const photo of data.photos) {
    const file = photo.file;
    if (!file) continue;
    if (!LISTING_PHOTO_TYPES.includes(file.type)) {
      ctx.addIssue({
        code: "custom",
        message: `"${file.name}" must be a JPG, PNG or WebP image`,
        path: ["photos"],
      });
      return;
    }
    if (file.size > MAX_LISTING_PHOTO_BYTES) {
      ctx.addIssue({
        code: "custom",
        message: `"${file.name}" must be 25 MB or smaller`,
        path: ["photos"],
      });
      return;
    }
  }
  // A map pin needs both numbers.
  const hasLat = data.latitude !== undefined;
  const hasLng = data.longitude !== undefined;
  if (hasLat !== hasLng) {
    ctx.addIssue({
      code: "custom",
      message: "Enter both latitude and longitude, or leave both empty",
      path: [hasLat ? "longitude" : "latitude"],
    });
  }
};

/** The location fields as the listings API expects them. */
export const toLocationPayload = (data: {
  country?: string;
  city?: string;
  area?: string;
  address?: string;
  hideExactLocation?: boolean;
  latitude?: number;
  longitude?: number;
  operatingBase?: string;
}) => ({
  country: data.country?.trim() ?? "",
  city: data.city?.trim() ?? "",
  area: data.area?.trim() ?? "",
  address: data.address?.trim() ?? "",
  hideExactLocation: !!data.hideExactLocation,
  // null clears a pin that was removed while editing.
  latitude: data.latitude ?? null,
  longitude: data.longitude ?? null,
  operatingBase: data.operatingBase?.trim() ?? "",
});

/** Edit form: the location as the listing has it now. */
export const fromListingLocation = (listing: any) => ({
  country: listing.location?.country ?? "",
  city: listing.location?.city ?? "",
  area: listing.location?.area ?? "",
  address: listing.location?.address ?? "",
  hideExactLocation: !!listing.location?.hideExactLocation,
  latitude: listing.location?.lat ?? undefined,
  longitude: listing.location?.lng ?? undefined,
  operatingBase: listing.location?.operatingBase ?? "",
});

/** Edit form: the listing's photos, cover first. */
export const fromListingPhotos = (urls: string[] = []): ListingPhoto[] =>
  urls.map((url) => ({ id: url, url, preview: url }));

/** The fields every category sends the same way (photos go to the upload step). */
export const toCommonPayload = (data: {
  title: string;
  description: string;
  currency: string;
  photos: ListingPhoto[];
  videoUrl?: string;
  vrTourUrl?: string;
  primaryEmail: string;
  primaryPhone: string;
  internalReferenceCode?: string;
  licenseNumber: string;
  country?: string;
  city?: string;
  area?: string;
  address?: string;
  hideExactLocation?: boolean;
  latitude?: number;
  longitude?: number;
  operatingBase?: string;
}) => ({
  title: data.title,
  description: data.description,
  currency: data.currency,
  photos: data.photos,
  videoUrl: data.videoUrl ?? "",
  vrTourUrl: data.vrTourUrl ?? "",
  primaryEmail: data.primaryEmail,
  primaryPhone: data.primaryPhone,
  internalReferenceCode: data.internalReferenceCode ?? "",
  licenseNumber: data.licenseNumber,
  ...toLocationPayload(data),
});
