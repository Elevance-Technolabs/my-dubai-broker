import { z } from "zod";

// Shared zod building blocks so every form words its errors the same way.
// Rules here are never stricter than the backend's, except phone format and
// URL scheme which the product asks the client to enforce.

const isBlank = (v: unknown) =>
  v === "" ||
  v === null ||
  v === undefined ||
  (typeof v === "number" && Number.isNaN(v));

export const requiredText = (
  label: string,
  { min = 1, max }: { min?: number; max?: number } = {},
) => {
  let s = z.string({ error: `${label} is required` }).min(1, `${label} is required`);
  if (min > 1) {
    s = s.min(min, `${label} must be at least ${min} characters`);
  }
  if (max) {
    s = s.max(max, `${label} must be at most ${max} characters`);
  }
  return s;
};

export const optionalText = (label: string, max?: number) => {
  const s = z.string();
  return (max ? s.max(max, `${label} must be at most ${max} characters`) : s).optional();
};

export const emailField = (label = "Email") =>
  z
    .string({ error: `${label} is required` })
    .min(1, `${label} is required`)
    .email("Enter a valid email address");

const PHONE_CHARS = /^\+?[\d\s\-()]+$/;
const phoneProblem = (v: string) => {
  if (!PHONE_CHARS.test(v)) return "can only contain digits, +, spaces and dashes";
  const digits = v.replace(/\D/g, "").length;
  if (digits < 7 || digits > 15) return "must have between 7 and 15 digits";
  return null;
};

export const phoneField = (label = "Phone number") =>
  z
    .string({ error: `${label} is required` })
    .min(1, `${label} is required`)
    .superRefine((v, ctx) => {
      if (!v) return;
      const problem = phoneProblem(v);
      if (problem) ctx.addIssue({ code: "custom", message: `${label} ${problem}` });
    });

export const optionalPhoneField = (label = "Phone number") =>
  z
    .string()
    .superRefine((v, ctx) => {
      // The phone widget leaves a bare country code behind; treat as empty.
      if (!v || v.replace(/\D/g, "").length <= 3) return;
      const problem = phoneProblem(v);
      if (problem) ctx.addIssue({ code: "custom", message: `${label} ${problem}` });
    })
    .optional();

const URL_MESSAGE = (label: string) =>
  `${label} must be a valid URL starting with http:// or https://`;

const isHttpUrl = (v: string) => {
  if (!/^https?:\/\//i.test(v)) return false;
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
};

/** Optional URL: empty is fine, otherwise must be http(s). */
export const urlField = (label: string) =>
  z
    .string()
    .refine((v) => v === "" || isHttpUrl(v), URL_MESSAGE(label))
    .optional();

export const requiredUrlField = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .min(1, `${label} is required`)
    .refine(isHttpUrl, URL_MESSAGE(label));

type NumberOpts = {
  min?: number;
  max?: number;
  /** strictly greater than */
  gt?: number;
  int?: boolean;
};

const buildNumber = (
  label: string,
  { min, max, gt, int }: NumberOpts,
) => {
  let n = z.number({
    error: (iss) =>
      iss.input === undefined
        ? `${label} is required`
        : `${label} must be a number`,
  });
  if (int) n = n.int(`${label} must be a whole number`);
  if (gt !== undefined) n = n.gt(gt, `${label} must be greater than ${gt}`);
  if (min !== undefined) n = n.min(min, `${label} must be at least ${min}`);
  if (max !== undefined) n = n.max(max, `${label} must be at most ${max}`);
  return n;
};

const toNumber = (v: unknown) =>
  isBlank(v) || (typeof v === "string" && v.trim() === "")
    ? undefined
    : typeof v === "string"
      ? Number(v)
      : v;

/**
 * Number from an <input>: "" -> "<Label> is required" (not NaN / not 0),
 * garbage -> "<Label> must be a number".
 */
export const numberField = (label: string, opts: NumberOpts = {}) =>
  z.preprocess(toNumber, buildNumber(label, opts));

export const optionalNumberField = (label: string, opts: NumberOpts = {}) =>
  z.preprocess(toNumber, buildNumber(label, opts).optional());

export const yearField = (label = "Year") =>
  numberField(label, {
    int: true,
    min: 1900,
    max: new Date().getFullYear() + 1,
  });

export const selectField = (label: string) =>
  z
    .string({ error: `Please select a ${label.toLowerCase()}` })
    .min(1, `Please select a ${label.toLowerCase()}`);

export const enumField = <const T extends readonly [string, ...string[]]>(
  label: string,
  values: T,
) =>
  z.enum(values, {
    error: () => `Please select a ${label.toLowerCase()}`,
  });

export const passwordField = (label = "Password") =>
  z
    .string({ error: `${label} is required` })
    .min(1, `${label} is required`)
    .min(8, `${label} must be at least 8 characters`);

/** A required File with the same type/size limits the backend presign enforces. */
export const fileField = (
  label: string,
  { allowPdf = false, required = true }: { allowPdf?: boolean; required?: boolean } = {},
) =>
  z.any().superRefine((val, ctx) => {
    if (val === null || val === undefined || (Array.isArray(val) && val.length === 0)) {
      if (required) ctx.addIssue({ code: "custom", message: `${label} is required` });
      return;
    }
    const file: unknown = Array.isArray(val) ? val[0] : val;
    if (!(file instanceof File)) return;
    const types = allowPdf
      ? ["image/jpeg", "image/png", "image/webp", "application/pdf"]
      : ["image/jpeg", "image/png", "image/webp"];
    if (!types.includes(file.type)) {
      ctx.addIssue({
        code: "custom",
        message: allowPdf
          ? `${label} must be a JPG, PNG, WebP or PDF file`
          : `${label} must be a JPG, PNG or WebP image`,
      });
    } else if (file.size > 5 * 1024 * 1024) {
      ctx.addIssue({ code: "custom", message: `${label} must be 5 MB or smaller` });
    }
  });
