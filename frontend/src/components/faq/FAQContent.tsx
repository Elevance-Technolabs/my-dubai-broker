"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Locale } from "@/i18n/config";
import { HomeDict } from "@/types/dictionary";
import { ChevronDown, Search, Box, Briefcase, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FAQContentProps {
  t: {
    home: HomeDict;
    faq: any;
  };
  locale: Locale;
}

const FAQItem = ({
  question,
  answer,
  isOpen,
  onClick,
  isAr,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
  isAr: boolean;
}) => {
  return (
    <div className="border-b border-slate-50 last:border-0 overflow-hidden">
      <button
        onClick={onClick}
        className={`w-full py-5 flex items-center justify-between text-left transition-all duration-300 group ${isAr ? "flex-row-reverse text-right" : ""}`}
      >
        <span
          className={`text-[13px] md:text-sm font-bold text-slate-900 transition-colors duration-300`}
        >
          {question}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-500 ${isOpen ? "rotate-180" : ""} ${isAr ? "mr-4" : "ml-4"}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? "max-h-[500px] opacity-100 pb-5" : "max-h-0 opacity-0"}`}
      >
        <p
          className={`text-slate-500 font-satoshi leading-relaxed text-xs md:text-sm ${isAr ? "text-right" : ""}`}
        >
          {answer}
        </p>
      </div>
    </div>
  );
};

const CategoryCard = ({ id, title, description, icon: Icon, isActive, isAr }: any) => (
  <div
    className={cn(
      "flex flex-col rounded-md shadow-2xl items-center p-8 bg-white border transition-all duration-500 group",
      isActive ? "border-gold/40 shadow-xl" : "border-slate-50"
    )}
  >
    <div className={cn(
      "mb-6 p-4 rounded-full transition-colors duration-500",
      isActive ? "bg-gold/10" : "bg-slate-50"
    )}>
      <Icon className={cn("w-6 h-6 transition-transform duration-500", isActive ? "text-gold" : "text-slate-400")} />
    </div>
    <h4 className="text-[13px] tracking-[0.1em] font-bold uppercase mb-2 text-slate-900">{title}</h4>
    <p className="text-[11px] text-slate-400 font-satoshi leading-tight text-center">{description}</p>
  </div>
);

export default function FAQContent({ t, locale }: FAQContentProps) {
  const isAr = locale === "ar";
  const [openItems, setOpenItems] = useState<{ [key: string]: string | null }>({});

  const icons: any = {
    general: Box,
    businesses: Briefcase,
    buyers: User,
  };

  const toggleItem = (groupId: string, index: number) => {
    const key = `${groupId}-${index}`;
    setOpenItems((prev) => ({
      ...prev,
      [groupId]: prev[groupId] === key ? null : key,
    }));
  };

  return (
    <main className="bg-white min-h-screen">
      <Navbar
        t={t.home}
        locale={locale}
        wrapperClassName="bg-white shadow-sm py-4"
        textClassName="text-black"
        sellWithUsClassName="text-black"
        loginBtnClasses="text-black border-slate-200"
      />

      {/* Hero Section */}
      <div className="bg-bg-light pt-32 pb-64 text-center px-6 relative overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-canela text-slate-900 mb-6 font-medium">
          {t.faq.hero.title}
        </h1>
        <p className="text-slate-400 font-satoshi mb-10 text-xs md:text-sm">
          {t.faq.hero.subtitle}
        </p>

        <div className="max-w-2xl mx-auto relative mb-16">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            type="text"
            placeholder={t.faq.hero.searchPlaceholder}
            className="w-full pl-14 pr-8 py-4 rounded-full bg-white border border-slate-200 shadow-sm focus:outline-none focus:border-gold/20 transition-all font-satoshi text-xs"
          />
        </div>

        {/* Category Cards - Repositioned to overlap hero bottom */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[100px] w-full max-w-5xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {t.faq.categories.map((cat: any) => (
              <CategoryCard
                key={cat.id}
                {...cat}
                icon={icons[cat.id]}
                isAr={isAr}
                isActive={false} // Static in the design image
              />
            ))}
          </div>
        </div>
      </div>

      <div className="pt-48 pb-32 container mx-auto px-6">
        <div className="max-w-3xl mx-auto space-y-32">
          {t.faq.sections.map((section: any) => (
            <div key={section.id} className="space-y-12">
              <h2 className={cn("text-2xl font-canela text-slate-900 border-b border-slate-300 pb-6", isAr ? "text-right" : "text-left")}>
                {section.title}
              </h2>

              {section.subsections ? (
                <div className="space-y-12">
                  {section.subsections.map((sub: any, sIdx: number) => (
                    <div key={sIdx} className="space-y-6">
                      <h3 className={cn("text-[10px] tracking-[0.2em] font-bold text-slate-400 uppercase", isAr ? "text-right" : "text-left")}>
                        {sub.title}
                      </h3>
                      <div className="space-y-1">
                        {sub.questions.map((q: any, qIdx: number) => (
                          <FAQItem
                            key={qIdx}
                            question={q.question}
                            answer={q.answer}
                            isOpen={openItems[sub.title] === `${sub.title}-${qIdx}`}
                            onClick={() => toggleItem(sub.title, qIdx)}
                            isAr={isAr}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {section.questions.map((q: any, qIdx: number) => (
                    <FAQItem
                      key={qIdx}
                      question={q.question}
                      answer={q.answer}
                      isOpen={openItems[section.id] === `${section.id}-${qIdx}`}
                      onClick={() => toggleItem(section.id, qIdx)}
                      isAr={isAr}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="mt-24 text-center">
            <button className="bg-black text-white px-10 py-3.5 text-[10px] tracking-[0.2em] font-medium uppercase hover:bg-slate-800 transition-all duration-500 rounded">
              {t.faq.viewAll === "View All Topics" ? "View All Articles" : t.faq.viewAll}
            </button>
          </div>
        </div>
      </div>

      <Footer t={t.home} />
    </main>
  );
}
