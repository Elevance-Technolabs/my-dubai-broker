import { z } from "zod";
import { CATEGORY_LABELS, CategoryLabel } from "@/types/enums";
import { fileField } from "./common";

export const assetCategories = CATEGORY_LABELS;
export type AssetCategory = CategoryLabel;

export const onboardingStep1Schema = z.object({
  categories: z
    .array(z.enum(assetCategories))
    .min(1, "At least one category must be selected"),
});

// One label per document, used both in the schema messages and by the
// wizard's error toast, so the toast doesn't prefix a second, different name.
export const ONBOARDING_DOCUMENT_LABELS: Record<string, string> = {
  tradeLicense: "Real estate trade license",
  reraLicense: "RERA license",
  brn: "BRN",
  carTradeLicense: "Car trade license",
  carDealerLicense: "Car dealer license",
  showroomRegistration: "Showroom registration",
  marineTradeLicense: "Marine trade license",
  boatDealerCertificate: "Boat dealer certificate",
  aviationDealerLicense: "Aviation dealer license",
  aocDocument: "AOC document",
  ownerEmiratesId: "Emirates ID",
  ownerPassport: "Passport",
};

export const onboardingStep2Schema = z
  .object({
    categories: z.array(z.enum(assetCategories)).optional(), // To context-aware validation

    // Real Estate
    tradeLicense: z.any().optional(),
    reraLicense: z.any().optional(),
    brn: z.string().optional(),

    // Cars
    carTradeLicense: z.any().optional(),
    carDealerLicense: z.any().optional(),
    showroomRegistration: z.any().optional(),

    // Yachts
    marineTradeLicense: z.any().optional(),
    boatDealerCertificate: z.any().optional(),

    // Jets
    aviationDealerLicense: z.any().optional(),
    aocDocument: z.any().optional(),

    // Common
    ownerEmiratesId: z.any().optional(),
    ownerPassport: z.any().optional(),
  })
  .superRefine((data, ctx) => {
    const cats = data.categories || [];
    const values = data as Record<string, unknown>;

    const requireDocs = (keys: string[]) => {
      for (const key of keys) {
        if (!values[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${ONBOARDING_DOCUMENT_LABELS[key]} is required`,
            path: [key],
          });
        }
      }
    };

    if (cats.includes("Real Estate")) {
      requireDocs(["tradeLicense", "reraLicense", "brn"]);
    }
    if (cats.includes("Cars")) {
      requireDocs(["carTradeLicense", "carDealerLicense", "showroomRegistration"]);
    }
    if (cats.includes("Yachts")) {
      requireDocs(["marineTradeLicense", "boatDealerCertificate"]);
    }
    if (cats.includes("Private Jets / Helicopters")) {
      requireDocs(["aviationDealerLicense", "aocDocument"]);
    }
    requireDocs(["ownerEmiratesId", "ownerPassport"]);

    // Type / size of anything that was picked (same limits as the backend presign).
    for (const [key, label] of Object.entries(ONBOARDING_DOCUMENT_LABELS)) {
      if (key === "brn") continue; // text field, not a file
      const value = values[key];
      if (!value) continue;
      const res = fileField(label, { allowPdf: true }).safeParse(value);
      if (!res.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: res.error.issues[0].message,
          path: [key],
        });
      }
    }
  });

export const onboardingStep3Schema = z.object({
  // Preserving data from previous steps
  categories: z.array(z.enum(assetCategories)).optional(),
  tradeLicense: z.any().optional(),
  reraLicense: z.any().optional(),
  brn: z.string().optional(),
  carTradeLicense: z.any().optional(),
  carDealerLicense: z.any().optional(),
  showroomRegistration: z.any().optional(),
  marineTradeLicense: z.any().optional(),
  boatDealerCertificate: z.any().optional(),
  aviationDealerLicense: z.any().optional(),
  aocDocument: z.any().optional(),
  ownerEmiratesId: z.any().optional(),
  ownerPassport: z.any().optional(),

  // Step 3 specific fields
  companyName: z.string().min(1, "Company name is required"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  contactEmails: z
    .string()
    .email("Contact email must be a valid email address"),
  phoneNumbers: z.string().min(5, "Contact phone must be at least 5 characters"),
  websiteUrl: z
    .string()
    .url("Website must be a valid URL (including https://)")
    .or(z.literal("")),
  ownerEmail: z.string().email("Owner email must be a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  socialMediaLinks: z.object({
    instagram: z
      .string()
      .url("Instagram link must be a valid URL (including https://)")
      .or(z.literal("")),
    linkedin: z
      .string()
      .url("LinkedIn link must be a valid URL (including https://)")
      .or(z.literal("")),
    twitter: z
      .string()
      .url("Twitter link must be a valid URL (including https://)")
      .or(z.literal("")),
  }),
  languagesSpoken: z.array(z.string()).min(1, "At least one language must be selected"),
  companyLogo: fileField("Company logo"),
  coverImage: fileField("Cover image"),
  listingLogo: fileField("Listing logo", { required: false }),
});

export type Step1Data = z.infer<typeof onboardingStep1Schema>;
export type Step2Data = z.infer<typeof onboardingStep2Schema>;
export type Step3Data = z.infer<typeof onboardingStep3Schema>;

export const defaultOnboardingValues = {
  categories: [],
  // Step 2
  tradeLicense: null,
  reraLicense: null,
  brn: "",
  carTradeLicense: null,
  carDealerLicense: null,
  showroomRegistration: null,
  marineTradeLicense: null,
  boatDealerCertificate: null,
  aviationDealerLicense: null,
  aocDocument: null,
  ownerEmiratesId: null,
  ownerPassport: null,
  // Step 4
  companyName: "",
  description: "",
  address: "",
  contactEmails: "",
  phoneNumbers: "",
  websiteUrl: "",
  languagesSpoken: ["English"],
  ownerEmail: "",
  password: "",
  socialMediaLinks: {
    instagram: "",
    linkedin: "",
    twitter: "",
  },
  companyLogo: null,
  coverImage: null,
  listingLogo: null,
};
