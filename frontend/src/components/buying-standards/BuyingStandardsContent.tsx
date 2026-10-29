"use client";

import React, { useState, useEffect, useRef } from "react";
import PageHero from "@/components/layout/PageHero";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { Locale } from "@/i18n/config";
import { HomeDict, BuyingStandardsDict } from "@/types/dictionary";

interface BuyingStandardsContentProps {
    t: {
        home: HomeDict;
        buyingStandards: BuyingStandardsDict;
    };
    locale: Locale;
}

export default function BuyingStandardsContent({ t, locale }: BuyingStandardsContentProps) {
    const [activeSection, setActiveSection] = useState(t.buyingStandards.sections[0].id);
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
                        className="flex gap-3 text-slate-500 text-[15px] xl:text-[16px] leading-relaxed"
                    >
                        <span className="text-gold mt-2 h-1 w-1 rounded-full bg-gold shrink-0" />
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
                    <p key={key} className="text-slate-600 mb-6 text-[15px] xl:text-[16px] italic">
                        {value as string}
                    </p>
                );

            if (key === "list" && Array.isArray(value))
                return renderList(value as string[]);

            if (typeof value === "string" && key.endsWith("Note")) {
                if (key === "securityNote") {
                    const parts = value.split("security@mydubaibroker.com");
                    return (
                        <p key={key} className="text-slate-500 mt-6 text-[15px] xl:text-[16px]">
                            {parts[0]}
                            <span className="text-gold">security@mydubaibroker.com</span>
                            {parts[1]}
                        </p>
                    );
                }
                return (
                    <p key={key} className="text-slate-500 mt-6 text-[15px] xl:text-[16px]">
                        {value}
                    </p>
                );
            }

            if (key === "details" && typeof value === "object") {
                return (
                    <div key={key} className="mt-8 bg-slate-50 p-8 rounded-sm space-y-4">
                        {Object.entries(value || {}).map(([k, v]) => (
                            <div key={k} className="flex gap-4 items-center">
                                <span className={`text-slate-900 font-semibold text-sm min-w-[80px] ${isAr ? "text-right" : "text-left"}`}>
                                    {k}:
                                </span>
                                <span className={`text-sm ${k.toLowerCase() === "email" || k === "البريد الإلكتروني" ? "text-gold" : "text-slate-500"}`}>
                                    {v as string}
                                </span>
                            </div>
                        ))}
                    </div>
                );
            }

            if (key === "note") {
                return (
                    <p key={key} className="text-slate-500 mt-4">
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
                title={t.buyingStandards.hero.title}
                backgroundImage="https://images.unsplash.com/photo-1561715276-a2d087060f1d?q=80&w=1170&auto=format&fit=crop"
                imageAlt="Verified Buying Standards"
                titleClasses="not-italic"
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
                            {t.buyingStandards.sections.map((section: any) => (
                                <div key={section.id} className="relative group">
                                    <a
                                        href={`#${section.id}`}
                                        onClick={(e) => scrollToSection(e, section.id)}
                                        className={`block text-xs font-sans font-medium uppercase tracking-widest transition-all duration-300 py-1 ${isAr ? "pr-6 text-right" : "pl-6 text-left"} ${activeSection === section.id ? "text-gold" : "text-slate-400 hover:text-gold"}`}
                                    >
                                        {section.sidebarTitle}
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
                            className={`mb-12 p-6 border-l-4 border-gold bg-slate-50 inline-block w-full ${isAr ? "text-right border-l-0 border-r-4" : "text-left"}`}
                        >
                            <p className="text-[11px] font-sans uppercase tracking-[0.2em] text-slate-400 mb-2">
                                <span className="font-bold text-slate-900">
                                    {isAr ? "آخر تحديث:" : "Last Updated:"}
                                </span>{" "}
                                {t.buyingStandards.info.lastUpdated}
                            </p>
                            <p className="text-[11px] font-sans uppercase tracking-[0.2em] text-slate-400">
                                <span className="font-bold text-slate-900">
                                    {isAr ? "المعيار:" : "Standard:"}
                                </span>{" "}
                                {t.buyingStandards.info.standard}
                            </p>
                        </div>

                        <div className="space-y-5">
                            {t.buyingStandards.sections.map((section: any) => (
                                <section
                                    key={section.id}
                                    id={section.id}
                                    className="scroll-mt-32"
                                >
                                    {section.title && (
                                        <h2
                                            className={`font-canela text-slate-900 mb-6 border-b font-medium border-slate-200 pb-3 text-3xl ${isAr ? "text-right" : "text-left"}`}
                                        >
                                            {section.title}
                                        </h2>
                                    )}

                                    <div
                                        className={`text-slate-500 font-sans text-[15px] xl:text-[16px] leading-[1.8] max-w-4xl ${isAr ? "text-right mr-auto" : "text-left ml-0 gap-6 flex flex-col"}`}
                                    >
                                        {renderStructuredData(section)}
                                    </div>

                                    {section.subsections && (
                                        <div
                                            className={`space-y-10 mt-4 ${isAr ? "mr-0" : "ml-0"}`}
                                        >
                                            {section.subsections.map((sub: any) => (
                                                <div key={sub.id} id={sub.id} className="scroll-mt-32">
                                                    <h3
                                                        className={`text-base font-semibold font-sans text-slate-800 mb-6 flex items-baseline gap-4 ${isAr ? "flex-row-reverse text-right" : "text-left"}`}
                                                    >
                                                        <span className="text-base">{sub.number}.</span>
                                                        {sub.title}
                                                    </h3>
                                                    <div
                                                        className={`text-slate-500 font-sans text-[15px] xl:text-[16px] leading-[1.8] max-w-4xl ${isAr ? "text-right mr-auto" : "text-left ml-0"}`}
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
