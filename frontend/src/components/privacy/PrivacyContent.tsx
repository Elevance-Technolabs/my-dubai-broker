"use client";

import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/layout/PageHero";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Newsletter from "@/components/newsletter/Newsletter";
import { Locale } from "@/i18n/config";
import { HomeDict } from "@/types/dictionary";

interface PrivacyContentProps {
  t: {
    home: HomeDict;
    privacy: any;
  };
  locale: Locale;
}

interface NavSection {
  id: string;
  title: string;
  subsections?: NavSection[];
}

export default function PrivacyContent({ t, locale }: PrivacyContentProps) {
  const isAr = locale === "ar";
  const [activeSection, setActiveSection] = useState("introduction");
  const observer = useRef<IntersectionObserver | null>(null);

  const p = t.privacy.privacyPolicy;

  // Prepare sections for sidebar matching the design image exactly
  const navSections: NavSection[] = [
    { id: "introduction", title: p.introduction.sidebarTitle },
    { id: "definitions", title: p.definitions.sidebarTitle },
    { id: "purposes", title: p.purposesOfProcessing.sidebarTitle },
    { id: "legal-bases", title: p.legalBases.sidebarTitle },
    { id: "data-categories", title: p.dataCategories.sidebarTitle },
    { id: "transfers", title: p.internationalTransfers.sidebarTitle },
    { id: "retention", title: p.dataRetention.sidebarTitle },
    { id: "rights", title: p.yourRights.sidebarTitle },
    { id: "contact", title: p.contactInformation.sidebarTitle },
  ];

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

  const renderBullets = (list: string[]) => (
    <ul className={`space-y-4 ${isAr ? "mr-6" : "ml-6"}`}>
      {list.map((item, idx) => {
        // Simple check for Markdown bold
        const parts = item.split("**");
        return (
          <li key={idx} className="flex gap-4 items-start">
            <span className="text-slate-900 mt-2.5 h-1 w-1 rounded-full bg-slate-900 shrink-0" />
            <span className="text-sm md:text-base">
              {parts.length > 1 ? (
                <>
                  <span className="font-bold text-slate-900">{parts[1]}</span>
                  {parts.slice(2).join("")}
                </>
              ) : (
                item
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );

  const renderActivities = (activities: { title: string; purpose: string }[]) => (
    <div className="space-y-10">
      {activities.map((activity, idx) => (
        <div key={idx} className="space-y-3">
          <h4 className="font-bold text-slate-900 text-base md:text-lg">
            {activity.title}
          </h4>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed">
            <span className="font-bold text-slate-900">
              {isAr ? "الغرض:" : "Purpose:"}
            </span>{" "}
            {activity.purpose}
          </p>
        </div>
      ))}
    </div>
  );

  return (
    <main className="bg-white min-h-screen">
      <Navbar t={t.home} locale={locale} />
      <PageHero
        title={isAr ? "سياسة الخصوصية" : "Privacy Policy"}
        subtitle={isAr ? "آخر تحديث: 2026" : "Last updated: January 12, 2026"}
        backgroundImage="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2300&auto=format&fit=crop"
        imageAlt="Privacy Policy"
      />

      <div className="container mx-auto px-6 py-20">
        <div
          className={`flex flex-col lg:flex-row gap-16 lg:gap-24 ${isAr ? "lg:flex-row-reverse" : ""}`}
        >
          {/* Sidebar navigation */}
          <aside className="w-full lg:w-1/4 lg:sticky lg:top-32 h-fit mb-12 lg:mb-0">
            <nav
              className={`space-y-6 relative ${isAr ? "border-r border-slate-100" : "border-l border-slate-100"}`}
            >
              {navSections.map((section) => (
                <div key={section.id} className="relative">
                  <a
                    href={`#${section.id}`}
                    onClick={(e) => scrollToSection(e, section.id)}
                    className={`block text-[13px] font-sans transition-all duration-300 py-1 ${isAr ? "pr-6 text-right" : "pl-6 text-left"} ${activeSection === section.id ? "text-gold" : "text-slate-500 hover:text-gold"}`}
                  >
                    {section.title}
                  </a>

                  <div
                    className={`absolute top-0 bottom-0 w-0.5 bg-gold transition-all duration-500 transform ${activeSection === section.id ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"} ${isAr ? "-right-px" : "-left-px"}`}
                  />
                </div>
              ))}
            </nav>
          </aside>

          {/* Content Area */}
          <div className="w-full lg:w-3/4">
            {/* Header Box */}
            <div className="bg-slate-50/50 p-8 mb-16 border-l-2 border-gold/30">
              <p
                className={`text-[11px] font-sans uppercase tracking-[0.2em] text-slate-400 mb-2 ${isAr ? "text-right" : ""}`}
              >
                <span className="font-bold text-slate-900">
                  {t.privacy.header.lastUpdated.label}
                </span>{" "}
                {t.privacy.header.lastUpdated.value}
              </p>
              <p
                className={`text-[11px] font-sans uppercase tracking-[0.2em] text-slate-400 ${isAr ? "text-right" : ""}`}
              >
                <span className="font-bold text-slate-900">
                  {t.privacy.header.controller.label}
                </span>{" "}
                {t.privacy.header.controller.value}
              </p>
            </div>

            <div className="space-y-24">
              {/* Introduction & Scope */}
              <section id="introduction" className="scroll-mt-32">
                <h2
                  className={`text-3xl md:text-4xl font-canela text-slate-900 mb-8 border-b border-slate-100 pb-6 ${isAr ? "text-right" : ""}`}
                >
                  {p.introduction.title}
                </h2>
                <div
                  className={`space-y-6 text-slate-500 font-sans leading-relaxed text-[13px] md:text-base ${isAr ? "text-right" : ""}`}
                >
                  <p className="whitespace-pre-line">{p.introduction.scope}</p>
                  <p className="whitespace-pre-line">
                    {p.introduction.commitment}
                  </p>
                </div>
              </section>

              {/* Definitions */}
              <section id="definitions" className="scroll-mt-32">
                <h2
                  className={`text-3xl md:text-4xl font-canela text-slate-900 mb-8 border-b border-slate-100 pb-6 ${isAr ? "text-right" : ""}`}
                >
                  {p.definitions.title}
                </h2>
                <div
                  className={`space-y-6 text-slate-500 font-sans leading-relaxed text-[13px] md:text-base ${isAr ? "text-right" : ""}`}
                >
                  <p className="font-bold text-slate-900 text-lg mt-8 mb-2">
                    {p.definitions.personalDataLabel}
                  </p>
                  <p className="text-slate-500 mb-8">
                    {p.definitions.personalDataDefinition}
                  </p>

                  <div className="mt-12 group">
                    <h4 className="font-bold text-slate-900 mb-4">
                      {p.definitions.controllerDetailsLabel}
                    </h4>
                    <div className="space-y-1 text-sm text-slate-500">
                      <p className="font-bold text-slate-900 text-base">
                        {p.definitions.controllerName}
                      </p>
                      <p>{p.definitions.location}</p>
                      <div className="flex gap-2 mt-2">
                        <span>{p.definitions.emailLabel}</span>
                        <a
                          href={`mailto:${p.definitions.email}`}
                          className="text-gold hover:text-gold-hover"
                        >
                          {p.definitions.email}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Purposes */}
              <section id="purposes" className="scroll-mt-32">
                <h2
                  className={`text-3xl md:text-4xl font-canela text-slate-900 mb-6 ${isAr ? "text-right" : ""}`}
                >
                  {p.purposesOfProcessing.title}
                </h2>
                <div className="border-b border-slate-100 mb-8 w-full" />

                <div
                  className={`space-y-6 text-slate-500 font-sans mb-12 ${isAr ? "text-right" : ""}`}
                >
                  <p className="text-sm md:text-base">
                    {p.purposesOfProcessing.overview}
                  </p>
                </div>

                <div className="space-y-20">
                  {p.purposesOfProcessing.categories.map((cat: any) => (
                    <div
                      key={cat.id}
                      className={`space-y-8 ${isAr ? "text-right" : ""}`}
                    >
                      <h3 className="text-2xl md:text-3xl font-canela text-slate-800 border-b border-slate-50 pb-4">
                        {cat.title}
                      </h3>
                      {renderActivities(cat.activities)}
                    </div>
                  ))}
                </div>
              </section>

              {/* Legal Bases */}
              <section id="legal-bases" className="scroll-mt-32">
                <h2
                  className={`text-3xl md:text-4xl font-canela text-slate-900 mb-8 border-b border-slate-100 pb-6 ${isAr ? "text-right" : ""}`}
                >
                  {p.legalBases.title}
                </h2>
                <div
                  className={`space-y-8 text-slate-500 font-sans ${isAr ? "text-right" : ""}`}
                >
                  <p className="text-sm md:text-base">{p.legalBases.overview}</p>
                  {renderBullets(p.legalBases.list)}
                </div>
              </section>

              {/* Data Categories */}
              <section id="data-categories" className="scroll-mt-32">
                <h2
                  className={`text-3xl md:text-4xl font-canela text-slate-900 mb-8 border-b border-slate-100 pb-6 ${isAr ? "text-right" : ""}`}
                >
                  {p.dataCategories.title}
                </h2>
                <div
                  className={`space-y-8 text-slate-500 font-sans ${isAr ? "text-right" : ""}`}
                >
                  {renderBullets(p.dataCategories.list)}
                </div>
              </section>

              {/* Transfers */}
              <section id="transfers" className="scroll-mt-32">
                <h2
                  className={`text-3xl md:text-4xl font-canela text-slate-900 mb-8 border-b border-slate-100 pb-6 ${isAr ? "text-right" : ""}`}
                >
                  {p.internationalTransfers.title}
                </h2>
                <div
                  className={`space-y-6 text-slate-500 font-sans leading-relaxed text-[13px] md:text-base ${isAr ? "text-right" : ""}`}
                >
                  <p>{p.internationalTransfers.policy}</p>
                  <p>{p.internationalTransfers.safeguards}</p>
                </div>
              </section>

              {/* Retention */}
              <section id="retention" className="scroll-mt-32">
                <h2
                  className={`text-3xl md:text-4xl font-canela text-slate-900 mb-8 border-b border-slate-100 pb-6 ${isAr ? "text-right" : ""}`}
                >
                  {p.dataRetention.title}
                </h2>
                <div
                  className={`space-y-8 text-slate-500 font-sans ${isAr ? "text-right" : ""}`}
                >
                  <p className="text-sm md:text-base">
                    {p.dataRetention.overview}
                  </p>
                  {renderBullets(p.dataRetention.list)}
                </div>
              </section>

              {/* Rights */}
              <section id="rights" className="scroll-mt-32">
                <h2
                  className={`text-3xl md:text-4xl font-canela text-slate-900 mb-8 border-b border-slate-100 pb-6 ${isAr ? "text-right" : ""}`}
                >
                  {p.yourRights.title}
                </h2>
                <div
                  className={`space-y-8 text-slate-500 font-sans ${isAr ? "text-right" : ""}`}
                >
                  <p className="text-sm md:text-base">{p.yourRights.context}</p>
                  {renderBullets(p.yourRights.rightsList)}
                </div>
              </section>

              {/* Contact Information */}
              <section id="contact" className="scroll-mt-32 pb-20">
                <h2
                  className={`text-3xl md:text-4xl font-canela text-slate-900 mb-8 border-b border-slate-100 pb-6 ${isAr ? "text-right" : ""}`}
                >
                  {p.contactInformation.title}
                </h2>
                <div
                  className={`space-y-8 text-slate-600 font-sans ${isAr ? "text-right" : ""}`}
                >
                  <p className="text-sm md:text-base leading-relaxed">
                    {p.contactInformation.instruction}
                  </p>

                  <div className="bg-slate-50 p-8 space-y-6">
                    <div>
                      <span className="font-bold text-slate-900 block mb-2 uppercase text-[11px] tracking-wider">
                        {isAr ? "البريد الإلكتروني" : "Email"}
                      </span>
                      <a
                        href={`mailto:${p.contactInformation.email}`}
                        className="text-gold hover:text-gold-hover transition-colors font-medium"
                      >
                        {p.contactInformation.email}
                      </a>
                    </div>

                    <div>
                      <span className="font-bold text-slate-900 block mb-2 uppercase text-[11px] tracking-wider">
                        {isAr ? "العنوان" : "Address"}
                      </span>
                      <div className="space-y-1 text-slate-600 text-sm md:text-base">
                        <p className="font-bold text-slate-900">
                          {p.contactInformation.address.title}
                        </p>
                        <p>{p.contactInformation.address.company}</p>
                        <p>{p.contactInformation.address.location}</p>
                        <p>{p.contactInformation.address.city}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
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
