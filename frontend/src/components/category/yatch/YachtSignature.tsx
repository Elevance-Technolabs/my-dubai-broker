"use client";

import React, { useState } from "react";
import SectionHeading from "../../ui/SectionHeading";
import { YACHT_SIGNATURE_DATA } from "@/data/category-data";
import { ArrowRight } from "lucide-react";
import Button from "../../ui/Button";
import { formatPrice } from "@/lib/utils/formatPrice";

type YachtSignatureProps = {
    dict?: any;
};

const YachtSignature = ({ dict }: YachtSignatureProps) => {
    const [activeTab, setActiveTab] = useState<keyof typeof YACHT_SIGNATURE_DATA>("superyachts");

    const tabs: { id: keyof typeof YACHT_SIGNATURE_DATA; label: string }[] = [
        { id: "superyachts", label: "SUPERYACHTS" },
        { id: "explorerYachts", label: "EXPLORER YACHTS" },
        { id: "customBuilds", label: "CUSTOM BUILDS" },
    ];

    const currentItems = YACHT_SIGNATURE_DATA[activeTab];

    const priceOnRequestLabel = dict?.category?.common?.priceOnRequest || "Price on Request";

    return (
        <div className="py-20 bg-white">
            <div className="container mx-auto px-6">
                <div className="mb-12">
                    <SectionHeading
                        title={
                            <>
                                <span className="font-semibold text-4xl font-serif">Signature</span>{" "}
                                <span className="font-light text-4xl font-serif">Yachts</span>
                            </>
                        }
                        align="left"
                        noDivider
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-10 mb-12 border-b border-gray-100 pb-4">
                    {tabs.map((tab) => (
                        <button
                            key={String(tab.id)}
                            onClick={() => setActiveTab(tab.id)}
                            className={`text-xs font-sans cursor-pointer tracking-widest transition-all duration-300 relative pb-4 
                                ${activeTab === tab.id
                                    ? "text-black font-semibold after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-gold"
                                    : "text-gray-400 hover:text-black"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {currentItems.map((item: any) => (
                        <div key={item.id} className="group cursor-pointer">
                            <div className="relative aspect-16/10 overflow-hidden rounded-sm mb-6">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover ease-in-out transition-all duration-400 group-hover:scale-102"
                                />
                            </div>
                            <div className="flex justify-between items-start gap-4">
                                <div className="grow">
                                    <h3 className="text-2xl font-serif text-black mb-2">{item.title}</h3>
                                    <p className="text-gray-400 font-sans text-[10px] tracking-widest uppercase mb-4">
                                        {item.subtitle}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {item.price === "priceOnRequest" ? (
                                        <Button
                                            variant="outline"
                                            className="rounded-full px-6 py-2 text-[10px] h-9 text-dark tracking-widest uppercase border-gray-200 hover:border-black transition-colors flex items-center gap-2 group/btn"
                                            endIcon={<ArrowRight size={12} className="transition-transform group-hover/btn:translate-x-1" />}
                                        >
                                            {priceOnRequestLabel}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            className="border border-gray-200 rounded-full px-6 py-2 h-9 flex items-center gap-2 cursor-default hover:text-black"
                                        >
                                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">AED</span>
                                            <span className="text-sm font-semibold text-black">
                                                {formatPrice(item.price, "AED", "en-AE", false)}
                                            </span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default YachtSignature;
