"use client";

import React, { useState, useEffect, useRef } from "react";
import PageHero from "@/components/layout/PageHero";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Newsletter from "@/components/newsletter/Newsletter";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { Locale } from "@/i18n/config";
import { HomeDict } from "@/types/dictionary";

interface TermsContentProps {
  t: {
    home: HomeDict;
    terms: any;
  };
  locale: Locale;
}

export default function TermsContent({ t, locale }: TermsContentProps) {
  const [activeSection, setActiveSection] = useState(t.terms.sections[0].id);
  const observer = useRef<IntersectionObserver | null>(null);
  const isAr = locale === "ar";

  useEffect(() => {
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const intersecting = entries.find((entry) => entry.isIntersecting);
      if (intersecting) {
        setActiveSection(intersecting.target.id);
      }
    };

    observer.current = new IntersectionObserver(handleIntersect, {
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0,
    });

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => observer.current?.observe(section));

    return () => observer.current?.disconnect();
  }, []);

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(id);
    }
  };

  const renderValue = (value: any) => {
    if (typeof value === "string") {
      return <p className="mb-4">{value}</p>;
    }
    if (Array.isArray(value)) {
      return value.map((v, i) => (
        <p key={i} className="mb-4">
          {v}
        </p>
      ));
    }
    return null;
  };

  const renderList = (list: string[], title?: string) => (
    <div className="mb-8">
      {title && (
        <h4 className="text-slate-900 font-medium mb-3 text-sm">{title}</h4>
      )}
      <ul className={`space-y-3 ${isAr ? "mr-4" : "ml-4"}`}>
        {list.map((item, i) => (
          <li
            key={i}
            className="flex gap-3 text-slate-500 text-[13px] leading-relaxed"
          >
            <span className="text-gold mt-1.5 h-1 w-1 rounded-full bg-gold shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

  const renderStructuredData = (data: any) => {
    return Object.entries(data).map(([key, value]) => {
      if (
        key === "id" ||
        key === "number" ||
        key === "title" ||
        key === "sections" ||
        key === "subsections"
      )
        return null;

      if (key === "content")
        return (
          <div key={key} className="whitespace-pre-line">
            {renderValue(value)}
          </div>
        );
      if (key === "description")
        return (
          <p key={key} className="text-slate-600 mb-6 text-[13px]">
            {value as string}
          </p>
        );

      if (key === "list" && Array.isArray(value))
        return renderList(value as string[]);

      if (
        ["responsibilities", "qualifications", "sellerWarrants"].includes(key)
      ) {
        const val = value as { title: string; list: string[] };
        return renderList(val.list, val.title);
      }

      if (key === "minimumPriceThresholds" && typeof value === "object") {
        return (
          <div key={key} className="mb-8">
            <h4 className="text-slate-900 font-medium mb-4 text-sm">
              {isAr ? "الحد الأدنى للسعر:" : "Minimum Price Thresholds:"}
            </h4>
            <ul className={`space-y-4 ${isAr ? "mr-4" : "ml-4"}`}>
              {Object.entries(value || {}).map(([cat, price]) => (
                <li
                  key={cat}
                  className="flex gap-3 text-slate-500 text-[13px] leading-relaxed"
                >
                  <span className="text-gold mt-2 h-1 w-1 rounded-full bg-gold shrink-0" />
                  <span>
                    <strong className="text-slate-900">{cat}:</strong>{" "}
                    {price as string}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      }

      if (
        Array.isArray(value) &&
        (key === "eligibleCategories" ||
          key === "prohibitedListings" ||
          key === "usageContexts")
      ) {
        const title =
          key === "eligibleCategories"
            ? isAr
              ? "الفئات المؤهلة"
              : "Eligible Categories"
            : key === "prohibitedListings"
              ? isAr
                ? "القوائم المحظورة"
                : "Prohibited Listings"
              : isAr
                ? "سياقات الاستخدام"
                : "Usage Contexts";
        return renderList(value as string[], title);
      }

      if (typeof value === "string" && key.endsWith("Note")) {
        return (
          <div
            key={key}
            className="bg-gold/5 border-l-2 border-gold p-4 mb-8 text-[12px] text-slate-600"
          >
            {value}
          </div>
        );
      }

      if (key === "details" && typeof value === "object") {
        return (
          <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {Object.entries(value || {}).map(([k, v]) => (
              <div key={k} className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 block">
                  {k}
                </span>
                <span className="text-slate-900 font-medium text-sm">
                  {v as string}
                </span>
              </div>
            ))}
          </div>
        );
      }

      if (key === "slogan") {
        return (
          <p key={key} className="text-gold font-canela text-xl mt-12">
            {value as string}
          </p>
        );
      }

      if (key === "compliance") {
        return (
          <p key={key} className="mb-6 flex items-center gap-2">
            {value as string}
          </p>
        );
      }

      return null;
    });
  };

  return (
    <main className="bg-white min-h-screen">
      <Navbar t={t.home} locale={locale} />

      <PageHero
        title={t.terms.hero.title}
        subtitle={t.terms.hero.subtitle}
        backgroundImage="https://images.unsplash.com/photo-1544717297-fa154daaf02f?q=80&w=2070&auto=format&fit=crop"
        imageAlt="Terms of Use"
      />

      <div className="container mx-auto px-6 py-20">
        <div
          className={`flex flex-col lg:flex-row gap-16 lg:gap-24 ${isAr ? "lg:flex-row-reverse" : ""}`}
        >
          {/* Sidebar */}
          <aside className="w-full lg:w-1/4 lg:sticky lg:top-32 h-fit">
            <nav
              className={`space-y-4 relative ${isAr ? "border-r border-slate-100" : "border-l border-slate-100"}`}
            >
              {t.terms.sections.map((section: any) => (
                <div key={section.id} className="relative group">
                  <a
                    href={`#${section.id}`}
                    onClick={(e) => scrollToSection(e, section.id)}
                    className={`block text-xs font-sans font-medium uppercase tracking-widest transition-all duration-300 py-1 ${isAr ? "pr-6 text-right" : "pl-6 text-left"} ${activeSection === section.id ? "text-gold" : "text-slate-400 hover:text-gold"}`}
                  >
                    {section.number}. {section.title}
                  </a>

                  <div
                    className={`absolute top-0 bottom-0 w-0.5 bg-gold transition-all duration-500 transform ${activeSection === section.id ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"} ${isAr ? "-right-px" : "-left-px"}`}
                  />

                  {section.subsections && (
                    <div
                      className={`${isAr ? "mr-10" : "ml-10"} mt-3 space-y-3`}
                    >
                      {section.subsections.map((sub: any) => (
                        <a
                          key={sub.id}
                          href={`#${sub.id}`}
                          onClick={(e) => scrollToSection(e, sub.id)}
                          className={`block text-[10px] font-sans uppercase tracking-wider transition-colors ${activeSection === sub.id ? "text-gold" : "text-slate-400 hover:text-gold"} ${isAr ? "text-right" : "text-left"}`}
                        >
                          {sub.number} {sub.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="w-full lg:w-3/4">
            <div
              className={`mb-12 space-y-2 ${isAr ? "text-right" : "text-left"}`}
            >
              <p className="text-[11px] font-sans uppercase tracking-[0.2em] text-slate-400">
                <span className="font-bold text-slate-900">
                  {isAr ? "آخر تحديث:" : "Last Updated:"}
                </span>{" "}
                {t.terms.info.lastUpdated}
              </p>
              <p className="text-[11px] font-sans uppercase tracking-[0.2em] text-slate-400">
                <span className="font-bold text-slate-900">
                  {isAr ? "موقع السريان:" : "Effective Location:"}
                </span>{" "}
                {t.terms.info.effectiveLocation}
              </p>
            </div>

            <div className="space-y-24">
              {t.terms.sections.map((section: any) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-32"
                >
                  <h2
                    className={`font-canela text-slate-900 mb-8 border-b font-medium border-slate-200 pb-6 ${isAr ? "text-right" : "text-left"}`}
                  >
                    <span
                      className={`font-serif text-2xl mr-4 ${isAr ? "ml-4 mr-0" : ""}`}
                    >
                      {section.number}.
                    </span>
                    <span className="text-3xl">{section.title}</span>
                  </h2>

                  <div
                    className={`text-slate-500 font-sans text-[13px] leading-[1.8] max-w-3xl ${isAr ? "text-right mr-auto" : "text-left ml-0"}`}
                  >
                    {renderStructuredData(section)}
                  </div>

                  {section.subsections && (
                    <div
                      className={`space-y-16 mt-16 ${isAr ? "mr-0" : "ml-0"}`}
                    >
                      {section.subsections.map((sub: any) => (
                        <div key={sub.id} id={sub.id} className="scroll-mt-32">
                          <h3
                            className={`text-xl md:text-2xl font-canela text-slate-800 mb-6 flex items-baseline gap-4 ${isAr ? "flex-row-reverse text-right" : "text-left"}`}
                          >
                            <span className="text-lg">{sub.number}</span>
                            {sub.title}
                          </h3>
                          <div
                            className={`text-slate-500 font-sans text-[13px] leading-[1.8] max-w-3xl ${isAr ? "text-right mr-auto" : "text-left ml-0"}`}
                          >
                            {renderStructuredData(sub)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer t={t.home} />
    </main>
  );
}
