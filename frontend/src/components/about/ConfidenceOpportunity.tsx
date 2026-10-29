import React from "react";

type ConfidenceOpportunityProps = {
  t: {
    confidence: {
      heading: { bold: string; light: string };
      content: string[];
    };
  };
};

const ConfidenceOpportunity = ({ t }: ConfidenceOpportunityProps) => (
  <section className="py-24 md:py-40 container mx-auto px-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2301&auto=format&fit=crop"
          alt="Interior"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="space-y-12">
        <h2 className="text-3xl font-canela text-slate-900 font-medium leading-tight">
          {t.confidence.heading.bold}{" "}
          {t.confidence.heading.light}
        </h2>
        <div className="space-y-12 text-slate-500 font-satoshi leading-relaxed text-base md:text-md">
          {t.confidence.content.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default ConfidenceOpportunity;
