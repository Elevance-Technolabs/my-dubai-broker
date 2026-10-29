"use client";

import React from "react";

type CuratorsNoteProps = {
    dict?: any;
};

const CuratorsNote = ({ dict }: CuratorsNoteProps) => {
    const title = dict?.category?.curatorsNote?.title || "Curator's Note";
    const content = dict?.category?.curatorsNote?.content || "\"Every aircraft on MyDubaiBroker is reviewed for provenance, configuration, and operational relevance. We do not publish inventory lists. We publish aircraft that make sense - technically, financially, and strategically.\"";

    return (
        <section className="py-20">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-2xl font-serif font-light text-black mb-12">
                    {title}
                </h2>
                <div className="max-w-4xl mx-auto">
                    <p className="text-[#8E8E8E] font-sans italic font-light text-sm md:text-base leading-relaxed antialiased">
                        {content}
                    </p>
                </div>
            </div>
        </section>
    );
};

export default CuratorsNote;
