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
  helicopterSchema,
  defaultHelicopterValues,
  HelicopterFormData,
  HelicopterFormInput,
} from "@/lib/schemas/helicopterSchema";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import ImageWithLoader from "@/components/ui/ImageWithLoader";
import { HelicopterListingDict } from "@/types/dictionary";
import { Locale } from "@/i18n/config";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CompanyService } from "@/services/company.service";
import { helicopterService } from "@/services/helicopter.service";
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
  helicopterFieldMap,
} from "@/lib/utils/formErrors";

type HelicopterListingFormProps = {
  dict: HelicopterListingDict;
  locale: Locale;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  categories: {
    id: string;
    name: string;
  }[];
  mode?: "create" | "edit";
  listingId?: string;
  initialData?: Partial<HelicopterFormData>;
};

export default function HelicopterListingForm({
  dict,
  locale,
  categoryId,
  onCategoryChange,
  categories,
  mode = "create",
  listingId,
  initialData,
}: HelicopterListingFormProps) {
  const router = useRouter();

  const methods = useForm<HelicopterFormInput, unknown, HelicopterFormData>({
    resolver: zodResolver(helicopterSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      ...defaultHelicopterValues,
      ...initialData,
    } as HelicopterFormInput,
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const onSubmit: SubmitHandler<HelicopterFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const response =
        mode === "edit" && listingId
          ? await helicopterService.updateHelicopter(listingId, data)
          : await helicopterService.createHelicopter(data);
      if (response.success) {
        afterListingSaved(mode, listingId, response, router, "Helicopter listing published successfully!");
      } else {
        const unmapped = applyServerFieldErrors(
          methods.setError,
          response.fieldErrors,
          helicopterFieldMap,
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

  const onError: SubmitErrorHandler<HelicopterFormInput> = (errors) => {
    if (errors.photos) {
      toast.error(String(errors.photos.message ?? "Please check the photos"));
      document.getElementById("photos")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      toast.error(summarizeFieldErrors(errors));
    }
  };

  const t = dict.form;
  const isCharter = methods.watch("offeringType") === "CHARTER";

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
                  id="offeringType"
                  label={t.fields.offeringType}
                  options={[
                    { label: t.fields.offeringSale, value: "SALE" },
                    { label: t.fields.offeringCharter, value: "CHARTER" },
                  ]}
                  register={methods.register}
                  isMandatory
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                />
                {isCharter && (
                  <Select
                    id="rateBasis"
                    label={t.fields.rateBasis}
                    options={[
                      { label: t.fields.rateHour, value: "HOUR" },
                      { label: t.fields.rateDay, value: "DAY" },
                    ]}
                    register={methods.register}
                    isMandatory
                    labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  />
                )}
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="price"
                  type="number"
                  label={isCharter ? t.fields.charterRate : t.fields.price}
                  placeholder={t.placeholders.price}
                  register={methods.register}
                  isMandatory
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Select
                  id="currency"
                  label={t.fields.currency}
                  options={[
                    { label: "USD", value: "USD" },
                    { label: "EUR", value: "EUR" },
                    { label: "AED", value: "AED" },
                  ]}
                  register={methods.register}
                  isMandatory
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="licenseNumber"
                  label={t.fields.licenseNumber}
                  register={methods.register}
                  isMandatory
                />
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="space-y-8">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold border-b border-gray-50 pb-2">
                {t.sections.details}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="manufacturer"
                  label={t.fields.manufacturer}
                  placeholder={t.placeholders.manufacturer}
                  register={methods.register}
                  isMandatory
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="model"
                  label={t.fields.model}
                  placeholder={t.placeholders.model}
                  register={methods.register}
                  isMandatory
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="year"
                  type="number"
                  label={t.fields.year}
                  placeholder={t.placeholders.year}
                  register={methods.register}
                  isMandatory
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="rotorHours"
                  type="number"
                  label={t.fields.rotorHours}
                  placeholder={t.placeholders.rotorHours}
                  register={methods.register}
                  isMandatory
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="seating"
                  type="number"
                  label={t.fields.seating}
                  register={methods.register}
                  isMandatory
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="engineModel"
                  label={t.fields.engineModel}
                  register={methods.register}
                  isMandatory
                />
              </div>
            </div>

            {/* Maintenance & Avionics */}
            <div className="space-y-8">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold border-b border-gray-50 pb-2">
                {t.sections.maintenance}
              </h3>
              <Textarea
                id="interiorDetails"
                label={t.fields.interiorDetails}
                placeholder="Details about seating, layout, etc."
                register={methods.register}
                rows={2}
                className="text-xs font-sans text-gray-600"
                labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
              />
              <Textarea
                id="avionics"
                label={t.fields.avionics}
                placeholder="Avionics suite info..."
                register={methods.register}
                rows={2}
                className="text-xs font-sans text-gray-600"
                labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
              />
              <Textarea
                id="maintenance"
                label={t.fields.maintenance}
                placeholder="Latest inspections..."
                register={methods.register}
                rows={2}
                className="text-xs font-sans text-gray-600"
                labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
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

            {/* Registration & cabin */}
            <div className="space-y-8">
              <SectionTitle>Registration &amp; cabin</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input labelClassName={LABEL} id="serialNumber" label="Serial number" register={methods.register} />
                <Input labelClassName={LABEL} id="registrationTail" label="Registration (tail)" placeholder="e.g. A6-ABC" register={methods.register} />
                <Input labelClassName={LABEL} id="totalHours" type="number" label="Airframe total hours" register={methods.register} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input labelClassName={LABEL} id="interiorConfig" label="Cabin layout" placeholder="e.g. 6 passengers, forward-facing" register={methods.register} />
                <Input labelClassName={LABEL} id="lastInspectionDate" type="date" label="Last inspection date" register={methods.register} />
              </div>
              <Input labelClassName={LABEL} id="range" type="number" label="Range (nm)" register={methods.register} />
              <FeaturePicker
                name="amenities"
                label="Cabin features"
                suggestions={["Air conditioning", "Leather seats", "Noise-cancelling headsets", "Panoramic windows", "VIP interior", "Baggage compartment", "Hotel helipad pick-up", "Two pilots"]}
              />
            </div>

            <LocationFields baseLabel="Operating base (heliport)" basePlaceholder="e.g. Dubai Creek Heliport" />
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
