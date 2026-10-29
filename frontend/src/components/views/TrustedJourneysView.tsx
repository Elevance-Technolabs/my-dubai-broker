"use client";

import { TrustedJourneysDict } from "@/types/dictionary";
import PageHero from "../layout/PageHero";
import SectionWrapper from "../layout/SectionWrapper";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Globe, Diamond, Badge, TrendingUp, Mail } from "lucide-react";
import SectionHeading from "../ui/SectionHeading";

interface TrustedJourneysViewProps {
    dict: TrustedJourneysDict;
}

const ServiceFeature = ({
    title,
    subtitle,
    description,
    quote,
    additionalText,
    cta,
    image,
    reversed = false,
    imageLabel,
}: {
    title: string;
    subtitle: string;
    description: string;
    quote?: string;
    additionalText?: string;
    cta: string;
    image: string;
    reversed?: boolean;
    imageLabel: string;
}) => {
    const { locale } = useParams();

    return (
        <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32 last:mb-0", reversed ? "" : "")}>
            <div className={cn("relative group", reversed ? "lg:order-2" : "lg:order-1")}>
                <div className="relative overflow-hidden aspect-4/5 md:aspect-square">
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-all duration-1000" />
                </div>
            </div>

            <div className={cn("flex flex-col", reversed ? "lg:order-1 items-start" : "lg:order-2 px-4 lg:px-0")}>
                <h2 className="text-4xl font-canela text-slate-900 mb-8">{title}</h2>
                <h3 className="text-xs tracking-widest font-bold text-slate-900 uppercase mb-2">{subtitle}</h3>

                <p className="text-slate-600 mb-8 leading-relaxed text-sm md:text-base max-w-lg font-satoshi">
                    {description}
                </p>

                {quote && (
                    <div className={cn(
                        "mb-8 py-2 max-w-lg",
                        "border-l-2 border-gold/40 pl-6 text-left"
                    )}>
                        <p className="text-slate-700 italic font-canela text-base leading-relaxed">
                            {quote}
                        </p>
                    </div>
                )}

                {additionalText && (
                    <p className="text-slate-500 mb-10 leading-relaxed text-sm max-w-lg font-satoshi">
                        {additionalText}
                    </p>
                )}
            </div>
        </div>
    );
};

const PromiseCard = ({ title, description, icon: Icon }: { title: string, description: string, icon: any }) => (
    <div className="px-6 py-10 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-lg flex flex-col items-center text-center group hover:shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all duration-700 w-full h-full">
        <div className="mb-6 rounded-full transition-colors flex items-center justify-center">
            <Icon className="w-8 h-8 text-gold group-hover:scale-110 transition-transform duration-500" />
        </div>
        <h4 className="text-[13px] font-satoshi font-medium mb-3 text-slate-900">{title}</h4>
        <p className="text-[11px] text-slate-500 leading-[1.6] font-satoshi max-w-[200px]">
            {description}
        </p>
    </div>
);

export default function TrustedJourneysView({ dict }: TrustedJourneysViewProps) {
    const { locale } = useParams();

    const icons = [
        { id: 'authenticity', icon: Badge },
        { id: 'global', icon: Globe },
        { id: 'luxury', icon: Diamond },
        { id: 'results', icon: TrendingUp },
    ];

    return (
        <div className="bg-white pt-20">
            <PageHero
                title={dict.hero.title}
                backgroundImage={dict.hero.backgroundImage}
                className="h-[80vh]"
                titleClasses="text-4xl md:text-5xl font-canela italic"
            />

            <SectionWrapper bg="bg-bg-light">
                <div className="py-16 text-center max-w-4xl mx-auto">
                    <h2 className="text-xl md:text-2xl font-canela italic text-slate-900 mb-16">{dict.intro.title}</h2>
                    <div className="space-y-10">
                        <p className="text-lg md:text-xl font-satoshi text-slate-600 leading-relaxed italic px-6 md:px-12">
                            {dict.intro.description}
                        </p>
                        <p className="tracking-widest  max-w-2xl mx-auto leading-loose">
                            {dict.intro.subDescription}
                        </p>
                    </div>
                </div>
            </SectionWrapper>

            <SectionWrapper bg="bg-white">
                <div className="py-24">
                    <ServiceFeature
                        title={dict.sellers.title}
                        subtitle={dict.sellers.subtitle}
                        description={dict.sellers.description}
                        quote={dict.sellers.quote}
                        additionalText={dict.sellers.additionalText}
                        cta={dict.sellers.cta}
                        image="https://images.unsplash.com/photo-1637979910686-ef82f715361b"
                        imageLabel="FOR SELLERS"
                    />

                    <ServiceFeature
                        title={dict.buyers.title}
                        subtitle={dict.buyers.subtitle}
                        description={dict.buyers.description}
                        quote={dict.buyers.quote}
                        additionalText={dict.buyers.additionalText}
                        cta={dict.buyers.cta}
                        image="https://plus.unsplash.com/premium_photo-1683121950257-3e0086ba19e7"
                        reversed
                        imageLabel="FOR BUYERS"
                    />
                </div>
            </SectionWrapper>

            <SectionWrapper bg="bg-slate-50/30">
                <div className="py-24 max-w-7xl mx-auto px-4">
                    <h2 className="text-2xl md:text-3xl font-canela text-slate-900 mb-16 text-left font-medium">
                        {dict.promise.title}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {dict.promise.items.map((item, idx) => (
                            <PromiseCard
                                key={idx}
                                title={item.title}
                                description={item.description}
                                icon={icons[idx].icon}
                            />
                        ))}
                    </div>
                </div>
            </SectionWrapper>

            <SectionWrapper bg="bg-white">
                <div className="py-24 max-w-7xl mx-auto px-4">
                    <SectionHeading
                        noDivider
                        title={
                            <>
                                <span className="font-bold text-3xl font-serif border-b-2 border-gold pb-3">Your Success Story</span>{" "}
                                <span className="font-light text-3xl font-serif">Starts Here.</span>
                            </>
                        }
                        align="left"
                    />

                    <p className="text-slate-600 mb-12 max-w-4xl text-sm md:text-base font-satoshi leading-relaxed">
                        {dict.cta.description}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mb-20 items-center sm:items-start justify-center">
                        <Link
                            href={`/${locale}/contact`}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-5 border border-gold/40 text-[11px] tracking-[0.25em] font-bold text-gold uppercase hover:bg-gold hover:text-white transition-all duration-700 font-satoshi"
                        >
                            <Mail size={16} className="mt-[-2px]" />
                            {dict.cta.listBrand}
                        </Link>
                        <Link
                            href={`/${locale}/category/real-estate`}
                            className="w-full sm:w-auto px-12 py-5 border border-slate-100 flex items-center justify-center text-[11px] tracking-[0.25em] font-bold text-slate-500 uppercase hover:bg-slate-900 hover:text-white transition-all duration-700 font-satoshi"
                        >
                            {dict.cta.exploreOpportunities}
                        </Link>
                    </div>

                    <div className="text-center">
                        <p className="text-[10px] tracking-[0.4em] font-bold text-gold uppercase opacity-80 font-satoshi">
                            {dict.cta.tagline}
                        </p>
                    </div>
                </div>
            </SectionWrapper>
        </div>
    );
}
