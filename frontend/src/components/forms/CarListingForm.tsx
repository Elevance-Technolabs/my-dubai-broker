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
  carSchema,
  defaultCarValues,
  CarFormData,
  CarFormInput,
} from "@/lib/schemas/carSchema";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import ImageWithLoader from "@/components/ui/ImageWithLoader";
import { CarListingDict } from "@/types/dictionary";
import { Locale } from "@/i18n/config";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CompanyService } from "@/services/company.service";
import { carService } from "@/services/car.service";
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
  carFieldMap,
} from "@/lib/utils/formErrors";

type CarListingFormProps = {
  dict: CarListingDict;
  locale: Locale;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  categories: {
    id: string;
    name: string;
  }[];
  mode?: "create" | "edit";
  listingId?: string;
  initialData?: Partial<CarFormData>;
};

export default function CarListingForm({
  dict,
  locale,
  categoryId,
  onCategoryChange,
  categories = [],
  mode = "create",
  listingId,
  initialData,
}: CarListingFormProps) {
  const router = useRouter();

  const methods = useForm<CarFormInput, unknown, CarFormData>({
    resolver: zodResolver(carSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      ...defaultCarValues,
      ...initialData,
    } as CarFormInput,
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const onSubmit: SubmitHandler<CarFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const response =
        mode === "edit" && listingId
          ? await carService.updateCar(listingId, data)
          : await carService.createCar(data);
      if (response.success) {
        afterListingSaved(mode, listingId, response, router, "Car listing published successfully!");
      } else {
        const unmapped = applyServerFieldErrors(
          methods.setError,
          response.fieldErrors,
          carFieldMap,
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

  const onError: SubmitErrorHandler<CarFormInput> = (errors) => {
    if (errors.photos) {
      toast.error(String(errors.photos.message ?? "Please check the photos"));
      document.getElementById("photos")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      toast.error(summarizeFieldErrors(errors));
    }
  };

  const t = dict.form;
  const offering = methods.watch("offeringType");

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
                <div className="group relative">
                  <Select
                    id="assetCategory"
                    label="Asset Category"
                    options={categories.map((c: any) => ({
                      label: c.name,
                      value: c.id,
                    }))}
                    value={categoryId}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    isMandatory
                    labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  />
                </div>
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="price"
                  type="number"
                  label={offering === "SHORT_TERM_RENT" ? "Rent per day" : offering === "LONG_TERM_RENT" ? "Rent per month" : t.fields.price}
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
                  id="offeringType"
                  label="Listing type"
                  options={[
                    { label: "For sale", value: "SALE" },
                    { label: "For rent, per day", value: "SHORT_TERM_RENT" },
                    { label: "For rent, per month", value: "LONG_TERM_RENT" },
                  ]}
                  register={methods.register}
                  isMandatory
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
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
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="space-y-8">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold border-b border-gray-50 pb-2">
                {t.sections.vehicle}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="brand"
                  label={t.fields.brand}
                  placeholder={t.placeholders.brand}
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
                  id="variant"
                  label={t.fields.variant}
                  register={methods.register}
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="mileage"
                  type="number"
                  label={t.fields.mileage}
                  placeholder={t.placeholders.mileage}
                  register={methods.register}
                  isMandatory
                />
                <Select
                  id="bodyType"
                  label="Body type"
                  options={[
                    { label: "Sedan", value: "SEDAN" },
                    { label: "SUV", value: "SUV" },
                    { label: "Sports car", value: "SPORTS_CAR" },
                    { label: "Convertible", value: "CONVERTIBLE" },
                    { label: "Truck", value: "TRUCK" },
                    { label: "Van", value: "VAN" },
                    { label: "Motorcycle", value: "MOTORCYCLE" },
                  ]}
                  register={methods.register}
                  isMandatory
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                />
                <Select
                  id="condition"
                  label={t.fields.condition}
                  options={[
                    { label: t.options.condition.new, value: "New" },
                    { label: t.options.condition.likeNew, value: "Like New" },
                    { label: t.options.condition.used, value: "Used" },
                  ]}
                  register={methods.register}
                  isMandatory
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Select
                  id="transmission"
                  label={t.fields.transmission}
                  options={[
                    { label: t.options.transmission.auto, value: "Automatic" },
                    { label: t.options.transmission.manual, value: "Manual" },
                  ]}
                  register={methods.register}
                  isMandatory
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="engineSize"
                  label={t.fields.engineSize}
                  register={methods.register}
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="horsepower"
                  type="number"
                  label={t.fields.horsepower}
                  register={methods.register}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="color"
                  label={t.fields.color}
                  register={methods.register}
                  isMandatory
                />
                <Input
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  id="interiorColor"
                  label={t.fields.interiorColor}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <input
                    type="checkbox"
                    id="warranty"
                    {...methods.register("warranty")}
                    className="w-4 h-4 accent-luxury-gold"
                  />
                  <label
                    htmlFor="warranty"
                    className="text-[10px] uppercase tracking-widest text-gray-500"
                  >
                    {t.fields.warranty}
                  </label>
                </div>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <input
                    type="checkbox"
                    id="negotiable"
                    {...methods.register("negotiable")}
                    className="w-4 h-4 accent-luxury-gold"
                  />
                  <label
                    htmlFor="negotiable"
                    className="text-[10px] uppercase tracking-widest text-gray-500"
                  >
                    {t.fields.negotiable}
                  </label>
                </div>
              </div>
            </div>

            {/* Narrative */}
            <div className="space-y-6">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold border-b border-gray-50 pb-2">
                Narrative
              </h3>
              <Textarea
                id="qualityNarrative"
                label="Quality Narrative"
                placeholder="Enter comma-separated highlights."
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

            {/* More vehicle details */}
            <div className="space-y-8">
              <SectionTitle>More vehicle details</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Select
                  id="fuelType"
                  label="Fuel type"
                  options={["Petrol", "Diesel", "Hybrid", "Plug-in hybrid", "Electric"].map((v) => ({ label: v, value: v }))}
                  register={methods.register}
                  labelClassName={LABEL}
                />
                <Select
                  id="regionalSpec"
                  label="Regional specs"
                  options={["GCC", "American", "European", "Japanese", "Canadian", "Korean", "Other"].map((v) => ({ label: v, value: v }))}
                  register={methods.register}
                  labelClassName={LABEL}
                />
                <Input labelClassName={LABEL} id="doors" type="number" label="Doors" register={methods.register} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input labelClassName={LABEL} id="seats" type="number" label="Seats" register={methods.register} />
                <Input labelClassName={LABEL} id="registrationYear" type="number" label="Registration year" register={methods.register} />
                <Input labelClassName={LABEL} id="plateNumber" label="Plate number" placeholder="Optional" register={methods.register} />
              </div>
              <Input labelClassName={LABEL} id="chassisNumber" label="Chassis number (VIN)" placeholder="Optional, not shown publicly in full" register={methods.register} />
              <CheckboxField id="serviceHistory" label="Full service history" />
              {offering !== "SALE" && (
                <Textarea
                  id="rentalTerms"
                  label="Rental terms"
                  placeholder="Deposit, minimum age, mileage limit, insurance, delivery..."
                  register={methods.register}
                  rows={3}
                  labelClassName={LABEL}
                />
              )}
            </div>

            {/* Features */}
            <div className="space-y-8">
              <SectionTitle>Features</SectionTitle>
              <FeaturePicker
                name="options"
                label="Options & equipment"
                suggestions={[
                  "Panoramic roof",
                  "Leather seats",
                  "Ventilated seats",
                  "Massage seats",
                  "360° camera",
                  "Adaptive cruise control",
                  "Head-up display",
                  "Premium sound system",
                  "Night vision",
                  "Carbon ceramic brakes",
                  "Apple CarPlay / Android Auto",
                  "Soft-close doors",
                  "Paint protection film",
                  "Ceramic coating",
                ]}
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
                    : "Publishing..."
                  : mode === "edit"
                    ? "Save Changes"
                    : "Publish Car Listing"}
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
