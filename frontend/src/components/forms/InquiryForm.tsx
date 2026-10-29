"use client";
"use no memo";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  inquirySchema,
  defaultInquiryValues,
  InquiryFormData,
} from "@/lib/schemas/inquirySchema";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import PhoneInput from "../ui/PhoneInput";
import { LeadService } from "@/services/lead.service";

interface InquiryFormProps {
  listingId: string;
}

export default function InquiryForm({ listingId }: InquiryFormProps) {
  const methods = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: defaultInquiryValues,
    mode: "onBlur",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (data: InquiryFormData) => {
    setIsSubmitting(true);
    const response = await LeadService.create({
      listingId,
      customerName: data.fullName,
      customerEmail: data.email,
      customerPhone: data.phone || undefined,
      message: data.message,
      sourcePage: typeof window !== "undefined" ? window.location.pathname : undefined,
      sourceForm: "listing_inquiry",
    });
    setIsSubmitting(false);

    if (response.success) {
      setSubmitted(true);
      methods.reset(defaultInquiryValues);
    } else {
      toast.error(response.error || "Failed to send your enquiry. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <p className="text-sm font-medium text-slate-900 mb-1">
          Enquiry sent
        </p>
        <p className="text-xs text-slate-500">
          An agent will get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="flex flex-col gap-2 space-y-3"
      >
        <Input
          id="fullName"
          placeholder="Your Full Name"
          className="bg-slate-50 border-none py-3"
          register={methods.register}
        />
        <Input
          id="email"
          type="email"
          placeholder="Your Contact Email"
          className="bg-slate-50 border-none py-3"
          register={methods.register}
        />
        {/* <Input
                    id="phone"
                    type="tel"
                    className="bg-slate-50 border-none py-3"
                    register={methods.register}
                /> */}
        <PhoneInput
          id="phone"
          register={methods.register}
          placeholder="Optional Phone Number"
          className="bg-slate-50 border-none py-1"
        />
        <Textarea
          id="message"
          rows={5}
          placeholder="I'm interested in this listing..."
          className="bg-slate-50 border-none py-3"
          register={methods.register}
        />

        {/* Submit Button */}
        <Button type="submit" className="w-full mt-3" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Inquiry"}
        </Button>
      </form>
    </FormProvider>
  );
}
