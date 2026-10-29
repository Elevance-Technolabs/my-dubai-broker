import React from "react";
import SectionHeading from "../ui/SectionHeading";
import { POPULAR_SEARCHES_DATA } from "@/data/category-data";

type PopularSearchesProps = {
    category: keyof typeof POPULAR_SEARCHES_DATA;
    dict?: any;
};

const PopularSearches = ({ category, dict }: PopularSearchesProps) => {
    const data = POPULAR_SEARCHES_DATA[category];

    if (!data) return null;

    const title = dict?.category?.popularSearches?.title || data.title;
    const listingsLabel = dict?.category?.common?.listings || "LISTINGS";

    return (
        <section className="py-12 bg-white">
            <div className="container mx-auto px-6">
                <div className="mb-12">
                    <SectionHeading
                        title={
                            <span className="text-3xl font-serif text-black">{title}</span>
                        }
                        align="left"
                        noDivider
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {data.items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-6 group cursor-pointer">
                            {/* Thumbnail */}
                            <div className="w-32 h-20 shrink-0 overflow-hidden rounded-sm">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                            </div>

                            {/* Text info */}
                            <div className="grow border-b border-gray-100 pb-4 h-full flex flex-col justify-center">
                                <h3 className="text-lg font-sans font-medium text-gray-900 group-hover:text-gold transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-[10px] tracking-widest text-gray-400 mt-1 uppercase">
                                    {item.count.includes(" ") ? item.count.split(" ")[0] : item.count} {listingsLabel}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PopularSearches;
