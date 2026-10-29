import React from "react";

import { ArrowRight } from "lucide-react";

type EmpoweringSectionProps = {
    t: {
        empowering: {
            heading: { bold: string; light: string };
            content: string[];
            cta: string;
        };
    };
};

const EmpoweringSection = ({ t }: EmpoweringSectionProps) => (
    <div className="bg-[#0A0A0A] py-32 md:py-48">
        <div className="container mx-auto px-6 max-w-[85%]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1560250056-07ba64664864?q=80&w=1151&auto=format&fit=crop"
                        alt="Empowering Professionals & Brands"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="space-y-12">
                    <h2 className="text-3xl font-canela text-white font-medium leading-tight">
                        <span className="relative inline-block border-b-2 border-gold pb-1 mb-2 font-semibold">
                            {t.empowering.heading.bold}
                        </span>{" "}
                        {t.empowering.heading.light}
                    </h2>
                    <div className="space-y-12 text-slate-400 font-satoshi leading-relaxed text-sm md:text-lg">
                        {t.empowering.content.map((p, i) => (
                            <p key={i}>{p}</p>
                        ))}
                    </div>
                    <a
                        href="#"
                        className="inline-flex items-center text-white text-xs tracking-[0.2em] font-bold uppercase border-b-2 border-gold w-fit pb-1 group transition-all duration-300"
                    >
                        <span className="mr-2">{t.empowering.cta}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </a>
                </div>
            </div>
        </div>
    </div>
);

export default EmpoweringSection;
