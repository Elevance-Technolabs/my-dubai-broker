"use client";

import PageHero from "@/components/layout/PageHero";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { Locale } from "@/i18n/config";
import { HomeDict, BrandVisibilityDict } from "@/types/dictionary";
import { Home, Car, Anchor, Plane, Gem, Monitor, Star, Mail, Share2, FileText, Handshake, ArrowRight } from "lucide-react";

interface BrandVisibilityViewProps {
    t: {
        home: HomeDict;
        brandVisibility: BrandVisibilityDict;
    };
    locale: Locale;
}

const StatCard = ({ value, label }: { value: string; label: string }) => (
    <div className="flex flex-col items-center text-center px-4">
        <h3 className="text-4xl md:text-5xl font-canela text-gold mb-3 font-medium">{value}</h3>
        <p className="text-[10px] md:text-[11px] tracking-[0.2em] font-medium uppercase text-slate-400">{label}</p>
    </div>
);

const CategoryItem = ({ id, title }: { id: string; title: string }) => {
    const icons: Record<string, any> = {
        "real-estate": Home,
        "supercars": Car,
        "yachts": Anchor,
        "private-jets": Plane,
        "collectibles": Gem,
    };
    const Icon = icons[id] || Star;

    return (
        <div className="flex flex-col items-center p-12 border border-slate-200 transition-all duration-500 hover:border-gold/20 hover:shadow-lg group">
            <div className="mb-6">
                <Icon className="w-6 h-6 text-gold/60 group-hover:text-gold transition-colors" strokeWidth={1.5} />
            </div>
            <span className="text-[11px] tracking-[0.1em] font-bold uppercase text-slate-900">{title}</span>
        </div>
    );
};

const PortfolioCard = ({ id, title, description }: { id: string; title: string, description: string }) => {
    const icons: Record<string, any> = {
        "display": Monitor,
        "featured": Star,
        "newsletter": Mail,
        "social": Share2,
        "bespoke": FileText,
        "strategic": Handshake,
    };
    const Icon = icons[id] || Star;

    return (
        <div className="bg-white p-10 border border-slate-200 hover:border-gold/20 transition-all duration-500 hover:shadow-xl group flex flex-col items-start text-left">
            <div className="mb-8">
                <Icon className="w-6 h-6 text-gold" strokeWidth={1.5} />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-5">{title}</h4>
            <p className="text-[13px] text-slate-500 font-satoshi leading-relaxed">{description}</p>
        </div>
    );
};

export default function BrandVisibilityView({ t, locale }: BrandVisibilityViewProps) {
    const isAr = locale === "ar";

    return (
        <main className="bg-white min-h-screen">
            <Navbar t={t.home} locale={locale} />

            <PageHero
                title={t.brandVisibility.hero.title}
                subtitle={t.brandVisibility.hero.subtitle}
                backgroundImage="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"
                imageAlt="Brand & Visibility Solutions"
            />

            {/* Intro Section */}
            <div className="max-w-[80%] mx-auto text-center px-6 py-25">
                <h2 className="text-3xl font-canela text-slate-900 mb-10 max-w-[80%] mx-auto leading-tight font-medium">
                    {t.brandVisibility.intro.title}
                </h2>
                <p className="text-slate-500 font-satoshi text-sm md:text-base leading-relaxed max-w-[60%] mx-auto">
                    {t.brandVisibility.intro.description}
                </p>
            </div>

            {/* Stats Section */}
            <div className="bg-bg-dark py-32 md:py-48 relative overflow-hidden flex flex-col items-center justify-center">
                <div className="container max-w-[80%] mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-24">
                        {t.brandVisibility.stats.map((stat: any, i: number) => (
                            <StatCard key={i} value={stat.value} label={stat.label} />
                        ))}
                    </div>
                    <div className="max-w-3xl mx-auto text-center">
                        <p className="text-slate-400 text-[13px] md:text-sm font-satoshi leading-relaxed max-w-2xl mx-auto">
                            Our members are global citizens, investors, and collectors who value rarity, provenance, and seamless acquisition experiences. They are actively seeking investment opportunities in Dubai and beyond.
                        </p>
                    </div>
                </div>
            </div>

            {/* Categories Section */}
            <div className="py-24 md:py-40 bg-white max-w-[70%] mx-auto">
                <h3 className="text-3xl md:text-4xl font-canela text-slate-900 mb-20 font-medium">
                    {t.brandVisibility.categoriesHeader}
                </h3>
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {t.brandVisibility.categories.map((cat: any) => (
                            <CategoryItem key={cat.id} id={cat.id} title={cat.title} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Portfolio Section */}
            <div className="bg-slate-50/30 py-24 md:py-40">
                <div className="container mx-auto px-6  max-w-[70%]">
                    <div className="mb-20 text-left">
                        <h3 className="text-4xl font-canela text-slate-900 mb-6 font-medium">
                            {t.brandVisibility.portfolioHeader}
                        </h3>
                        <p className="text-slate-400 font-satoshi text-xs normal-case tracking-normal">
                            {t.brandVisibility.portfolioSub}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {t.brandVisibility.portfolio.map((item: any) => (
                            <PortfolioCard key={item.id} id={item.id} title={item.title} description={item.description} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Curated Storytelling Section */}
            <div className="bg-white py-24 md:py-40">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch">
                    <div className="relative aspect-video lg:aspect-auto overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop"
                            alt="Curated Storytelling"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="bg-slate-50/30 flex flex-col justify-center p-12 md:p-24 lg:p-32 space-y-12">
                        <h3 className="text-4xl md:text-5xl font-canela text-slate-900 font-medium leading-tight">
                            {t.brandVisibility.storytelling.title}
                        </h3>
                        <div className="space-y-12 text-slate-500 font-satoshi leading-relaxed text-base md:text-lg">
                            <p>{t.brandVisibility.storytelling.description}</p>
                            <p>{t.brandVisibility.storytelling.subDescription}</p>
                        </div>
                        <a
                            href="#"
                            className="inline-flex items-center text-slate-900 text-xs tracking-[0.2em] font-bold uppercase border-b-2 border-gold w-fit pb-1 group transition-all duration-300"
                        >
                            <span className="mr-2">{t.brandVisibility.storytellingCTA}</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </a>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-white py-32 md:py-48 border-t border-slate-50 text-center">
                <div className="container mx-auto px-6 max-w-4xl">
                    <h3 className="text-4xl md:text-6xl font-canela text-slate-900 mb-10 font-medium">
                        {t.brandVisibility.ctaSection.title}
                    </h3>
                    <p className="text-slate-600 font-satoshi mb-16 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto opacity-80">
                        {t.brandVisibility.ctaSection.description}
                    </p>

                    <div className="flex flex-col items-center space-y-12">
                        <button className="bg-white border border-slate-200 text-slate-900 px-16 py-5 text-xs tracking-[0.2em] font-medium uppercase hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-500 shadow-sm">
                            {t.brandVisibility.ctaSection.button}
                        </button>
                        <div className="space-y-2 opacity-60">
                            <p className="text-[10px] md:text-[11px] text-slate-500 font-satoshi uppercase tracking-widest font-bold">
                                {t.brandVisibility.ctaSection.email}
                            </p>
                            <p className="text-[10px] md:text-[11px] text-slate-500 font-satoshi uppercase tracking-widest font-bold">
                                {t.brandVisibility.ctaSection.location}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer t={t.home} />
        </main>
    );
}
