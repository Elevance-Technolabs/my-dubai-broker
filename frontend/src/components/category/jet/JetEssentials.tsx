import React from "react";
import SectionHeading from "../../ui/SectionHeading";


type JetEssentialsProps = {
    dict?: any;
};

const JetEssentials = ({ dict }: JetEssentialsProps) => {
    const content = {
        title: dict?.category?.exploreFurther?.title || "Explore Further",
        sections: [
            {
                title: dict?.category?.exploreFurther?.manufacturers || "MANUFACTURERS",
                items: ["Gulfstream Jets for Sale", "Bombardier Global Series", "Dassault Falcon Aircraft"],
            },
            {
                title: dict?.category?.exploreFurther?.jetCategories || "JET CATEGORIES",
                items: ["Ultra Long-Range Jets", "Business Jets for Sale", "Private Jets for Owners"],
            },
            {
                title: dict?.category?.exploreFurther?.acquisitionType || "ACQUISITION TYPE",
                items: ["Pre-Owned Aircraft", "Low-Hour Jets", "Off-Market Opportunities"],
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
                            <>
                                <span className="text-3xl font-serif font-semibold">{content.title.split(" ")[0]}</span>
                                {" "}
                                <span className="text-3xl font-serif font-light">{content.title.split(" ")[1]}</span>
                            </>
                        }
                        align="left"
                    />
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 md:gap-8">
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

export default JetEssentials;
