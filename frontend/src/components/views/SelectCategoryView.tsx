"use client";

import { SelectCategoryDict } from "@/types/dictionary";
import SectionWrapper from "../layout/SectionWrapper";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Building2, Landmark, Hotel, Diamond, Car } from "lucide-react";

interface SelectCategoryViewProps {
    dict: SelectCategoryDict;
}

const CategoryButton = ({ label, active = false }: { label: string, active?: boolean }) => (
    <button className={cn(
        "px-6 py-2 md:px-8 md:py-3 text-[10px] tracking-[0.2em] font-bold uppercase transition-all duration-300 border",
        active
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200 hover:bg-white"
    )}>
        {label}
    </button>
);

const BenefitColumn = ({ title, description, items }: { title: string, description: string, items: string[] }) => (
    <div className="flex flex-col text-left">
        <h4 className="text-xl md:text-2xl font-canela text-slate-900 mb-6">{title}</h4>
        <p className="text-slate-500 text-sm leading-relaxed mb-8 font-satoshi">
            {description}
        </p>
        <ul className="space-y-4">
            {items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold/40 mt-1.5 transition-colors group-hover:bg-gold" />
                    <span className="text-xs text-slate-600 font-satoshi">{item}</span>
                </li>
            ))}
        </ul>
    </div>
);

export default function SelectCategoryView({ dict }: SelectCategoryViewProps) {
    const { locale } = useParams();

    return (
        <div className="bg-white pt-20">
            {/* Header Section */}
            <div className="bg-bg-light py-20 md:py-32 text-center">
                <h1 className="text-4xl md:text-6xl font-canela text-slate-900 mb-6 px-4">
                    {dict.hero.title}
                </h1>
                <p className="text-slate-400 font-satoshi max-w-2xl mx-auto px-6 text-sm md:text-base">
                    {dict.hero.description}
                </p>
            </div>

            {/* Main Selection Section (Combined Real Estate & Lifestyle) */}
            <SectionWrapper bg="bg-white">
                <div className="py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
                    <div className="space-y-20">
                        {/* Real Estate Section */}
                        <div className="text-left">
                            <h2 className="text-4xl md:text-5xl font-canela text-slate-900 mb-8">{dict.realEstate.title}</h2>
                            <p className="text-slate-400 mb-6 leading-relaxed font-satoshi max-w-lg text-sm md:text-base">
                                {dict.realEstate.description}
                            </p>
                            <p className="text-slate-400 italic mb-10 text-sm leading-relaxed font-satoshi max-w-lg">
                                {dict.realEstate.subDescription}
                            </p>
                            <Link
                                href={`/${locale}/contact`}
                                className="inline-block px-10 py-4 border border-gold/40 text-[11px] tracking-[0.2em] font-bold text-gold uppercase hover:bg-gold hover:text-white transition-all duration-700 font-satoshi"
                            >
                                {dict.realEstate.cta}
                            </Link>
                        </div>

                        {/* Lifestyle Section */}
                        <div className="text-left">
                            <h2 className="text-3xl md:text-4xl font-canela text-slate-900 mb-8">{dict.lifestyle.title}</h2>

                            <div className="flex flex-wrap gap-2 md:gap-3 mb-10">
                                <CategoryButton label={dict.lifestyle.categories.cars} />
                                <CategoryButton label={dict.lifestyle.categories.yachts} />
                                <CategoryButton label={dict.lifestyle.categories.jets} />
                                <CategoryButton label={dict.lifestyle.categories.helicopters} />
                            </div>

                            <p className="text-slate-400 mb-6 leading-relaxed font-satoshi text-sm max-w-lg">
                                {dict.lifestyle.description}
                            </p>
                            <p className="text-slate-400 mb-10 leading-relaxed font-satoshi text-sm max-w-lg">
                                {dict.lifestyle.subDescription}
                            </p>
                        </div>
                    </div>

                    <div className="lg:sticky lg:top-32">
                        <div className="aspect-[4/5] md:aspect-[4/4] lg:aspect-[4/4] relative rounded-[32px] overflow-hidden shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1628592102751-ba83b0314276"
                                alt="Luxury Dubai Villa"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </SectionWrapper>

            {/* Verified Network Section */}
            <div className="bg-slate-50/30 border-y border-slate-100">
                <SectionWrapper bg="transparent">
                    <div className="py-24 text-center max-w-4xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-canela text-slate-900 mb-8 px-4">{dict.network.title}</h2>
                        <p className="text-slate-400 font-satoshi text-sm md:text-base leading-relaxed mb-16 px-6">
                            {dict.network.description}
                        </p>

                        <div className="flex flex-wrap justify-center gap-10 md:gap-20 opacity-30 grayscale items-center px-4">
                            <Building2 size={32} strokeWidth={1} />
                            <Landmark size={32} strokeWidth={1} />
                            <Hotel size={32} strokeWidth={1} />
                            <Diamond size={32} strokeWidth={1} />
                            <Car size={32} strokeWidth={1} />
                        </div>
                    </div>
                </SectionWrapper>
            </div>

            {/* Benefits Columns Section */}
            <SectionWrapper bg="bg-white">
                <div className="py-32 grid grid-cols-1 md:grid-cols-3 gap-20 md:gap-16">
                    <BenefitColumn
                        title={dict.benefits.presence.title}
                        description={dict.benefits.presence.description}
                        items={dict.benefits.presence.items}
                    />
                    <BenefitColumn
                        title={dict.benefits.visibility.title}
                        description={dict.benefits.visibility.description}
                        items={dict.benefits.visibility.items}
                    />
                    <BenefitColumn
                        title={dict.benefits.performance.title}
                        description={dict.benefits.performance.description}
                        items={dict.benefits.performance.items}
                    />
                </div>
            </SectionWrapper>

            {/* Final Branding Section */}
            <SectionWrapper bg="bg-white">
                <div className="pt-24 pb-48 text-center border-t border-slate-50">
                    <h2 className="text-4xl font-canela text-slate-900 mb-10">{dict.branding.title}</h2>
                    <p className="text-slate-400 font-satoshi text-base md:text-lg mb-10 px-4">{dict.branding.description}</p>
                    <p className="text-base italic font-bold text-gold opacity-80 font-canela tracking-wider">{dict.branding.tagline}</p>
                </div>
            </SectionWrapper>
        </div>
    );
}
