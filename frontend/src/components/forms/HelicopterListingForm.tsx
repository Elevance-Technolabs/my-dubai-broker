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
import { ImageIcon, Plus, X as XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CompanyService } from "@/services/company.service";
import { helicopterService } from "@/services/helicopter.service";
import { toast } from "sonner";
import { validateImageFile } from "@/lib/utils/r2Upload";
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
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const existingPhotoKeys = methods.watch("existingPhotoKeys") ?? [];

  const removeExistingPhoto = (key: string) => {
    methods.setValue(
      "existingPhotoKeys",
      existingPhotoKeys.filter((k) => k !== key),
      { shouldValidate: true },
    );
  };

  const onSubmit: SubmitHandler<HelicopterFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const response =
        mode === "edit" && listingId
          ? await helicopterService.updateHelicopter(listingId, data)
          : await helicopterService.createHelicopter(data);
      if (response.success) {
        toast.success(
          mode === "edit"
            ? "Helicopter listing updated successfully!"
            : "Helicopter listing published successfully!",
        );
        router.push("/dashboard");
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
    if (errors.photoFiles) {
      toast.error("Please select a cover image before submitting.");
    } else {
      toast.error(summarizeFieldErrors(errors));
    }
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const problem = validateImageFile(file);
      if (problem) {
        toast.error(problem);
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPreviews = [...imagePreviews];
        newPreviews[index] = reader.result as string;
        setImagePreviews(newPreviews);

        const currentUrls = methods.getValues("photoFiles") || [];
        const updatedUrls = [...currentUrls];
        updatedUrls[index] = file;
        methods.setValue("photoFiles", updatedUrls.filter(Boolean) as File[], {
          shouldValidate: true,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    const newPreviews = [...imagePreviews];
    newPreviews[index] = null;
    setImagePreviews(newPreviews);

    const currentUrls = methods.getValues("photoFiles") || [];
    const updatedUrls = currentUrls.filter((_, i) => i !== index);
    methods.setValue("photoFiles", updatedUrls, { shouldValidate: true });
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
              {existingPhotoKeys.length > 0 && (
                <div className="space-y-2 pb-4 border-b border-gray-200">
                  <span className="text-[9px] uppercase tracking-widest text-gray-400">
                    Current Photos
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {existingPhotoKeys.map((key) => (
                      <div
                        key={key}
                        className="relative aspect-square border border-gray-200 bg-white p-1"
                      >
                        <ImageWithLoader
                          src={key}
                          alt="Existing photo"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(key)}
                          className="absolute -top-2 -right-2 bg-white text-luxury-black border border-gray-200 p-1 hover:text-red-600 shadow-sm z-20 rounded-full transition-colors"
                        >
                          <XIcon size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.photoFiles && (
                <p className="text-sm text-red-500">
                  {errors.photoFiles.message as string}
                </p>
              )}

              {/* Main Cover Image */}
              <div className="relative group cursor-pointer w-full aspect-4/3">
                <label className="flex flex-col items-center justify-center h-full w-full cursor-pointer">
                  {imagePreviews[0] ? (
                    <div className="w-full h-full relative border border-gray-200 shadow-sm bg-white p-2">
                      <div className="w-full h-full relative overflow-hidden">
                        <ImageWithLoader
                          src={imagePreviews[0]}
                          alt="Cover Preview"
                          className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center z-10">
                          <p className="text-[10px] uppercase tracking-widest text-luxury-black">
                            Replace Cover
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-white border border-gray-300 flex flex-col items-center justify-center transition-all duration-500 group-hover:border-luxury-gold group-hover:shadow-lg">
                      <div className="mb-6 p-4 rounded-full bg-gray-50 group-hover:bg-luxury-gold/10 transition-colors">
                        <ImageIcon
                          size={24}
                          className="text-luxury-charcoal group-hover:text-luxury-gold transition-colors"
                          strokeWidth={1}
                        />
                      </div>
                      <span className="uppercase tracking-widest text-[10px] font-semibold text-luxury-black mb-2">
                        Cover Image
                      </span>
                      <span className="text-[10px] font-serif text-gray-400 italic">
                        Required
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 0)}
                  />
                </label>
                {imagePreviews[0] && (
                  <button
                    type="button"
                    onClick={() => removeImage(0)}
                    className="absolute -top-2 -right-2 bg-white text-luxury-black border border-gray-200 p-1.5 hover:text-red-600 shadow-sm z-20 rounded-full transition-colors"
                  >
                    <XIcon size={12} />
                  </button>
                )}
              </div>

              {/* Additional Images Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                {imagePreviews.slice(1).map((preview, i) => {
                  const actualIndex = i + 1;
                  return (
                    <div
                      key={actualIndex}
                      className="relative group cursor-pointer w-full aspect-square"
                    >
                      <label className="flex flex-col items-center justify-center h-full w-full cursor-pointer">
                        {preview ? (
                          <div className="w-full h-full relative border border-gray-200 shadow-sm bg-white p-1.5">
                            <div className="w-full h-full relative overflow-hidden">
                              <ImageWithLoader
                                src={preview}
                                alt={`Gallery ${actualIndex}`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-10">
                                <p className="text-[8px] uppercase tracking-widest text-luxury-black">
                                  Replace
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-white border border-dashed border-gray-200 flex flex-col items-center justify-center transition-all duration-300 hover:border-luxury-gold hover:bg-gray-50">
                            <Plus
                              size={20}
                              className="text-gray-300 group-hover:text-luxury-gold transition-colors"
                              strokeWidth={1.5}
                            />
                            <span className="text-[9px] uppercase tracking-widest text-gray-400 mt-2 group-hover:text-luxury-gold transition-colors">
                              Add Photo
                            </span>
                          </div>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, actualIndex)}
                        />
                      </label>
                      {preview && (
                        <button
                          type="button"
                          onClick={() => removeImage(actualIndex)}
                          className="absolute -top-2 -right-2 bg-white text-luxury-black border border-gray-200 p-1 hover:text-red-600 shadow-sm z-20 rounded-full transition-colors"
                        >
                          <XIcon size={10} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
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
                  ? "Changes are saved immediately"
                  : "Listing pending admin verification"}
              </p>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
