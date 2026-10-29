import { z } from "zod";
import { CATEGORY_LABELS, CategoryLabel } from "@/types/enums";

export const assetCategories = CATEGORY_LABELS;
export type AssetCategory = CategoryLabel;

export const onboardingStep1Schema = z.object({
  categories: z
    .array(z.enum(assetCategories))
    .min(1, "Please select at least one category"),
});

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

    if (cats.includes("Real Estate")) {
      if (!data.tradeLicense) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Real Estate: Trade license is required",
          path: ["tradeLicense"],
        });
      }
      if (!data.reraLicense) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Real Estate: Rera license is required",
          path: ["reraLicense"],
        });
      }
      if (!data.brn) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Real Estate: BRN is required",
          path: ["brn"],
        });
      }
    }

    if (cats.includes("Cars")) {
      if (!data.carTradeLicense) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cars: Trade license is required",
          path: ["carTradeLicense"],
        });
      }
      if (!data.carDealerLicense) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cars: Dealer license is required",
          path: ["carDealerLicense"],
        });
      }
      if (!data.showroomRegistration) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cars: Showroom registration is required",
          path: ["showroomRegistration"],
        });
      }
    }

    if (cats.includes("Yachts")) {
      if (!data.marineTradeLicense) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Yachts: Marine trade license is required",
          path: ["marineTradeLicense"],
        });
      }
      if (!data.boatDealerCertificate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Yachts: Boat dealer certificate is required",
          path: ["boatDealerCertificate"],
        });
      }
    }

    if (cats.includes("Private Jets / Helicopters")) {
      if (!data.aviationDealerLicense) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Jets: Aviation dealer license is required",
          path: ["aviationDealerLicense"],
        });
      }
      if (!data.aocDocument) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Jets: AOC Document is required",
          path: ["aocDocument"],
        });
      }
    }

    if (!data.ownerEmiratesId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Owner's Emirates ID is required",
        path: ["ownerEmiratesId"],
      });
    }
    if (!data.ownerPassport) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Owner's Passport is required",
        path: ["ownerPassport"],
      });
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
  companyName: z.string().min(2, "Company name is required"),
  description: z
    .string()
    .min(10, "Description should be at least 10 characters"),
  address: z.string().min(5, "Address is required"),
  contactEmails: z.string().email("Invalid email address"),
  phoneNumbers: z.string().min(7, "Phone number is required"),
  websiteUrl: z.string().url("Valid Website URL is required"),
  ownerEmail: z.string().email("Invalid owner email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  socialMediaLinks: z.object({
    instagram: z.string().url("Valid Instagram URL is required"),
    linkedin: z.string().url("Valid LinkedIn URL is required"),
    twitter: z.string().url("Valid Twitter URL is required"),
  }),
  languagesSpoken: z.array(z.string()).min(1, "Select at least one language"),
  companyLogo: z
    .any()
    .refine(
      (val) => val !== null && val !== undefined,
      "Company logo is required",
    ),
  coverImage: z
    .any()
    .refine(
      (val) => val !== null && val !== undefined,
      "Cover image is required",
    ),
  listingLogo: z.any().optional(),
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
