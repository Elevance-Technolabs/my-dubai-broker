"use client";
"use no memo";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  defaultOnboardingValues,
  ONBOARDING_DOCUMENT_LABELS,
  AssetCategory,
  assetCategories,
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
} from "@/lib/schemas/onboardingSchema";
import { OnboardingDict } from "@/types/dictionary";
import SectionWrapper from "../layout/SectionWrapper";
import { cn } from "@/lib/utils/cn";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Instagram,
  Linkedin,
  Twitter,
  Home,
  Anchor,
  Plane,
  Car,
  Gem,
  Lock as LockIcon,
  Mail as MailIcon,
} from "lucide-react";
import Input from "../ui/Input";
import FileUpload from "../ui/FileUpload";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { UploadService } from "@/services/upload.service";
import type { ImagePreset } from "@/lib/utils/imageOptimize";
import { CompanyService } from "@/services/company.service";
import {
  applyServerFieldErrors,
  summarizeFieldErrors,
} from "@/lib/utils/formErrors";
import { CATEGORY_LABEL_TO_ENUM, CategoryLabel } from "@/types/enums";

interface OnboardingWizardProps {
  dict: OnboardingDict;
}

// Backend onboarding field -> wizard form field. `*UploadId` fields map to the
// file input that produced them.
const ONBOARDING_FIELD_MAP: Record<string, string> = {
  name: "companyName",
  contactEmail: "contactEmails",
  contactPhone: "phoneNumbers",
  languages: "languagesSpoken",
  "socialMedia.instagram": "socialMediaLinks.instagram",
  "socialMedia.linkedin": "socialMediaLinks.linkedin",
  "socialMedia.twitter": "socialMediaLinks.twitter",
  tradeLicenseUploadId: "tradeLicense",
  reraLicenseUploadId: "reraLicense",
  emiratesIdUploadId: "ownerEmiratesId",
  passportUploadId: "ownerPassport",
  showroomRegistrationUploadId: "showroomRegistration",
  carDealerLicenseUploadId: "carDealerLicense",
  marineTradeLicenseUploadId: "marineTradeLicense",
  boatDealerCertificateUploadId: "boatDealerCertificate",
  aviationDealerLicenseUploadId: "aviationDealerLicense",
  aocOperatorDocumentUploadId: "aocDocument",
  carTradeLicenseUploadId: "carTradeLicense",
  collectiblesTradeLicenseUploadId: "collectiblesTradeLicense",
  consignmentAuthorityUploadId: "consignmentAuthority",
  companyLogoUploadId: "companyLogo",
  coverImageUploadId: "coverImage",
  listingLogoUploadId: "listingLogo",
};

const ONBOARDING_KNOWN_FIELDS = [
  ...Object.keys(defaultOnboardingValues),
  "socialMediaLinks.instagram",
  "socialMediaLinks.linkedin",
  "socialMediaLinks.twitter",
];

const STEP_FIELDS: Record<number, string[]> = {
  1: ["categories"],
  2: [
    "tradeLicense",
    "reraLicense",
    "brn",
    "carTradeLicense",
    "carDealerLicense",
    "showroomRegistration",
    "marineTradeLicense",
    "boatDealerCertificate",
    "aviationDealerLicense",
    "aocDocument",
    "collectiblesTradeLicense",
    "consignmentAuthority",
    "ownerEmiratesId",
    "ownerPassport",
    "documentDetails",
  ],
};
const stepForField = (field: string) =>
  Number(
    Object.entries(STEP_FIELDS).find(([, names]) =>
      names.includes(field.split(".")[0]),
    )?.[0] ?? 3,
  );

// Wizard file field -> backend document field (the key used for its details).
const DOCUMENT_BACKEND_FIELD: Record<string, string> = {
  tradeLicense: "tradeLicense",
  reraLicense: "reraLicense",
  carTradeLicense: "carTradeLicense",
  carDealerLicense: "carDealerLicense",
  showroomRegistration: "showroomRegistration",
  marineTradeLicense: "marineTradeLicense",
  boatDealerCertificate: "boatDealerCertificate",
  aviationDealerLicense: "aviationDealerLicense",
  aocDocument: "aocOperatorDocument",
  collectiblesTradeLicense: "collectiblesTradeLicense",
  consignmentAuthority: "consignmentAuthority",
  ownerEmiratesId: "emiratesId",
  ownerPassport: "passport",
};

const FIELD_LABELS: Record<string, string> = {
  ...ONBOARDING_DOCUMENT_LABELS,
  // "documentDetails.tradeLicense.expiryDate" → "Real estate trade license expiry date"
  ...Object.fromEntries(
    Object.entries(ONBOARDING_DOCUMENT_LABELS).flatMap(([key, label]) =>
      [
        ["documentNumber", "document number"],
        ["issuingAuthority", "issuing authority"],
        ["issueDate", "issue date"],
        ["expiryDate", "expiry date"],
      ].map(([field, name]) => [`documentDetails.${key}.${field}`, `${label} ${name}`]),
    ),
  ),
  companyName: "Company name",
  contactEmails: "Contact email",
  phoneNumbers: "Contact phone",
  websiteUrl: "Website",
  ownerEmail: "Owner email",
  languagesSpoken: "Languages",
  "socialMediaLinks.instagram": "Instagram link",
  "socialMediaLinks.linkedin": "LinkedIn link",
  "socialMediaLinks.twitter": "Twitter link",
  companyLogo: "Company logo",
  coverImage: "Cover image",
};

const steps = [
  { id: 1, title: "Categories" },
  { id: 2, title: "Verification" },
  { id: 3, title: "Profile" },
];

const categoryIcons: Record<AssetCategory, any> = {
  "Real Estate": Home,
  Cars: Car,
  Yachts: Anchor,
  "Private Aviation": Plane,
  Collectibles: Gem,
};

// Autosave — only JSON-safe, non-sensitive fields. File selections (licenses,
// logos, IDs) and the password are never persisted: browsers can't restore a
// real File across a reload/session even if we tried, and localStorage is
// the wrong place for a password. Returning to onboarding after leaving mid-
// way will restore everything text-based, but documents/photos need
// re-selecting — that's an inherent limit of browser file inputs, not a bug.
const ONBOARDING_DRAFT_KEY = "mdb_onboarding_draft";
const PERSISTED_FIELDS = [
  "categories",
  "brn",
  "companyName",
  "description",
  "address",
  "contactEmails",
  "phoneNumbers",
  "websiteUrl",
  "ownerEmail",
  "languagesSpoken",
  "socialMediaLinks",
  "documentDetails",
] as const;

// Fields checked for the completion-percentage indicator. Keep this in sync
// with what actually matters across the three steps — it's a simple filled
// vs. total ratio, not a weighted score.
const COMPLETION_FIELDS = [
  "categories",
  "companyName",
  "description",
  "address",
  "contactEmails",
  "phoneNumbers",
  "websiteUrl",
  "ownerEmail",
  "password",
  "languagesSpoken",
  "companyLogo",
  "coverImage",
  "ownerEmiratesId",
  "ownerPassport",
] as const;

function loadOnboardingDraft(): Record<string, any> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_DRAFT_KEY);
    const draft = raw ? JSON.parse(raw) : null;
    if (Array.isArray(draft?.categories)) {
      draft.categories = draft.categories.map((c: string) =>
        c === "Private Jets / Helicopters" ? "Private Aviation" : c,
      );
    }
    return draft;
  } catch {
    return null;
  }
}

export default function OnboardingWizard({ dict }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // The draft lives in localStorage, which the server can't read, so it is
  // restored after the first render — restoring during render made the
  // server and browser HTML differ (a hydration error).
  const [restoredDraft, setRestoredDraft] = useState(false);
  const draftLoaded = useRef(false);
  const { locale } = useParams();
  const router = useRouter();

  const methods = useForm({
    defaultValues: defaultOnboardingValues,
    resolver: zodResolver(
      currentStep === 1
        ? onboardingStep1Schema
        : currentStep === 2
          ? onboardingStep2Schema
          : onboardingStep3Schema,
    ),
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const {
    watch,
    setValue,
    setError,
    register,
    handleSubmit,
    formState: { errors, isValid },
    trigger,
  } = methods;
  const selectedCategories =
    (watch as any)("categories") || ([] as AssetCategory[]);

  const watchedValues = watch();

  useEffect(() => {
    const draft = loadOnboardingDraft();
    if (draft && Object.keys(draft).length > 1) {
      const { __step, ...values } = draft;
      methods.reset({ ...defaultOnboardingValues, ...values });
      if (__step) setCurrentStep(__step);
      setRestoredDraft(true);
    }
    draftLoaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave the JSON-safe subset of form state (+ current step) on every
  // change, debounced so we're not hitting localStorage on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (typeof window === "undefined" || !draftLoaded.current) return;
      const draft: Record<string, any> = { __step: currentStep };
      for (const field of PERSISTED_FIELDS) {
        draft[field] = (watchedValues as any)[field];
      }
      try {
        window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // Storage unavailable (private mode, quota, etc.) — autosave is a
        // convenience, not a requirement, so fail silently.
      }
    }, 500);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedValues), currentStep]);

  const completionPercent = useMemo(() => {
    const filled = COMPLETION_FIELDS.filter((field) => {
      const value = (watchedValues as any)[field];
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && value !== "";
    }).length;
    return Math.round((filled / COMPLETION_FIELDS.length) * 100);
  }, [watchedValues]);

  const clearOnboardingDraft = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    } catch {
      // ignore
    }
  };

  const nextStep = async () => {
    let isStepValid = false;

    if (currentStep === 1) {
      isStepValid = await trigger("categories");
    } else if (currentStep === 2) {
      // Step 2 validation now includes conditional file checks based on categories
      isStepValid = await trigger();
    }

    if (isStepValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else if (!isStepValid) {
      // trigger() above populated the inline errors, but formState still holds
      // the previous render's errors here — validate the current values again
      // so the toast names today's problems.
      const schema = currentStep === 1 ? onboardingStep1Schema : onboardingStep2Schema;
      const parsed = schema.safeParse(methods.getValues());
      const current: Record<string, any> = {};
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          let node = current;
          issue.path.forEach((key, i) => {
            const k = String(key);
            if (i === issue.path.length - 1) node[k] ??= { message: issue.message };
            else node = node[k] ??= {};
          });
        }
      }
      toast.error(summarizeFieldErrors(current, FIELD_LABELS));
    }
  };

  const onInvalid = (errors: any) => {
    toast.error(summarizeFieldErrors(errors, FIELD_LABELS));
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Abort the whole submission when a document fails to upload: continuing
  // would register the company without that document.
  const uploadFailure = (field: string, error: any) =>
    `${FIELD_LABELS[field] ?? field} upload failed: ${error?.message ?? "please try again"}`;

  // Logo and cover are shrunk to WebP before upload; licence documents are
  // uploaded exactly as chosen so reviewers can read them.
  const IMAGE_FIELD_PRESETS: Record<string, ImagePreset> = {
    companyLogo: "logo",
    listingLogo: "logo",
    coverImage: "photo",
  };

  const uploadFiles = async (data: any) => {
    const fileFields = [
      "tradeLicense",
      "reraLicense",
      "carTradeLicense",
      "carDealerLicense",
      "showroomRegistration",
      "marineTradeLicense",
      "boatDealerCertificate",
      "aviationDealerLicense",
      "aocDocument",
      "collectiblesTradeLicense",
      "consignmentAuthority",
      "ownerEmiratesId",
      "ownerPassport",
      "companyLogo",
      "coverImage",
      "listingLogo",
    ];

    const updatedData = { ...data };

    for (const field of fileFields) {
      const file = data[field];
      if (file instanceof File) {
        try {
          const uploaded = await UploadService.uploadImage(file, {
            isPublic: true,
            optimize: IMAGE_FIELD_PRESETS[field] ?? false,
          });
          updatedData[`${field}UploadId`] = uploaded.uploadId;
        } catch (error: any) {
          throw new Error(uploadFailure(field, error));
        }
      } else if (Array.isArray(file) && file[0] instanceof File) {
        try {
          const uploaded = await UploadService.uploadImage(file[0], {
            isPublic: true,
            optimize: IMAGE_FIELD_PRESETS[field] ?? false,
          });
          updatedData[`${field}UploadId`] = uploaded.uploadId;
        } catch (error: any) {
          throw new Error(uploadFailure(field, error));
        }
      }
    }
    return updatedData;
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    const loadingToast = toast.loading("Processing your onboarding...");

    try {
      // 1. Upload files
      const dataWithUrls = await uploadFiles(data);

      // 2. Map frontend fields to backend schema
      const backendData = {
        categories: (data.categories || []).map(
          (c: string) => CATEGORY_LABEL_TO_ENUM[c as CategoryLabel],
        ),

        // Each category's trade licence is its own document — sending only
        // the first one dropped e.g. the car licence for Real Estate + Cars.
        tradeLicenseUploadId: dataWithUrls.tradeLicenseUploadId,
        carTradeLicenseUploadId: dataWithUrls.carTradeLicenseUploadId,
        collectiblesTradeLicenseUploadId:
          dataWithUrls.collectiblesTradeLicenseUploadId,
        consignmentAuthorityUploadId: dataWithUrls.consignmentAuthorityUploadId,
        documentDetails: Object.fromEntries(
          Object.entries(data.documentDetails ?? {})
            .filter(([field, d]: [string, any]) =>
              dataWithUrls[`${field}UploadId`] &&
              d &&
              Object.values(d).some((v) => typeof v === "string" && v.trim()),
            )
            .map(([field, d]: [string, any]) => [
              DOCUMENT_BACKEND_FIELD[field] ?? field,
              Object.fromEntries(
                Object.entries(d).filter(([, v]) => typeof v === "string" && v.trim()),
              ),
            ]),
        ),
        reraLicenseUploadId: dataWithUrls.reraLicenseUploadId,
        brn: data.brn,
        emiratesIdUploadId: dataWithUrls.ownerEmiratesIdUploadId,
        passportUploadId: dataWithUrls.ownerPassportUploadId,
        showroomRegistrationUploadId: dataWithUrls.showroomRegistrationUploadId,
        carDealerLicenseUploadId: dataWithUrls.carDealerLicenseUploadId,
        marineTradeLicenseUploadId: dataWithUrls.marineTradeLicenseUploadId,
        boatDealerCertificateUploadId:
          dataWithUrls.boatDealerCertificateUploadId,
        aviationDealerLicenseUploadId:
          dataWithUrls.aviationDealerLicenseUploadId,
        aocOperatorDocumentUploadId: dataWithUrls.aocDocumentUploadId,

        name: data.companyName,
        description: data.description,
        address: data.address,
        contactEmail: data.contactEmails,
        contactPhone: data.phoneNumbers,
        websiteUrl: data.websiteUrl,
        languages: data.languagesSpoken || ["English"],
        ownerEmail: data.ownerEmail,
        password: data.password,
        companyLogoUploadId: dataWithUrls.companyLogoUploadId,
        coverImageUploadId: dataWithUrls.coverImageUploadId,
        listingLogoUploadId: dataWithUrls.listingLogoUploadId,
        socialMedia: {
          instagram: data.socialMediaLinks?.instagram || "",
          linkedin: data.socialMediaLinks?.linkedin || "",
          twitter: data.socialMediaLinks?.twitter || "",
        },
      };

      const response = await CompanyService.updateOnboarding(backendData);

      if (response.success) {
        toast.success("Onboarding completed successfully!", {
          id: loadingToast,
        });
        clearOnboardingDraft();
        router.push(`/${locale}/login`);
      } else {
        const unmapped = applyServerFieldErrors(
          setError,
          response.fieldErrors,
          ONBOARDING_FIELD_MAP,
          ONBOARDING_KNOWN_FIELDS,
        );
        // Jump to the earliest step that has a server-reported problem.
        const mappedNames = Object.keys(response.fieldErrors ?? {})
          .map((f) => (f in ONBOARDING_FIELD_MAP ? ONBOARDING_FIELD_MAP[f] : f))
          .filter((n) => ONBOARDING_KNOWN_FIELDS.includes(n));
        if (mappedNames.length > 0) {
          setCurrentStep(Math.min(...mappedNames.map(stepForField)));
        }
        toast.error(response.error || "Failed to complete onboarding", {
          id: loadingToast,
          description: unmapped.length ? unmapped.join("; ") : undefined,
        });
      }
    } catch (error: any) {
      console.error("Onboarding Error:", error);
      toast.error(error.message || "An error occurred during onboarding", {
        id: loadingToast,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="animate-fade-in-up">
            <h2 className="text-3xl font-canela text-slate-900 mb-4">
              {dict.steps.step1.title}
            </h2>
            <p className="text-slate-500 mb-10 font-satoshi">
              {dict.steps.step1.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assetCategories.map((category) => {
                const isSelected = selectedCategories.includes(category);
                return (
                  <label
                    key={category}
                    className={cn(
                      "flex items-center p-6 border rounded-xl cursor-pointer transition-all duration-300 group",
                      isSelected
                        ? "border-gold bg-gold/5 shadow-sm"
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isSelected}
                      onChange={() => {
                        const newCategories = isSelected
                          ? selectedCategories.filter(
                              (c: string) => c !== category,
                            )
                          : [...selectedCategories, category];
                        (setValue as any)("categories", newCategories as any, {
                          shouldValidate: true,
                        });
                      }}
                    />
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mr-5 transition-all duration-500",
                        isSelected
                          ? "bg-gold text-white shadow-lg shadow-gold/20"
                          : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600",
                      )}
                    >
                      {React.createElement(categoryIcons[category], {
                        size: 24,
                        strokeWidth: 1.5,
                      })}
                    </div>
                    <div className="flex-1">
                      <span
                        className={cn(
                          "font-bold block transition-colors",
                          isSelected
                            ? "text-slate-900"
                            : "text-slate-600 group-hover:text-slate-900",
                        )}
                      >
                        {category}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                        {isSelected ? "Selected" : "Click to select"}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full border flex items-center justify-center transition-colors shadow-sm",
                        isSelected
                          ? "bg-gold border-gold text-white"
                          : "border-slate-200 bg-white",
                      )}
                    >
                      {isSelected && <Check size={12} strokeWidth={4} />}
                    </div>
                  </label>
                );
              })}
            </div>
            {errors && (errors as any).categories && (
              <p className="text-red-500 text-xs mt-2">
                {(errors as any).categories.message}
              </p>
            )}
          </div>
        );
      case 2:
        return (
          <div className="animate-fade-in-up">
            <h2 className="text-3xl font-canela text-slate-900 mb-4">
              {dict.steps.step2.title}
            </h2>
            <p className="text-slate-500 mb-10 font-satoshi">
              {dict.steps.step2.description}
            </p>

            <div className="space-y-8">
              {selectedCategories.includes("Real Estate") && (
                <div className="p-6 border border-slate-100 rounded-2xl bg-white shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <span className="w-8 h-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center mr-3">
                      <Home size={18} strokeWidth={1.5} />
                    </span>
                    Real Estate Verification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
<FileUpload
                      id="tradeLicense"
                      label={dict.steps.step2.fields.tradeLicense}
                      accept=".pdf,.jpg,.jpeg,.png"
                      isMandatory
                    />
<DocumentDetailsFields field="tradeLicense" register={register} />
</div>
                    <div>
<FileUpload
                      id="reraLicense"
                      label={dict.steps.step2.fields.reraLicense}
                      accept=".pdf,.jpg,.jpeg,.png"
                      isMandatory
                    />
<DocumentDetailsFields field="reraLicense" register={register} />
</div>
                    <div className="md:col-span-2">
                      <Input
                        id="brn"
                        label={dict.steps.step2.fields.brn}
                        placeholder="Enter your BRN"
                        register={register}
                        isMandatory
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedCategories.includes("Cars") && (
                <div className="p-6 border border-slate-100 rounded-2xl bg-white shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mr-3">
                      <Car size={18} strokeWidth={1.5} />
                    </span>
                    Cars Verification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
<FileUpload
                      id="carTradeLicense"
                      label={dict.steps.step2.fields.tradeLicense}
                      accept=".pdf,.jpg,.jpeg,.png"
                      isMandatory
                    />
<DocumentDetailsFields field="carTradeLicense" register={register} />
</div>
                    <div>
<FileUpload
                      id="carDealerLicense"
                      label={dict.steps.step2.fields.carDealerLicense}
                      accept=".pdf,.jpg,.jpeg,.png"
                      isMandatory
                    />
<DocumentDetailsFields field="carDealerLicense" register={register} />
</div>
                    <div>
<FileUpload
                      id="showroomRegistration"
                      label={dict.steps.step2.fields.showroomRegistration}
                      accept=".pdf,.jpg,.jpeg,.png"
                      isMandatory
                    />
<DocumentDetailsFields field="showroomRegistration" register={register} />
</div>
                  </div>
                </div>
              )}

              {(selectedCategories.includes("Yachts") ||
                selectedCategories.includes("Private Aviation")) && (
                <div className="p-6 border border-slate-100 rounded-2xl bg-white shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center mr-3">
                      {selectedCategories.includes("Yachts") ? (
                        <Anchor size={18} strokeWidth={1.5} />
                      ) : (
                        <Plane size={18} strokeWidth={1.5} />
                      )}
                    </span>
                    Lifestyle Verification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedCategories.includes("Yachts") && (
                      <>
                        <div>
<FileUpload
                          id="marineTradeLicense"
                          label={dict.steps.step2.fields.marineTradeLicense}
                          accept=".pdf,.jpg,.jpeg,.png"
                          isMandatory
                        />
<DocumentDetailsFields field="marineTradeLicense" register={register} />
</div>
                        <div>
<FileUpload
                          id="boatDealerCertificate"
                          label={dict.steps.step2.fields.boatDealerCertificate}
                          accept=".pdf,.jpg,.jpeg,.png"
                          isMandatory
                        />
<DocumentDetailsFields field="boatDealerCertificate" register={register} />
</div>
                      </>
                    )}
                    {selectedCategories.includes(
                      "Private Aviation",
                    ) && (
                      <>
                        <div>
<FileUpload
                          id="aviationDealerLicense"
                          label={dict.steps.step2.fields.aviationDealerLicense}
                          accept=".pdf,.jpg,.jpeg,.png"
                          isMandatory
                        />
<DocumentDetailsFields field="aviationDealerLicense" register={register} />
</div>
                        <div>
<FileUpload
                          id="aocDocument"
                          label={dict.steps.step2.fields.aocDocument}
                          accept=".pdf,.jpg,.jpeg,.png"
                          isMandatory
                        />
<DocumentDetailsFields field="aocDocument" register={register} />
</div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {selectedCategories.includes("Collectibles") && (
                <div className="p-6 border border-slate-100 rounded-2xl bg-white shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mr-3">
                      <Gem size={18} strokeWidth={1.5} />
                    </span>
                    Collectibles Verification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
<FileUpload
                      id="collectiblesTradeLicense"
                      label="Trade License / Business Registration"
                      accept=".pdf,.jpg,.jpeg,.png"
                      isMandatory
                    />
<DocumentDetailsFields field="collectiblesTradeLicense" register={register} />
</div>
                    <div>
<FileUpload
                      id="consignmentAuthority"
                      label="Ownership or Consignment Authority"
                      accept=".pdf,.jpg,.jpeg,.png"
                      isMandatory
                    />
<DocumentDetailsFields field="consignmentAuthority" register={register} />
</div>
                  </div>
                </div>
              )}

              <div className="p-6 border border-slate-100 rounded-2xl bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  {dict.steps.step2.fields.ownerId}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
<FileUpload
                    id="ownerEmiratesId"
                    label="Emirates ID (Front & Back)"
                    accept=".pdf,.jpg,.jpeg,.png"
                    isMandatory
                  />
<DocumentDetailsFields field="ownerEmiratesId" register={register} />
</div>
                  <div>
<FileUpload
                    id="ownerPassport"
                    label="Passport Copy"
                    accept=".pdf,.jpg,.jpeg,.png"
                    isMandatory
                  />
<DocumentDetailsFields field="ownerPassport" register={register} />
</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="animate-fade-in-up">
            <h2 className="text-3xl font-canela text-slate-900 mb-4">
              {dict.steps.step3.title}
            </h2>
            <p className="text-slate-500 mb-10 font-satoshi">
              {dict.steps.step3.description}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="space-y-8">
                <FileUpload
                  id="companyLogo"
                  label={dict.steps.step3.fields.logo}
                  accept="image/jpeg,image/png,image/webp"
                  helperText="JPG, PNG or WebP, up to 25 MB"
                  className="aspect-square"
                />
                <FileUpload
                  id="coverImage"
                  label={dict.steps.step3.fields.cover}
                  accept="image/jpeg,image/png,image/webp"
                  helperText="JPG, PNG or WebP, up to 25 MB"
                  className="aspect-video"
                />
              </div>

              {/* Right Side: Form Fields */}
              <div className="lg:col-span-2 space-y-6">
                <Input
                  id="companyName"
                  label={dict.steps.step3.fields.companyName}
                  register={register}
                  isMandatory
                />
                <div className="space-y-1.5">
                  <label className="text-slate-900 font-medium text-sm mb-1.5">
                    {dict.steps.step3.fields.description}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...(register as any)("description")}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all min-h-[120px] font-satoshi text-sm",
                      (errors as any).description
                        ? "border-red-500"
                        : "border-slate-200",
                    )}
                    placeholder="Tell us about your company..."
                  />
                  {(errors as any).description && (
                    <p className="text-red-500 text-[10px] mt-1">
                      {(errors as any).description?.message}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="address"
                    label={dict.steps.step3.fields.address}
                    register={register}
                    placeholder="Search address via Google Maps..."
                    isMandatory
                  />
                  <MapPin
                    className="absolute right-4 top-[38px] text-slate-300"
                    size={18}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    id="contactEmails"
                    label={dict.steps.step3.fields.emails}
                    register={register}
                    isMandatory
                  />
                  <Input
                    id="phoneNumbers"
                    label={dict.steps.step3.fields.phones}
                    register={register}
                    isMandatory
                  />
                </div>
                <Input
                  id="websiteUrl"
                  label={dict.steps.step3.fields.website}
                  register={register}
                  placeholder="https://..."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    id="ownerEmail"
                    label={
                      dict.steps.step3.fields.ownerEmail || "Account Email"
                    }
                    register={register}
                    leftIcon={<MailIcon size={16} />}
                    placeholder="email@example.com"
                    isMandatory
                  />
                  <Input
                    id="password"
                    type="password"
                    label={
                      dict.steps.step3.fields.password || "Account Password"
                    }
                    register={register}
                    leftIcon={<LockIcon size={16} />}
                    placeholder="••••••••"
                    isMandatory
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-slate-900 font-medium text-sm">
                    {dict.steps.step3.fields.languages || "Languages Spoken"}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "English",
                      "Arabic",
                      "French",
                      "Russian",
                      "Chinese",
                      "Hindi",
                    ].map((lang) => {
                      const currentLangs =
                        (watch as any)("languagesSpoken") || [];
                      const isSelected = currentLangs.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            const nextLangs = isSelected
                              ? currentLangs.filter((l: string) => l !== lang)
                              : [...currentLangs, lang];
                            (setValue as any)("languagesSpoken", nextLangs, {
                              shouldValidate: true,
                            });
                          }}
                          className={cn(
                            "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                            isSelected
                              ? "bg-gold border-gold text-white shadow-md shadow-gold/20"
                              : "bg-white border-slate-200 text-slate-600 hover:border-gold/50",
                          )}
                        >
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                  {(errors as any).languagesSpoken && (
                    <p className="text-red-500 text-[10px] mt-1">
                      {(errors as any).languagesSpoken.message}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 mb-4">
                    {dict.steps.step3.fields.social}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      id="socialMediaLinks.instagram"
                      placeholder="Instagram URL (optional)"
                      register={register}
                      leftIcon={<Instagram size={16} />}
                    />
                    <Input
                      id="socialMediaLinks.linkedin"
                      placeholder="LinkedIn URL (optional)"
                      register={register}
                      leftIcon={<Linkedin size={16} />}
                    />
                    <Input
                      id="socialMediaLinks.twitter"
                      placeholder="Twitter URL (optional)"
                      register={register}
                      leftIcon={<Twitter size={16} />}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <SectionWrapper bg="bg-white">
      <div className="max-w-5xl mx-auto py-12 md:py-24">
        {restoredDraft && (
          <div className="mb-8 px-5 py-3 rounded-2xl bg-gold/5 border border-gold/20 text-xs text-slate-600 flex items-center justify-between">
            <span>Welcome back — we restored your progress. Documents and photos need re-selecting.</span>
            <button
              type="button"
              onClick={() => {
                clearOnboardingDraft();
                window.location.reload();
              }}
              className="text-slate-400 hover:text-slate-700 uppercase tracking-widest text-[10px] font-bold shrink-0 ml-4"
            >
              Start Over
            </button>
          </div>
        )}

        {/* Completion */}
        <div className="mb-6 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            Onboarding Progress
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-900 font-bold">
            {completionPercent}% Complete
          </span>
        </div>
        <div className="mb-14 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold transition-all duration-500 rounded-full"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        {/* Progress Bar */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step) => (
              <div
                key={step.id}
                className="flex flex-col items-center flex-1 relative"
              >
                {/* Connector Line */}
                {step.id !== 1 && (
                  <div
                    className={cn(
                      "absolute top-5 -left-1/2 w-full h-[2px] -translate-y-1/2 z-0",
                      currentStep >= step.id ? "bg-gold" : "bg-slate-100",
                    )}
                  />
                )}

                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-all duration-500",
                    currentStep === step.id
                      ? "bg-slate-900 text-white shadow-xl scale-110"
                      : currentStep > step.id
                        ? "bg-gold text-white"
                        : "bg-slate-50 text-slate-300 border border-slate-100",
                  )}
                >
                  {currentStep > step.id ? (
                    <Check size={18} strokeWidth={3} />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={cn(
                    "mt-3 text-[10px] uppercase tracking-widest font-bold transition-colors duration-500",
                    currentStep >= step.id
                      ? "text-slate-900"
                      : "text-slate-300",
                  )}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="min-h-[300px] mb-12">
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit, onInvalid)}>{renderStep()}</form>
          </FormProvider>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-8 border-t border-slate-100">
          <button
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
            className={cn(
              "flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-all",
              currentStep === 1
                ? "opacity-0 pointer-events-none"
                : "text-slate-400 hover:text-slate-900",
            )}
          >
            <ChevronLeft size={16} />
            {dict.buttons.back}
          </button>

          <div className="flex items-center gap-4">
            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                disabled={currentStep === 1 && selectedCategories.length === 0}
                className="bg-slate-900 text-white px-10 py-4 rounded-xl flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {dict.buttons.next}
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit(onSubmit, onInvalid)}
                disabled={isSubmitting}
                className="bg-gold text-white px-12 py-4 rounded-xl flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest hover:bg-gold-hover transition-all shadow-lg active:scale-95 shadow-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Processing..." : dict.buttons.complete}
                <Check size={16} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

/** Optional document number, issuing authority and dates under an upload. */
function DocumentDetailsFields({ field, register }: { field: string; register: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-gold"
      >
        {open ? "Hide document details" : "+ Add document number and dates (optional)"}
      </button>
      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <Input id={`documentDetails.${field}.documentNumber`} label="Document number" register={register} />
          <Input id={`documentDetails.${field}.issuingAuthority`} label="Issuing authority" register={register} />
          <Input id={`documentDetails.${field}.issueDate`} label="Issue date" type="date" register={register} />
          <Input id={`documentDetails.${field}.expiryDate`} label="Expiry date" type="date" register={register} />
        </div>
      )}
    </div>
  );
}
