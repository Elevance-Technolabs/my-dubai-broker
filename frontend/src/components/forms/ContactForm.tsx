"use client";
"use no memo";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  contactSchema,
  defaultContactValues,
  ContactFormData,
} from "@/lib/schemas/contactSchema";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Textarea from "../ui/Textarea";

type ContactFormProps = {
  dict: any;
};

export default function ContactForm({ dict }: ContactFormProps) {
  const methods = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: defaultContactValues,
  });

  const onSubmit = (data: ContactFormData) => {
    console.log("Form Data:", data);
    // Handle submission logic here
  };

  const messageError = methods.formState.errors.message?.message;

  return (
    <section className="bg-white py-24">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif text-black mb-4">
            {dict.requestAssistance.title}
          </h2>
          <p className="text-[#8E8E8E] font-sans text-sm">
            {dict.requestAssistance.subtitle}
          </p>
        </div>

        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="space-y-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input
                id="fullName"
                label={dict.form.fields.fullName}
                placeholder={dict.form.placeholders.fullName}
                register={methods.register}
                className="bg-[#FAFAFA] px-4 py-4"
                labelClassName="text-[10px] uppercase tracking-widest text-[#B5B5B5] mb-2 font-semibold"
              />
              <Input
                id="email"
                label={dict.form.fields.emailAddress}
                placeholder={dict.form.placeholders.emailAddress}
                type="email"
                register={methods.register}
                className="bg-[#FAFAFA] px-4 py-4"
                labelClassName="text-[10px] uppercase tracking-widest text-[#B5B5B5] mb-2 font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Select
                id="category"
                label={dict.form.fields.category}
                options={[
                  { label: dict.form.options.realEstate, value: "Real Estate" },
                  { label: dict.form.options.cars, value: "Cars" },
                  { label: dict.form.options.yachts, value: "Yachts" },
                  { label: dict.form.options.jets, value: "Jets" },
                  {
                    label: dict.form.options.general,
                    value: "General Inquiry",
                  },
                ]}
                register={methods.register}
                className="bg-[#FAFAFA] px-4 py-4"
                labelClassName="text-[10px] uppercase tracking-widest text-[#B5B5B5] mb-2 font-semibold"
              />
              <Input
                id="subject"
                label={dict.form.fields.subject}
                placeholder={dict.form.placeholders.subject}
                register={methods.register}
                className="bg-[#FAFAFA] px-4 py-4"
                labelClassName="text-[10px] uppercase tracking-widest text-[#B5B5B5] mb-2 font-semibold"
              />
            </div>

            <div className="flex flex-col">
              <Textarea
                id="message"
                label={dict.form.fields.message}
                placeholder={dict.form.placeholders.message}
                rows={8}
                className={`bg-[#FAFAFA] px-4 py-4 text-sm font-sans focus:outline-none transition-colors placeholder:text-gray-300 resize-none w-full`}
                register={methods.register}
                labelClassName="text-[10px] uppercase tracking-widest text-[#B5B5B5] mb-2 font-semibold"
              />
            </div>

            <div className="flex flex-col items-start gap-4">
              <Button
                type="submit"
                className="bg-black text-white px-12 py-4 text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-colors"
                variant="primary"
              >
                {dict.form.submit}
              </Button>
              <p className="text-[11px] text-[#B5B5B5] font-sans">
                {dict.form.helperText}
              </p>
            </div>
          </form>
        </FormProvider>
      </div>
    </section>
  );
}
