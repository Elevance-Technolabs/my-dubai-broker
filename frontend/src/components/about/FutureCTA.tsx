import React from "react";
import Button from "@/components/ui/Button";
import SectionHeading from "../ui/SectionHeading";

type FutureCTAProps = {
  t: {
    future: {
      heading: { bold: string; light: string };
      subtitle: string;
      primaryCta: string;
      secondaryCta: string;
    };
  };
};

const FutureCTA = ({ t }: FutureCTAProps) => (
  <section className="py-32 md:py-48 bg-white border-t border-slate-50 text-center">
    <div className="container mx-auto px-6 max-w-4xl">
      <h2 className="text-4xl font-canela text-slate-900 mb-10 font-medium">
        <span className="relative inline-block border-b-2 border-gold pb-1 mb-2">
          {t.future.heading.bold}
        </span>{" "}
        {t.future.heading.light}
      </h2>
      <p className="text-slate-500 font-satoshi text-sm md:text-lg leading-relaxed max-w-2xl mx-auto mb-16">
        {t.future.subtitle}
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        <a
          href="#"
          className="bg-gold text-white px-12 py-5 text-sm tracking-widest font-bold uppercase transition-all duration-300 hover:bg-slate-900 w-full sm:w-auto"
        >
          {t.future.primaryCta}
        </a>
        <a
          href="#"
          className="bg-slate-50 text-slate-900 px-12 py-5 text-sm tracking-widest font-bold uppercase transition-all duration-300 hover:bg-slate-200 border border-slate-100 w-full sm:w-auto"
        >
          {t.future.secondaryCta}
        </a>
      </div>
    </div>
  </section>
);

export default FutureCTA;
