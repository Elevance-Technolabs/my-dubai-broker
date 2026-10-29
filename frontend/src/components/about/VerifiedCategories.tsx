import React from "react";
import SectionHeading from "../ui/SectionHeading";

import { Home, Car, Anchor, Plane, Star } from "lucide-react";

const icons: Record<string, any> = {
  "real-estate": Home,
  cars: Car,
  yachts: Anchor,
  "jets-helicopters": Plane,
};

const CategoryCard = ({
  id,
  title,
  subtitle,
}: {
  id: string;
  title: string;
  subtitle: string;
}) => {
  const Icon = icons[id] || Star;
  return (
    <div className="bg-white p-12 border border-slate-200 transition-all duration-500 hover:shadow-xl group flex flex-col items-center text-center">
      <div className="mb-8">
        <Icon className="w-8 h-8 text-gold" strokeWidth={1} />
      </div>
      <h3 className="text-xl font-canela text-slate-900 mb-4 font-medium">
        {title}
      </h3>
      <p className="text-slate-500 text-sm font-satoshi leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
};

type VerifiedCategoriesProps = {
  t: {
    categories: {
      heading: { bold: string; light: string };
      subtitle: string;
      items: { title: string; subtitle: string }[];
    };
  };
};

const VerifiedCategories = ({ t }: VerifiedCategoriesProps) => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-6 max-w-[80%]">
      <div className="mb-15 text-center max-w-2xl mx-auto">
        <h2 className="text-4xl font-canela text-slate-900 mb-8 font-medium">
          {t.categories.heading.bold} {t.categories.heading.light}
        </h2>
        <p className="text-slate-500 font-satoshi text-base">
          {t.categories.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {t.categories.items.map((item, i) => (
          <CategoryCard
            key={i}
            id={item.id}
            title={item.title}
            subtitle={item.subtitle}
          />
        ))}
      </div>
    </div>
  </section>
);

export default VerifiedCategories;
