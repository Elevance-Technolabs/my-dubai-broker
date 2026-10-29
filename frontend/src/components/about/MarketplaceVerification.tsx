import React from "react";
import SectionHeading from "../ui/SectionHeading";

type MarketplaceVerificationProps = {
  t: {
    marketplace: {
      heading: { bold: string; light: string };
      features: { title: string; description: string }[];
    };
  };
};

const MarketplaceVerification = ({ t }: MarketplaceVerificationProps) => (
  <section className="py-20 bg-bg-dark text-white">
    <div className="container mx-auto px-6 max-w-[70%]">
      <h2 className="text-3xl font-canela mb-15 font-medium">
        <span className="relative inline-block border-b-2 border-gold pb-1 mb-2 font-semibold">
          {t.marketplace.heading.bold}
        </span>{" "}
        {t.marketplace.heading.light}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-20 text-left">
        {t.marketplace.features.map((feature, i) => (
          <div key={i} className="space-y-6">
            <h3 className="text-gold font-medium text-xl font-canela">
              {feature.title}
            </h3>
            <p className="text-slate-400 font-satoshi leading-relaxed text-sm">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default MarketplaceVerification;
