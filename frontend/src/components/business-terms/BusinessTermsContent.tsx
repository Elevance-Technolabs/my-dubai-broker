"use client";

import React, { useState, useEffect, useRef } from "react";
import PageHero from "@/components/layout/PageHero";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { Locale } from "@/i18n/config";
import { HomeDict, BusinessTermsDict } from "@/types/dictionary";

interface BusinessTermsContentProps {
    t: {
        home: HomeDict;
        businessTerms: BusinessTermsDict;
    };
    locale: Locale;
}

export default function BusinessTermsContent({ t, locale }: BusinessTermsContentProps) {
    const [activeSection, setActiveSection] = useState(t.businessTerms.sections[0].id);
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

    return (
        <main className="bg-white min-h-screen">
            <Navbar t={t.home} locale={locale} />

            <PageHero
                title={t.businessTerms.hero.title}
                subtitle={t.businessTerms.hero.subtitle}
                backgroundImage="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
                imageAlt="Business Terms"
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
                            {t.businessTerms.sections.map((section: any) => (
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
                                {t.businessTerms.info.lastUpdated}
                            </p>
                            <p className="text-[11px] font-sans uppercase tracking-[0.2em] text-slate-400">
                                <span className="font-bold text-slate-900">
                                    {isAr ? "موقع السريان:" : "Effective Location:"}
                                </span>{" "}
                                {t.businessTerms.info.effectiveLocation}
                            </p>
                        </div>

                        <div className="space-y-24">
                            {t.businessTerms.sections.map((section: any) => (
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
                                        {section.content && renderValue(section.content)}
                                        {section.list && renderList(section.list)}
                                    </div>
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
