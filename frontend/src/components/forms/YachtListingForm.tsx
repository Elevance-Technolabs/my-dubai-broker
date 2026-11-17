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
  yachtSchema,
  defaultYachtValues,
  YachtFormData,
  YachtFormInput,
} from "@/lib/schemas/yachtSchema";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import ImageWithLoader from "@/components/ui/ImageWithLoader";
import { YachtListingDict } from "@/types/dictionary";
import { Locale } from "@/i18n/config";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CompanyService } from "@/services/company.service";
import { yachtService } from "@/services/yacht.service"; // Corrected import path/name if needed
import { toast } from "sonner";
import { afterListingSaved } from "@/lib/listingSaved";
import ListingPhotosField from "@/components/forms/listing/ListingPhotosField";
import {
  CheckboxField,
  FeaturePicker,
  LABEL,
  ListingExtrasFields,
  LocationFields,
  SectionTitle,
} from "@/components/forms/listing/ListingSections";
import {
  applyServerFieldErrors,
  summarizeFieldErrors,
  yachtFieldMap,
} from "@/lib/utils/formErrors";

type YachtListingFormProps = {
  dict: YachtListingDict;
  locale: Locale;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  categories: {
    id: string;
    name: string;
  }[];
  mode?: "create" | "edit";
  listingId?: string;
  initialData?: Partial<YachtFormData>;
};

export default function YachtListingForm({
  dict,
  locale,
  categoryId,
  onCategoryChange,
  categories,
  mode = "create",
  listingId,
  initialData,
}: YachtListingFormProps) {
  const router = useRouter();

  const methods = useForm<YachtFormInput, unknown, YachtFormData>({
    resolver: zodResolver(yachtSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      ...defaultYachtValues,
      ...initialData,
    } as YachtFormInput,
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const onSubmit: SubmitHandler<YachtFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const response =
        mode === "edit" && listingId
          ? await yachtService.updateYacht(listingId, data)
          : await yachtService.createYacht(data);
      if (response.success) {
        afterListingSaved(mode, listingId, response, router, "Yacht listing published successfully!");
      } else {
        const unmapped = applyServerFieldErrors(
          methods.setError,
          response.fieldErrors,
          yachtFieldMap,
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

  const onError: SubmitErrorHandler<YachtFormInput> = (errors) => {
    if (errors.photos) {
      toast.error(String(errors.photos.message ?? "Please check the photos"));
      document.getElementById("photos")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      toast.error(summarizeFieldErrors(errors));
    }
  };

  const t = dict.form;
  const isCharter = methods.watch("offeringType") === "CHARTER";
  const rateBasis = methods.watch("rateBasis");

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit, onError)}
        className="bg-white shadow-[0_2px_20px_rgba(0,0,0,0.01)] border border-gray-50"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 items-start">
          {/* Left Column: Details */}
          <div className="lg:col-span-7 p-12 space-y-12">
            {/* Identification */}
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
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="price"
                  type="number"
                  label={isCharter ? (rateBasis === "HOUR" ? "Charter rate per hour" : "Charter rate per day") : t.fields.price}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Select
                  id="offeringType"
                  label="Listing type"
                  options={[
                    { label: "For sale", value: "SALE" },
                    { label: "For charter", value: "CHARTER" },
                  ]}
                  register={methods.register}
                  isMandatory
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                />
                {isCharter && (
                  <Select
                    id="rateBasis"
                    label="Charter rate per"
                    options={[
                      { label: "Day", value: "DAY" },
                      { label: "Hour", value: "HOUR" },
                    ]}
                    register={methods.register}
                    isMandatory
                    labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  />
                )}
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
              </div>
            </div>

            {/* Yacht Details */}
            <div className="space-y-8">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold border-b border-gray-50 pb-2">
                {t.sections.details}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="make"
                  label={t.fields.make}
                  placeholder={t.placeholders.make}
                  register={methods.register}
                  isMandatory
                />
                <Select
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="yachtType"
                  label={t.fields.type}
                  options={[
                    { label: "Motor yacht", value: "MOTOR_YACHT" },
                    { label: "Sailing yacht", value: "SAILING_YACHT" },
                    { label: "Super yacht", value: "SUPER_YACHT" },
                    { label: "Speed boat", value: "SPEED_BOAT" },
                    { label: "Catamaran", value: "CATAMARAN" },
                  ]}
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
                  id="length"
                  type="number"
                  label={t.fields.length}
                  placeholder={t.placeholders.length}
                  register={methods.register}
                  isMandatory
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="beam"
                  type="number"
                  label={t.fields.beam}
                  placeholder={t.placeholders.beam}
                  register={methods.register}
                  isMandatory
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="cabins"
                  type="number"
                  label={t.fields.cabins}
                  register={methods.register}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="engineHours"
                  type="number"
                  label={t.fields.engineHours}
                  register={methods.register}
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="materials"
                  label={t.fields.hullMaterial}
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
                <Input labelClassName={LABEL} id="model" label="Model" placeholder="e.g. Grande 27 Metri" register={methods.register} />
                <Input labelClassName={LABEL} id="draft" type="number" label="Draft (ft)" register={methods.register} />
                <Input labelClassName={LABEL} id="engines" label="Engines" placeholder="e.g. 2 x MAN V12 1,800 hp" register={methods.register} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input labelClassName={LABEL} id="guestCapacity" type="number" label="Guests" register={methods.register} />
                <Input labelClassName={LABEL} id="crewCapacity" type="number" label="Crew" register={methods.register} />
                <Input labelClassName={LABEL} id="flag" label="Flag" placeholder="e.g. UAE" register={methods.register} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input labelClassName={LABEL} id="registrationNumber" label="Registration number" register={methods.register} />
                <Input labelClassName={LABEL} id="classification" label="Classification" placeholder="e.g. RINA, Lloyd's" register={methods.register} />
                <Select
                  id="charterAvailability"
                  label="Charter availability"
                  options={["Year-round", "Seasonal", "Not offered"].map((v) => ({ label: v, value: v }))}
                  register={methods.register}
                  labelClassName={LABEL}
                />
              </div>
              <CheckboxField id="crewIncluded" label="Crew included" />
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

            {/* Features */}
            <div className="space-y-8">
              <SectionTitle>Features</SectionTitle>
              <FeaturePicker
                name="navigation"
                label="Navigation & electronics"
                suggestions={["Radar", "Chartplotter", "Autopilot", "AIS", "GPS", "Sonar", "Satellite compass", "Night vision camera", "VHF radio", "Satellite phone"]}
              />
              <FeaturePicker
                name="amenities"
                label="Amenities & water toys"
                suggestions={["Jacuzzi", "Tender", "Jet ski", "Seabob", "Water toys", "Stabilisers", "Beach club", "Gym", "Starlink / Wi-Fi", "Air conditioning", "Generator", "Watermaker"]}
              />
            </div>

            <LocationFields baseLabel="Marina / home port" basePlaceholder="e.g. Dubai Harbour Marina" />
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
