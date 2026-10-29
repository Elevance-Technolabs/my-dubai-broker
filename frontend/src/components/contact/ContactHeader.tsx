"use client";

import React from "react";

type ContactHeaderProps = {
    dict: any;
};

const ContactHeader = ({ dict }: ContactHeaderProps) => {
    return (
        <section className=" text-center">
            <div className="container bg-bg-light py-50  max-w-6xl mx-auto px-6">
                <h1 className="text-4xl md:text-5xl font-serif text-black mb-6 font-light">
                    {dict.hero.title}
                </h1>
                <p className="text-zinc-400 font-sans text-sm tracking-wide font-light">
                    {dict.hero.subtitle}
                </p>
            </div>
        </section>
    );
};

export default ContactHeader;
