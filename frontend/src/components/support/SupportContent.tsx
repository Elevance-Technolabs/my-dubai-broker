"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/layout/PageHero";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Newsletter from "@/components/newsletter/Newsletter";
import Link from "next/link";
import { Locale } from "@/i18n/config";
import { HomeDict, SupportDict } from "@/types/dictionary";
import { HelpCircle, Mail, Phone } from "lucide-react";

interface SupportContentProps {
  t: {
    home: HomeDict;
    support: SupportDict;
  };
  locale: Locale;
}

const SupportCard = ({
  title,
  description,
  buttonText,
  phone,
  icon: Icon,
  href,
  isAr,
}: {
  title: string;
  description: string;
  buttonText?: string;
  phone?: string;
  icon: any;
  href?: string;
  isAr: boolean;
}) => {
  return (
    <div className="bg-white p-12 md:p-16 border border-slate-100 hover:border-gold/20 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-100 flex flex-col items-center text-center h-full group">
      <div className="w-16 h-16 bg-white flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110">
        <Icon className="w-12 h-12 text-gold stroke-[1.25px]" />
      </div>

      <h3 className="text-2xl font-canela text-slate-900 mb-6 uppercase tracking-wider">
        {title}
      </h3>

      <p className="text-slate-500 font-sans leading-relaxed text-[15px] md:text-base mb-10 max-w-xs">
        {description}
      </p>

      {buttonText && href && (
        <Link
          href={href}
          className="mt-auto px-8 py-4 border border-slate-200 text-[11px] font-bold tracking-[0.2em] text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300"
        >
          {buttonText}
        </Link>
      )}

      {phone && (
        <div className="mt-auto px-10 py-4 border border-slate-200 text-[13px] font-medium tracking-widest text-slate-500 group-hover:bg-slate-50 transition-all duration-300">
          {phone}
        </div>
      )}
    </div>
  );
};

export default function SupportContent({ t, locale }: SupportContentProps) {
  const isAr = locale === "ar";

  return (
    <main className="bg-white min-h-screen">
      <Navbar t={t.home} locale={locale} />

      <PageHero
        title={t.support.hero.title}
        subtitle={t.support.hero.subtitle}
        backgroundImage="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2670&auto=format&fit=crop"
        imageAlt="Support Center"
      />

      <div className="container mx-auto px-6 py-24 md:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* FAQ Card */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <SupportCard
                title={t.support.cards.faq.title}
                description={t.support.cards.faq.description}
                buttonText={t.support.cards.faq.button}
                icon={HelpCircle}
                href={`/${locale}/faq`}
                isAr={isAr}
              />
            </div>

            {/* Contact Card */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
              <SupportCard
                title={t.support.cards.contact.title}
                description={t.support.cards.contact.description}
                buttonText={t.support.cards.contact.button}
                icon={Mail}
                href={`/${locale}/contact`}
                isAr={isAr}
              />
            </div>

            {/* Concierge Card */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <SupportCard
                title={t.support.cards.concierge.title}
                description={t.support.cards.concierge.description}
                phone={t.support.cards.concierge.phone}
                icon={Phone}
                isAr={isAr}
              />
            </div>
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
