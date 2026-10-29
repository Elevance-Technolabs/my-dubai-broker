"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/layout/PageHero";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Newsletter from "@/components/newsletter/Newsletter";
import ImageWithLoader from "@/components/ui/ImageWithLoader";
import { Locale } from "@/i18n/config";
import { HomeDict, StoriesDict } from "@/types/dictionary";

interface StoriesContentProps {
  t: {
    home: HomeDict;
    stories: StoriesDict;
  };
  locale: Locale;
}

const TestimonialCard = ({
  quote,
  name,
  role,
  avatar,
  isAr,
}: {
  quote: string;
  name: string;
  role: string;
  avatar: string;
  isAr: boolean;
}) => {
  return (
    <div className="bg-white p-8 md:p-10 relative group border border-slate-100 hover:border-gold/20 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-100 flex flex-col h-full">
      {/* Quote Icon */}
      <div
        className={`absolute top-8 ${isAr ? "left-8" : "right-8"} text-[#F1F1F1] transition-colors duration-500 group-hover:text-gold/5`}
      >
        <svg width="48" height="34" viewBox="0 0 48 34" fill="currentColor">
          <path d="M12.91 33.15C5.78 33.15 0 27.37 0 20.24C0 13.11 5.78 7.33 12.91 7.33V0C18.45 0 23.99 4.7 23.99 10.24V33.15H12.91ZM36.91 33.15C29.78 33.15 24 27.37 24 20.24C24 13.11 29.78 7.33 36.91 7.33V0C42.45 0 47.99 4.7 47.99 10.24V33.15H36.91Z" />
        </svg>
      </div>

      <p
        className={`text-slate-600 font-sans italic leading-relaxed text-[15px] md:text-base mb-10 relative z-10 ${isAr ? "text-right" : ""}`}
      >
        "{quote}"
      </p>

      <div
        className={`mt-auto flex items-center gap-4 ${isAr ? "flex-row-reverse" : ""}`}
      >
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-slate-100 group-hover:border-gold/30 transition-colors duration-500">
          <ImageWithLoader
            src={avatar}
            alt={name}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </div>
        <div className={isAr ? "text-right" : "text-left"}>
          <h4 className="font-canela text-slate-900 text-lg transition-colors duration-500 group-hover:text-gold">
            {name}
          </h4>
          <p className="text-[10px] font-sans font-bold tracking-[0.2em] text-slate-400 uppercase mt-0.5">
            {role}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function StoriesContent({ t, locale }: StoriesContentProps) {
  const isAr = locale === "ar";

  return (
    <main className="bg-white min-h-screen">
      <Navbar t={t.home} locale={locale} />

      <PageHero
        title={t.stories.hero.title}
        subtitle={t.stories.hero.subtitle}
        backgroundImage="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2300&auto=format&fit=crop"
        imageAlt="Client Stories"
      />

      <div className="container mx-auto px-6 py-24 md:py-32">
        <div className="max-w-7xl mx-auto">
          <div className={`mb-16 md:mb-24 ${isAr ? "text-right" : ""}`}>
            <h2 className="text-4xl font-canela text-slate-900 relative inline-block">
              <span className="relative z-10 font-bold border-gold border-b-2">
                {t.stories.main.title.split(" ")[0]}
              </span>{" "}
              <span className="relative z-10 font-normal">
                {t.stories.main.title.split(" ").slice(1).join(" ")}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.stories.testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="animate-in fade-in slide-in-from-bottom-8 duration-1000"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <TestimonialCard
                  quote={testimonial.quote}
                  name={testimonial.name}
                  role={testimonial.role}
                  avatar={testimonial.avatar}
                  isAr={isAr}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionWrapper bg="bg-bg-light">
        <Newsletter t={t.home} />
      </SectionWrapper>

      <Footer t={t.home} />
    </main>
  );
}
