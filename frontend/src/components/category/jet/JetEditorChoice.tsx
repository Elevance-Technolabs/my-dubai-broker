"use client";

import React from "react";
import { Play } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

type JetEditorChoiceProps = {
    dict?: any;
};

const JetEditorChoice = ({ dict }: JetEditorChoiceProps) => {
    // Localization support with fallbacks
    const title = {
        bold: dict?.category?.editorChoice?.titleBold || "Editor's",
        light: dict?.category?.editorChoice?.titleLight || "Choice"
    };
    const curatorPickLabel = "THE CURATED PICK"; // Or localized if needed
    const featuredTitle = "Global 7500: The Masterpiece of Luxury";
    const featuredDescription = "A rare opportunity to acquire a low-hour Global 7500 with a bespoke four-zone cabin configuration.";
    const image = "https://images.unsplash.com/photo-1628000156679-b36c91956540?q=80&w=1171&auto=format&fit=crop";

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-6">
                <SectionHeading
                    title={
                        <>
                            <span className="font-semibold text-3xl font-serif">{title.bold}</span>{" "}
                            <span className="font-light text-3xl font-serif">{title.light}</span>
                        </>
                    }
                    align="left"
                />

                {/* Featured Content */}
                <div className="relative aspect-21/9 w-full group overflow-hidden rounded-sm cursor-pointer">
                    <img
                        src={image}
                        alt={featuredTitle}
                        className="w-full h-full object-cover ease-in-out transition-all duration-400 group-hover:scale-102"
                    />

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

                    {/* Video Icon */}
                    <div className="absolute top-8 right-8">
                        <div className="w-10 h-10 border border-white/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-transform">
                            <Play size={20} fill="currentColor" strokeWidth={0} />
                        </div>
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute bottom-12 left-12 max-w-2xl">
                        <p className="text-[10px] font-sans font-semibold tracking-[0.3em] uppercase text-white/70 mb-6 antialiased">
                            {curatorPickLabel}
                        </p>
                        <h3 className="text-4xl md:text-5xl font-serif text-white mb-6 leading-tight">
                            {featuredTitle}
                        </h3>
                        <p className="text-sm md:text-base font-sans text-white/80 font-light leading-relaxed max-w-xl">
                            {featuredDescription}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default JetEditorChoice;
