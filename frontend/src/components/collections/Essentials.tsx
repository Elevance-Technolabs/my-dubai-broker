import React from "react";
import SectionHeading from "../ui/SectionHeading";
import { HomeDict } from "@/types/dictionary";
import Link from "next/link";
import { Locale } from "@/i18n/config";

type EssentialsProps = {
  type?: string;
  t: HomeDict;
  locale: Locale;
};

const Essentials = ({ type = "realEstate", t, locale }: EssentialsProps) => {
  const isCar = type === "cars" || type === "automotive";

  // Use localized essentials from the dictionary
  const essentials = isCar ? t.essentials.cars : t.essentials.realEstate;

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Header Section */}
        <div className="mb-12">
          <SectionHeading
            title={
              <>
                <span className="font-bold text-3xl">
                  {t.essentials.heading.bold}{" "}
                </span>
                <span className="font-light text-3xl">
                  {t.essentials.heading.light}
                </span>
              </>
            }
            align="left"
          />
        </div>
        <div className="w-full h-px bg-[#E5E5E5] mb-12"></div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
          {essentials.map((section, index) => (
            <div key={index}>
              <h4 className="text-[13px] font-sans font-semibold uppercase tracking-widest text-[#1A1A1A] mb-8">
                {section.title}
              </h4>
              <ul className="space-y-4">
                {section.items.map((item, idx) => (
                  <li key={idx}>
                    <Link
                      href={`/${locale}/category/${type === "cars" || type === "automotive" ? "cars" : "realEstate"}`}
                      className="text-[#8E8E8E] font-sans text-xs hover:text-gold transition-colors duration-300"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="w-full h-px bg-[#E5E5E5] mt-12"></div>
      </div>
    </section>
  );
};

export default Essentials;
