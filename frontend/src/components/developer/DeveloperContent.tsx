"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Newsletter from "@/components/newsletter/Newsletter";
import { Locale } from "@/i18n/config";
import { HomeDict, DeveloperDict, SearchDict } from "@/types/dictionary";
import Button from "../ui/Button";

interface DeveloperContentProps {
  t: {
    home: HomeDict;
    developer: DeveloperDict;
    search: SearchDict;
  };
  locale: Locale;
  developerId: string;
}

export default function DeveloperContent({
  t,
  locale,
  developerId,
}: DeveloperContentProps) {
  const isAr = locale === "ar";
  const developerData = (t.developer.developers as any)[developerId];

  if (!developerData) {
    return <div>Developer not found</div>;
  }

  return (
    <main className="bg-white min-h-screen">
      <Navbar
        t={t.home}
        locale={locale}
        wrapperClassName="!bg-white shadow-sm"
        textClassName="!text-slate-900"
        sellWithUsClassName="text-black"
        loginBtnClasses="text-black border-border-sec"
      />

      <div className="pt-40 pb-20 px-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Hero Left */}
            <div
              className={`space-y-10 ${isAr ? "text-right lg:order-2" : "text-left lg:order-1"}`}
            >
              <div>
                <h4 className="text-gold text-[10px] font-bold tracking-[0.3em] uppercase mb-4">
                  {t.developer.profileLabel}
                </h4>
                <h1 className="text-5xl md:text-6xl font-canela text-slate-900 leading-tight">
                  {developerData.name}
                </h1>
              </div>

              <p className="text-slate-500 font-sans text-lg md:text-xl leading-relaxed max-w-xl">
                {developerData.bio}
              </p>

              <div className="grid grid-cols-3 gap-8 border-t border-slate-100 pt-10 max-w-lg">
                <div>
                  <p className="text-gold text-2xl font-canela mb-1">
                    {t.developer.stats.yearsExperience.value}
                  </p>
                  <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">
                    {t.developer.stats.yearsExperience.label}
                  </p>
                </div>
                <div>
                  <p className="text-gold text-2xl font-canela mb-1">
                    {t.developer.stats.projectsCompleted.value}
                  </p>
                  <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">
                    {t.developer.stats.projectsCompleted.label}
                  </p>
                </div>
                <div>
                  <p className="text-gold text-2xl font-canela mb-1">
                    {t.developer.stats.awardsWon.value}
                  </p>
                  <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">
                    {t.developer.stats.awardsWon.label}
                  </p>
                </div>
              </div>

              <Button variant="gold" className="h-14 px-10">
                {t.developer.contactButton}
              </Button>
            </div>

            {/* Hero Right - Video/Image Placeholder */}
            <div
              className={`relative aspect-video bg-slate-900 overflow-hidden group ${isAr ? "lg:order-1" : "lg:order-2"}`}
            >
              <div className="absolute inset-0 flex items-center justify-center p-20">
                <div className="text-2xl font-sans font-bold tracking-widest mb-6">
                  <img
                    src="/images/logo/light-logo.svg"
                    className="w-70"
                    alt="Logo"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SectionWrapper bg="bg-white">
        <Newsletter t={t.home} />
      </SectionWrapper>

      <Footer t={t.home} />
    </main>
  );
}
