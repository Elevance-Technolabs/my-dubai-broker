"use client";

import React, { useState, useEffect } from "react";
import { CompanyService } from "@/services/company.service";
import {
  useForm,
  FormProvider,
  useWatch,
  SubmitErrorHandler,
} from "react-hook-form";
import { toast } from "sonner";
import { summarizeFieldErrors } from "@/lib/utils/formErrors";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  defaultListingSchema,
  defaultListingValues,
  DefaultListingFormData,
  DefaultListingFormInput,
} from "@/lib/schemas/defaultListingSchema";
import ImageWithLoader from "@/components/ui/ImageWithLoader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import {
  ArrowLeft,
  ChevronRight,
  ImageIcon,
  Plus,
  Sparkles,
  X as XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

const categoryFields: Record<
  string,
  { label: string; name: string; type: string; placeholder: string }[]
> = {
  "1": [
    // Real Estate
    {
      label: "Bedrooms",
      name: "bedrooms",
      type: "number",
      placeholder: "e.g. 5",
    },
    {
      label: "Bathrooms",
      name: "bathrooms",
      type: "number",
      placeholder: "e.g. 6",
    },
    {
      label: "Built-up Area (sqft)",
      name: "area",
      type: "number",
      placeholder: "e.g. 7500",
    },
    {
      label: "Location",
      name: "location",
      type: "text",
      placeholder: "e.g. Palm Jumeirah",
    },
  ],
  "3": [
    // Yachts
    {
      label: "Length (ft)",
      name: "length",
      type: "number",
      placeholder: "e.g. 100",
    },
    {
      label: "Builder",
      name: "builder",
      type: "text",
      placeholder: "e.g. Azimut",
    },
    {
      label: "Year Built",
      name: "year",
      type: "number",
      placeholder: "e.g. 2020",
    },
    { label: "Cabins", name: "cabins", type: "number", placeholder: "e.g. 4" },
  ],
  "4": [
    // Watches
    { label: "Brand", name: "brand", type: "text", placeholder: "e.g. Rolex" },
    {
      label: "Model",
      name: "model",
      type: "text",
      placeholder: "e.g. Submariner",
    },
    { label: "Year", name: "year", type: "number", placeholder: "e.g. 2022" },
    {
      label: "Condition",
      name: "condition",
      type: "text",
      placeholder: "e.g. Mint",
    },
  ],
};

type DefaultListingFormProps = {
  categoryId: string;
  onCategoryChange: (id: string) => void;
  categories: {
    id: string;
    name: string;
  }[];
};

export default function DefaultListingForm({
  categoryId,
  onCategoryChange,
  categories,
}: DefaultListingFormProps) {
  const router = useRouter();

  const methods = useForm<DefaultListingFormInput, unknown, DefaultListingFormData>({
    resolver: zodResolver(defaultListingSchema),
    defaultValues: {
      ...defaultListingValues,
      categoryId: categoryId,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = methods;
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
    null,
  ]);

  const title = useWatch({ control: methods.control, name: "title" });
  const roughNotes = useWatch({ control: methods.control, name: "roughNotes" });
  const description = useWatch({
    control: methods.control,
    name: "description",
  });

  const currentCategoryFields = categoryId
    ? categoryFields[categoryId] || []
    : [];

  useEffect(() => {
    setValue("categoryId", categoryId);
  }, [categoryId, setValue]);

  const handleAIEnhance = () => {
    if (!title && !roughNotes) return;
    setIsGeneratingAI(true);
    setTimeout(() => {
      setValue(
        "description",
        `Experience the epitome of luxury with this ${title || "magnificent asset"}. ` +
          `${roughNotes ? `Featuring ${roughNotes}, ` : ""}this masterpiece represents a unique opportunity ` +
          `for the discerning collector. Meticulously maintained and presented in pristine condition, ` +
          `it combines timeless elegance with modern sophistication.`,
        { shouldValidate: true },
      );
      setIsGeneratingAI(false);
    }, 1500);
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPreviews = [...imagePreviews];
        newPreviews[index] = reader.result as string;
        setImagePreviews(newPreviews);

        const currentUrls = getValues("photoUrls") || [];
        const updatedUrls = [...currentUrls];
        updatedUrls[index] = reader.result as string;
        setValue("photoUrls", updatedUrls.filter(Boolean) as string[], {
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

    const currentUrls = getValues("photoUrls") || [];
    const updatedUrls = currentUrls.filter((_, i) => i !== index);
    setValue("photoUrls", updatedUrls, { shouldValidate: true });
  };

  const onSubmit = (data: DefaultListingFormData) => {
    console.log("Submitted Default Listing:", data);
    router.push("/dashboard");
  };

  const onError: SubmitErrorHandler<DefaultListingFormInput> = (errors) => {
    toast.error(summarizeFieldErrors(errors));
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
            {/* Identification */}
            <div className="space-y-8">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold border-b border-gray-50 pb-2">
                Identification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="group relative">
                  <Select
                    id="categoryId"
                    label="Asset Category"
                    options={categories.map((c) => ({
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
                  id="price"
                  type="number"
                  label="Valuation (USD)"
                  placeholder="0.00"
                  register={register}
                  isMandatory
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                />
              </div>

              <Input
                id="title"
                label="Asset Title"
                placeholder="e.g. Palm Jumeirah Villa"
                register={register}
                isMandatory
                className="text-xl font-serif"
                labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
              />
            </div>

            {/* Specifications */}
            {currentCategoryFields.length > 0 && (
              <div className="space-y-8 animate-fade-in">
                <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold border-b border-gray-50 pb-2">
                  Specifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentCategoryFields.map((field) => (
                    <Input
                      key={field.name}
                      id={`dynamicValues.${field.name}`}
                      label={field.label}
                      type={field.type}
                      placeholder={field.placeholder}
                      register={register}
                      labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Narrative */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                  Narrative
                </h3>
                <button
                  type="button"
                  onClick={handleAIEnhance}
                  disabled={isGeneratingAI}
                  className="text-[9px] uppercase tracking-widest text-luxury-gold hover:text-luxury-black transition-colors flex items-center disabled:opacity-50"
                >
                  <Sparkles size={12} className="mr-2" />
                  {isGeneratingAI ? "Processing..." : "Generate Description"}
                </button>
              </div>

              <div className="space-y-4">
                <Textarea
                  id="roughNotes"
                  label="Key Highlights"
                  placeholder="Enter comma-separated highlights."
                  register={register}
                  rows={2}
                  className="text-xs font-sans text-gray-600"
                  labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                />

                <div className="relative">
                  <Textarea
                    id="description"
                    label="Final Description"
                    placeholder="Generated text will appear here..."
                    register={register}
                    isMandatory
                    rows={8}
                    className="text-base font-serif leading-relaxed"
                    labelClassName="text-[10px] uppercase tracking-widest text-gray-500"
                  />
                  {isGeneratingAI && (
                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10">
                      <div className="w-32 h-0.5 bg-gray-100 overflow-hidden relative">
                        <div
                          className="absolute inset-0 bg-luxury-gold animate-shimmer"
                          style={{ width: "40%" }}
                        ></div>
                      </div>
                      <p className="mt-4 text-[9px] uppercase tracking-widest text-luxury-gold animate-pulse">
                        Crafting Narrative...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Assets */}
          <div className="lg:col-span-5 p-12 bg-gray-50/50 flex flex-col border-l border-gray-100 lg:sticky lg:top-0 lg:h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar">
            <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-8">
              Visual Assets
            </h3>

            <div className="space-y-4 mb-auto">
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
              {errors.photoUrls && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.photoUrls.message}
                </p>
              )}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <Button
                type="submit"
                variant="dark"
                className="w-full shadow-lg hover:shadow-xl h-12 text-[10px] tracking-widest uppercase font-bold"
                disabled={!imagePreviews[0]}
              >
                Publish to Marketplace
              </Button>
              <p className="text-center text-[9px] text-gray-300 uppercase tracking-widest mt-4">
                Listing pending admin verification
              </p>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
