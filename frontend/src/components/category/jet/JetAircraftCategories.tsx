"use client";

import React from "react";
import SectionHeading from "../../ui/SectionHeading";

type JetAircraftCategoriesProps = {
    dict?: any;
};

const JetAircraftCategories = ({ dict }: JetAircraftCategoriesProps) => {
    const title = {
        bold: dict?.category?.aircraftCategories?.titleBold || "Aircraft",
        light: dict?.category?.aircraftCategories?.titleLight || "Categories"
    };

    const categories = [
        {
            title: dict?.category?.aircraftCategories?.privateJets || "PRIVATE JETS",
            items: [
                "Light Jets",
                "Midsize Jets",
                "Super Midsize Jets",
                "Ultra Long Range"
            ]
        },
        {
            title: dict?.category?.aircraftCategories?.missionProfiles || "MISSION PROFILES",
            items: [
                "Intercontinental Range",
                "Short-Haul Business",
                "Executive Shuttle",
                "Owner-Operated Aircraft"
            ]
        },
        {
            title: dict?.category?.aircraftCategories?.aircraftType || "AIRCRAFT TYPE",
            items: [
                "Fixed Wing Jets",
                "Turboprops",
                "VIP Configurations"
            ]
        }
    ];

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-6">
                <div className="mb-12">
                    <SectionHeading
                        title={
                            <>
                                <span className="font-semibold text-3xl font-serif">{title.bold}</span>{" "}
                                <span className="font-light text-3xl font-serif">{title.light}</span>
                            </>
                        }
                        align="left"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
                    {categories.map((cat, index) => (
                        <div key={index} className="flex flex-col">
                            <h4 className="text-[11px] font-sans font-semibold uppercase tracking-widest text-black mb-6 pb-4 border-b border-[#F0F0F0]">
                                {cat.title}
                            </h4>
                            <ul className="space-y-4">
                                {cat.items.map((item, idx) => (
                                    <li key={idx}>
                                        <a
                                            href="#"
                                            className="text-[#666666] font-sans text-sm hover:text-gold transition-colors duration-300 antialiased"
                                        >
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default JetAircraftCategories;
