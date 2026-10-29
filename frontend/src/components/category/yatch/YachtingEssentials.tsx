import React from "react";
import SectionHeading from "../../ui/SectionHeading";


type YachtingEssentialsProps = {
    dict?: any;
};

const YachtingEssentials = ({ dict }: YachtingEssentialsProps) => {
    const content = {
        title: dict?.category?.exploreFurther?.title || "Explore Further",
        sections: [
            {
                title: dict?.category?.exploreFurther?.popularBrands || "POPULAR BRANDS",
                items: ["Sunseeker", "Azimut", "Benetti", "Riva", "Custom Yachts"],
            },
            {
                title: dict?.category?.exploreFurther?.yachtTypes || "YACHT TYPES",
                items: ["Superyachts", "Explorer Yachts", "Motor Yachts", "Custom Builds"],
            },
            {
                title: dict?.category?.exploreFurther?.yachtCategories || "YACHT CATEGORIES",
                items: ["Superyachts", "Explorer Yachts", "Motor Yachts", "Custom Builds"],
            },
            {
                title: dict?.category?.exploreFurther?.buildLocation || "BUILD LOCATION",
                items: ["Italy-built Yachts", "Netherlands-built Superyachts", "German Engineering"],
            },
        ],
    };

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-6">
                {/* Header Section */}
                <div className="mb-12">
                    <SectionHeading
                        title={
                            <span className="font-light text-3xl font-serif">{content.title}</span>
                        }
                        align="left"
                        noDivider
                    />
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
                    {content.sections.map((section, index) => (
                        <div key={index}>
                            <h4 className="text-[11px] font-sans font-semibold uppercase tracking-widest text-[#1A1A1A] mb-8">
                                {section.title}
                            </h4>
                            <ul className="space-y-4">
                                {section.items.map((item, idx) => (
                                    <li key={idx}>
                                        <a
                                            href="#"
                                            className="text-[#8E8E8E] font-sans text-xs hover:text-gold transition-colors duration-300"
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

export default YachtingEssentials;
