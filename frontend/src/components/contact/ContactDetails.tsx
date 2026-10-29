"use client";

import React from "react";

type ContactDetailsProps = {
    dict: any;
};

const ContactDetails = ({ dict }: ContactDetailsProps) => {
    return (
        <section className="bg-white py-24">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-32">
                    {/* General Enquiries */}
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-serif text-black mb-6">
                            {dict.enquiries.general.title}
                        </h2>
                        <p className="text-[#8E8E8E] font-sans text-[13px] mb-12">
                            {dict.enquiries.general.subtitle}
                        </p>

                        <div className="space-y-8">
                            <div>
                                <h4 className="text-[10px] font-sans font-semibold uppercase tracking-widest text-[#B5B5B5] mb-2">
                                    {dict.enquiries.general.emailLabel}
                                </h4>
                                <a
                                    href={`mailto:${dict.enquiries.general.email}`}
                                    className="text-black font-sans text-sm hover:underline"
                                >
                                    {dict.enquiries.general.email}
                                </a>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-sans font-semibold uppercase tracking-widest text-[#B5B5B5] mb-2">
                                    {dict.enquiries.general.hoursLabel}
                                </h4>
                                <p className="text-black font-sans text-sm leading-relaxed whitespace-pre-line">
                                    {dict.enquiries.general.hoursValue}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Specific Enquiries */}
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-serif text-black mb-6">
                            {dict.enquiries.specific.title}
                        </h2>
                        <p className="text-[#8E8E8E] font-sans text-[13px] mb-12">
                            {dict.enquiries.specific.subtitle}
                        </p>

                        <div>
                            <h4 className="text-[10px] font-sans font-semibold uppercase tracking-widest text-[#B5B5B5] mb-2">
                                {dict.enquiries.specific.label}
                            </h4>
                            <a
                                href={`mailto:${dict.enquiries.specific.email}`}
                                className="text-black font-sans text-sm hover:underline"
                            >
                                {dict.enquiries.specific.email}
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Note */}
                <div className="mt-32 pt-12 border-t border-[#F0F0F0] text-center">
                    <p className="text-black font-sans text-lg tracking-wide">
                        {dict.footerNote}
                    </p>
                </div>
            </div>
        </section>
    );
};

export default ContactDetails;
