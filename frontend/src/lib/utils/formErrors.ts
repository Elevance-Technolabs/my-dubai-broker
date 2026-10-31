import type { FieldErrors, FieldValues, Path, UseFormSetError } from "react-hook-form";

/**
 * Push backend field errors (dot-path -> message) onto a react-hook-form form.
 *
 * `fieldMap` translates backend field names to form field names (e.g.
 * `salePrice` -> `price`); a value of `null` drops the error. Errors whose
 * (mapped) name isn't a field in the form can't be shown inline, so their
 * messages are returned for the caller to surface (e.g. in a toast).
 */
export function applyServerFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fieldErrors: Record<string, string> | undefined,
  fieldMap: Record<string, string | null> = {},
  knownFields?: ReadonlyArray<string>,
): string[] {
  const unmapped: string[] = [];
  if (!fieldErrors) return unmapped;

  for (const [field, message] of Object.entries(fieldErrors)) {
    let name: string | null | undefined =
      field in fieldMap ? fieldMap[field] : field;
    // `details.foo` that has no explicit mapping: try a form field named `foo`.
    if (
      !(field in fieldMap) &&
      field.startsWith("details.") &&
      (!knownFields || !knownFields.includes(field))
    ) {
      name = field.slice("details.".length);
    }
    const exists =
      name != null && (!knownFields || knownFields.includes(name));
    if (!exists || name == null) {
      unmapped.push(message);
      continue;
    }
    setError(name as Path<T>, { type: "server", message });
  }
  return unmapped;
}

type AnyErrors = FieldErrors<any> | Record<string, any>;

function humanize(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function collect(
  errors: AnyErrors,
  path: string[],
  out: { path: string; message: string }[],
) {
  if (!errors || typeof errors !== "object") return;
  if (typeof (errors as any).message === "string" && (errors as any).message) {
    out.push({ path: path.join("."), message: (errors as any).message });
    return;
  }
  for (const [key, value] of Object.entries(errors)) {
    if (key === "ref" || key === "type" || key === "types") continue;
    if (value && typeof value === "object") collect(value, [...path, key], out);
  }
}

/**
 * Turn react-hook-form `errors` into a short string naming up to three
 * invalid fields with their messages. Handles nested objects and arrays.
 */
export function summarizeFieldErrors(
  errors: AnyErrors,
  labels: Record<string, string> = {},
): string {
  const items: { path: string; message: string }[] = [];
  collect(errors, [], items);
  if (items.length === 0) return "Please fill in all required fields correctly.";

  const shown = items.slice(0, 3).map(({ path, message }) => {
    const last = path.split(".").filter((p) => !/^\d+$/.test(p)).pop() ?? path;
    const label = labels[path] ?? labels[last] ?? humanize(last);
    // Messages that already start with the label read better on their own.
    return message.toLowerCase().startsWith(label.toLowerCase())
      ? message
      : `${label}: ${message}`;
  });
  const more = items.length > 3 ? ` (+${items.length - 3} more)` : "";
  return shown.join("; ") + more;
}

// ─── Backend listing field -> form field maps ───────────────────────────────

const LISTING_BASE_MAP: Record<string, string> = {
  salePrice: "price",
  charterRate: "price",
  dailyRate: "price",
  monthlyRent: "price",
  annualRent: "price",
  photoUploadIds: "photoFiles",
};

export const carFieldMap: Record<string, string> = {
  ...LISTING_BASE_MAP,
  "details.make": "brand",
  "details.exteriorColor": "color",
};

export const yachtFieldMap: Record<string, string> = {
  ...LISTING_BASE_MAP,
  "details.builder": "make",
  "details.lengthFt": "length",
  "details.beamFt": "beam",
  "details.hullMaterial": "materials",
};

export const realEstateFieldMap: Record<string, string> = {
  ...LISTING_BASE_MAP,
  "details.communityFeatures": "community",
};

export const jetFieldMap: Record<string, string> = {
  ...LISTING_BASE_MAP,
  "details.rangeNm": "range",
};

export const helicopterFieldMap: Record<string, string> = {
  ...LISTING_BASE_MAP,
  "details.engineHours": "rotorHours",
  "details.passengerCapacity": "seating",
  "details.maintenanceHistory": "maintenance",
};
