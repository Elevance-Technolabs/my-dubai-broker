import React from "react";
import SectionHeading from "../ui/SectionHeading";

type TrustTechnologyProps = {
  t: {
    technology: {
      heading: { bold: string; light: string };
      content: string[];
    };
  };
};

const TrustTechnology = ({ t }: TrustTechnologyProps) => (
  <section className="py-24 md:py-40 bg-white">
    <div className="container mx-auto px-6 max-w-[80%]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-12">
          <h2 className="text-3xl font-canela text-slate-900 font-medium leading-tight">
            <span className="relative inline-block border-b-2 border-gold pb-1 mb-2 font-semibold">
              {t.technology.heading.bold}
            </span>{" "}
            {t.technology.heading.light}
          </h2>
          <div className="space-y-12 text-slate-500 font-satoshi leading-relaxed text-md">
            {t.technology.content.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
            alt="Technology"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  </section>
);

export default TrustTechnology;
