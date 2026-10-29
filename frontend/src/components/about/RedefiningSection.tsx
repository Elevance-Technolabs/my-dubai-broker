import React from "react";

type RedefiningSectionProps = {
  t: {
    redefining: {
      heading: { bold: string; light: string };
      content: string[];
    };
  };
};

const RedefiningSection = ({ t }: RedefiningSectionProps) => (
  <section className="py-20 container mx-auto px-6 text-center max-w-[80%]">
    <h2 className="text-3xl font-canela text-slate-900 mb-16 leading-tight font-medium">
      <span className="relative inline-block border-b-2 border-gold pb-1 mb-2">
        <span className="font-medium">
          {t.redefining.heading.bold}
        </span>
      </span>{" "}
      {t.redefining.heading.light}
    </h2>
    <div className="max-w-4xl mx-auto space-y-12 text-slate-500 font-satoshi leading-relaxed text-sm md:text-base">
      {t.redefining.content.map((p, i) => (
        <p
          key={i}
          className={
            i === t.redefining.content.length - 1
              ? "text-slate-900 font-bold leading-relaxed max-w-[80%] mx-auto"
              : "max-w-[80%] mx-auto"
          }
        >
          {p}
        </p>
      ))}
    </div>
  </section>
);

export default RedefiningSection;
