"use client";

import React from "react";
import SectionHeading from "../../ui/SectionHeading";
import { JET_SIGNATURE_DATA } from "@/data/category-data";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type JetSignatureProps = {
    dict?: any;
};

const JetSignature = ({ dict }: JetSignatureProps) => {
    const titleBold = dict?.category?.jetSignature?.titleBold || "Only";
    const titleLight = dict?.category?.jetSignature?.titleLight || "What Deserves to Be Seen";
    const subtitle = dict?.category?.jetSignature?.subtitle || "A limited selection of private aircraft curated for range, pedigree, and relevance.";
    const priceOnRequestLabel = dict?.category?.common?.priceOnRequest || "Price on Request";
    const enquireLabel = dict?.category?.common?.enquire || "ENQUIRE";

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-6">
                <div className="mb-12">
                    <SectionHeading
                        title={
                            <>
                                <span className="font-semibold text-3xl font-serif">{titleBold}</span>{" "}
                                <span className="font-light text-3xl font-serif">{titleLight}</span>
                            </>
                        }
                        align="left"
                    />
                    <p className="text-gray-400 font-sans text-sm mt-4 max-w-2xl">
                        {subtitle}
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8">
                    {JET_SIGNATURE_DATA.map((item) => (
                        <div key={item.id} className="group flex flex-col">
                            {/* Image Container with Indicator */}
                            <div className="relative aspect-16/10 overflow-hidden mb-6">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover ease-in-out transition-all duration-400 group-hover:scale-102"
                                />
                                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-sm font-medium tracking-widest">
                                    1 / 3
                                </div>
                                <div className="absolute top-1/2 left-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                                        <ArrowRight size={16} className="rotate-180" />
                                    </div>
                                </div>
                                <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex flex-col grow">
                                <p className="text-gray-400 font-sans text-[10px] tracking-[0.2em] uppercase mb-2">
                                    {item.category}
                                </p>
                                <h3 className="text-2xl font-serif text-black mb-6">
                                    {item.title}
                                </h3>

                                <div className="mt-auto border-t border-gray-100 pt-6 flex justify-between items-center">
                                    <div>
                                        <p className="text-[11px] font-sans font-bold text-black mb-1 capitalize tracking-wider">
                                            {priceOnRequestLabel}
                                        </p>
                                        <Link
                                            href="#"
                                            className="text-[10px] font-sans font-semibold text-gold tracking-[0.2em] uppercase flex items-center gap-2 group/link"
                                        >
                                            {enquireLabel}
                                            <ArrowRight size={10} className="transition-transform group-hover/link:translate-x-1" />
                                        </Link>
                                    </div>
                                    <div className="opacity-30 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0">
                                        {/* Placeholder for Logoipsum */}
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                                            <span className="text-[10px] font-sans font-bold tracking-tighter text-gray-400">Logoipsum</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default JetSignature;
