import React from "react";
import SectionHeading from "../ui/SectionHeading";
import { ArrowRight } from "lucide-react";
import { SIGNATURE_COLLECTION_DATA } from "@/data/category-data";

type SignatureCollectionProps = {
    category: keyof typeof SIGNATURE_COLLECTION_DATA;
    dict?: any;
};

const SignatureCollection = ({ category, dict }: SignatureCollectionProps) => {
    const data = SIGNATURE_COLLECTION_DATA[category];

    if (!data) return null;

    // Use translations if available, otherwise fallback to data
    const titleBold = dict?.category?.signatureCollection?.titleBold || data.titleBold;
    const titleLight = dict?.category?.signatureCollection?.titleLight || data.titleLight;
    const priceOnRequestLabel = dict?.category?.common?.priceOnRequest || "Price on Request";

    return (
        <section className="py-12 bg-bg-dark">
            <div className="container mx-auto px-6">
                <div className="mb-16">
                    <SectionHeading
                        title={
                            <span className="text-white">
                                <span className="font-bold text-3xl font-serif">{titleBold}</span>{" "}
                                <span className="font-light text-3xl font-serif">{titleLight}</span>
                            </span>
                        }
                        align="left"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {data.items.map((item) => (
                        <div
                            key={item.id}
                            className="group cursor-pointer bg-[#141414] border border-white/5 overflow-hidden transition-all duration-500 hover:border-gold/30"
                        >
                            {/* Image Container */}
                            <div className="relative aspect-square overflow-hidden">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover ease-in-out transition-all duration-400 group-hover:scale-102"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                            </div>

                            {/* Content Container */}
                            <div className="p-8">
                                <h3 className="text-xl font-serif text-white mb-6 group-hover:text-gold transition-colors duration-300">
                                    {item.title}
                                </h3>

                                <div className="h-px bg-white/10 w-full mb-6 group-hover:bg-gold/20 transition-colors duration-500" />

                                <p className="text-white/40 font-sans text-[10px] tracking-[0.2em] uppercase mb-8">
                                    {item.subtitle}
                                </p>

                                <div className="flex items-center justify-between text-white/90 group-hover:text-white transition-colors">
                                    <span className="text-xs font-sans tracking-wide">
                                        {priceOnRequestLabel}
                                    </span>
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SignatureCollection;
