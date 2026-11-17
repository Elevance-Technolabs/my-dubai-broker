"use client";
"use no memo";

import {
  useForm,
  FormProvider,
  SubmitHandler,
  SubmitErrorHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  realEstateSchema,
  defaultRealEstateValues,
  RealEstateFormData,
  RealEstateFormInput,
  PROPERTY_TYPES,
} from "@/lib/schemas/realEstateSchema";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import ImageWithLoader from "@/components/ui/ImageWithLoader";
import { RealEstateListingDict } from "@/types/dictionary";
import { Locale } from "@/i18n/config";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CompanyService } from "@/services/company.service";
import { realEstateService } from "@/services/realEstate.service";
import { toast } from "sonner";
import { afterListingSaved } from "@/lib/listingSaved";
import ListingPhotosField from "@/components/forms/listing/ListingPhotosField";
import {
  FeaturePicker,
  LABEL,
  ListingExtrasFields,
  LocationFields,
  SectionTitle,
} from "@/components/forms/listing/ListingSections";
import {
  applyServerFieldErrors,
  summarizeFieldErrors,
  realEstateFieldMap,
} from "@/lib/utils/formErrors";

type RealEstateListingFormProps = {
  dict: RealEstateListingDict;
  locale: Locale;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  categories: {
    id: string;
    name: string;
  }[];
  mode?: "create" | "edit";
  listingId?: string;
  initialData?: Partial<RealEstateFormData>;
};

export default function RealEstateListingForm({
  dict,
  locale,
  categoryId,
  onCategoryChange,
  categories,
  mode = "create",
  listingId,
  initialData,
}: RealEstateListingFormProps) {
  const router = useRouter();

  const methods = useForm<RealEstateFormInput, unknown, RealEstateFormData>({
    resolver: zodResolver(realEstateSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      ...defaultRealEstateValues,
      ...initialData,
    } as RealEstateFormInput,
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const onSubmit: SubmitHandler<RealEstateFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const response =
        mode === "edit" && listingId
          ? await realEstateService.updateRealEstate(listingId, data)
          : await realEstateService.createRealEstate(data);
      if (response.success) {
        afterListingSaved(mode, listingId, response, router, "Property listing published successfully!");
      } else {
        const unmapped = applyServerFieldErrors(
          methods.setError,
          response.fieldErrors,
          realEstateFieldMap,
          Object.keys(methods.getValues()),
        );
        toast.error(response.error || "Failed to save listing", {
          description: unmapped.length ? unmapped.join("; ") : undefined,
        });
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError: SubmitErrorHandler<RealEstateFormInput> = (errors) => {
    if (errors.photos) {
      toast.error(String(errors.photos.message ?? "Please check the photos"));
      document.getElementById("photos")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      toast.error(summarizeFieldErrors(errors));
    }
  };

  const t = dict.form;
  const offering = methods.watch("status");
  const PRICE_LABEL: Record<string, string> = {
    RENT_YEARLY: "Rent per year",
    RENT_MONTHLY: "Rent per month",
    SHORT_TERM: "Price per night",
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit, onError)}
        className="bg-white shadow-[0_2px_20px_rgba(0,0,0,0.01)] border border-gray-50"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 items-start">
          {/* Left Column: Details */}
          <div className="lg:col-span-7 p-12 space-y-12">
            {/* General Information */}
            <div className="space-y-8">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold border-b border-gray-50 pb-2">
                {t.sections.general}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Select
                  id="assetCategory"
                  label={t.fields.category}
                  options={categories.map((c) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                  value={categoryId}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  isMandatory
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                />
                <Select
                  id="status"
                  label="Listing type"
                  options={[
                    { label: "For sale", value: "SALE" },
                    { label: "Off-plan", value: "OFF_PLAN" },
                    { label: "For rent, yearly", value: "RENT_YEARLY" },
                    { label: "For rent, monthly", value: "RENT_MONTHLY" },
                    { label: "Short stay, per night", value: "SHORT_TERM" },
                  ]}
                  register={methods.register}
                  isMandatory
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                />
              </div>

              <Input
                labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                id="title"
                label={t.fields.title}
                placeholder={t.placeholders.title}
                register={methods.register}
                isMandatory
                className="text-xl font-serif"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="price"
                  type="number"
                  label={PRICE_LABEL[offering] ?? t.fields.price}
                  placeholder={t.placeholders.price}
                  register={methods.register}
                  isMandatory
                />
                <Select
                  id="currency"
                  label={t.fields.currency}
                  options={[
                    { label: "AED", value: "AED" },
                    { label: "USD", value: "USD" },
                  ]}
                  register={methods.register}
                  isMandatory
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                />
                <Select
                  id="propertyType"
                  label={t.fields.propertyType}
                  options={PROPERTY_TYPES.map((p) => ({ label: p.label, value: p.value }))}
                  register={methods.register}
                  isMandatory
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                />
              </div>
            </div>

            {/* Property Details */}
            <div className="space-y-8">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold border-b border-gray-50 pb-2">
                {t.sections.details}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="bedrooms"
                  type="number"
                  label={t.fields.bedrooms}
                  register={methods.register}
                  isMandatory
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="bathrooms"
                  type="number"
                  label={t.fields.bathrooms}
                  register={methods.register}
                  isMandatory
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="builtUpArea"
                  type="number"
                  label={t.fields.builtUpArea}
                  register={methods.register}
                  isMandatory
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="plotArea"
                  type="number"
                  label={t.fields.plotArea}
                  register={methods.register}
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="floor"
                  type="number"
                  label={t.fields.floor}
                  register={methods.register}
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="parking"
                  type="number"
                  label={t.fields.parking}
                  register={methods.register}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="developer"
                  label={t.fields.developer}
                  placeholder={t.placeholders.developer}
                  register={methods.register}
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="paymentPlan"
                  label={t.fields.paymentPlan}
                  placeholder={t.placeholders.paymentPlan}
                  register={methods.register}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="permitNumber"
                  label={t.fields.permitNumber}
                  register={methods.register}
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="licenseNumber"
                  label={t.fields.licenseNumber}
                  register={methods.register}
                  isMandatory
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input labelClassName={LABEL} id="building" label="Building / project" placeholder="e.g. Signature Villas, Frond G" register={methods.register} />
                <Input labelClassName={LABEL} id="totalFloors" type="number" label="Total floors" register={methods.register} />
                <Input labelClassName={LABEL} id="serviceCharge" type="number" label="Service charge (per year)" register={methods.register} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Select
                  id="completionStatus"
                  label="Completion status"
                  options={[
                    { label: "Ready", value: "ready" },
                    { label: "Off-plan", value: "off-plan" },
                    { label: "Under construction", value: "under-construction" },
                  ]}
                  register={methods.register}
                  labelClassName={LABEL}
                />
              </div>
              <div className="flex items-center space-x-3 rtl:space-x-reverse pt-2">
                <input
                  type="checkbox"
                  id="furnished"
                  {...methods.register("furnished")}
                  className="w-4 h-4 accent-luxury-gold"
                />
                <label
                  htmlFor="furnished"
                  className="text-[10px] uppercase tracking-widest text-gray-500"
                >
                  {t.fields.furnished}
                </label>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-8">
              <SectionTitle>{t.sections.amenities}</SectionTitle>
              <FeaturePicker
                name="views"
                label={t.fields.views}
                suggestions={["Sea", "Burj Khalifa", "Skyline", "Marina", "Golf course", "Park", "Lagoon", "Community"]}
              />
              <FeaturePicker
                name="indoor"
                label={t.fields.indoor}
                suggestions={["Maid's room", "Study", "Walk-in closet", "Private elevator", "Home cinema", "Private gym", "Built-in wardrobes", "Smart home", "Central A/C"]}
              />
              <FeaturePicker
                name="outdoor"
                label={t.fields.outdoor}
                suggestions={["Private pool", "Private garden", "Balcony", "Terrace", "Roof terrace", "BBQ area", "Private beach access"]}
              />
              <FeaturePicker
                name="communityFeatures"
                label={t.fields.community}
                suggestions={["24/7 security", "Gated community", "Shared pool", "Gym", "Kids play area", "Retail nearby", "Schools nearby", "Metro nearby"]}
              />
              <FeaturePicker
                name="amenities"
                label="Building amenities"
                suggestions={["Covered parking", "Concierge", "Valet", "Spa", "Pets allowed", "Backup generator"]}
              />
              <FeaturePicker
                name="propertyTags"
                label={t.fields.propertyTags}
                suggestions={["Vacant on transfer", "Upgraded", "Brand new", "Tenanted", "Golden Visa eligible", "Beachfront"]}
              />
            </div>

            {/* Narrative */}
            <div className="space-y-6">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold border-b border-gray-50 pb-2">
                {t.sections.narrative}
              </h3>
              <Textarea
                id="qualityNarrative"
                label={t.fields.qualityNarrative}
                placeholder="Enter highlights..."
                register={methods.register}
                rows={2}
                className="text-xs font-sans text-gray-600"
                labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                isMandatory
              />
              <Textarea
                id="description"
                label={t.fields.description}
                placeholder={t.placeholders.description}
                register={methods.register}
                isMandatory
                rows={6}
                className="text-base font-serif leading-relaxed"
                labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
              />
            </div>

            <LocationFields />
            <ListingExtrasFields />

            {/* Contact Information */}
            <div className="space-y-8">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold border-b border-gray-50 pb-2">
                {t.sections.contact}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="primaryEmail"
                  type="email"
                  label={t.fields.primaryEmail}
                  placeholder={t.placeholders.email}
                  register={methods.register}
                  isMandatory
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="primaryPhone"
                  type="tel"
                  label={t.fields.primaryPhone}
                  placeholder={t.placeholders.phone}
                  register={methods.register}
                  isMandatory
                />
              </div>
            </div>
          </div>

          {/* Right Column: Visual Assets */}
          <div className="lg:col-span-5 p-12 bg-gray-50/50 flex flex-col border-l border-gray-100 lg:sticky lg:top-0 lg:h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar">
            <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-8">
              {t.sections.media}
            </h3>

            <div className="space-y-4 mb-auto">
              <ListingPhotosField />
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <Button
                type="submit"
                variant="dark"
                className="w-full shadow-lg hover:shadow-xl h-12 text-[10px] tracking-widest uppercase font-bold"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? mode === "edit"
                    ? "Saving..."
                    : t.submitting
                  : mode === "edit"
                    ? "Save Changes"
                    : t.submit}
              </Button>
              <p className="text-center text-[9px] text-gray-300 uppercase tracking-widest mt-4">
                {mode === "edit"
                  ? "Changes to a live listing go live after review"
                  : "Listing pending admin verification"}
              </p>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
