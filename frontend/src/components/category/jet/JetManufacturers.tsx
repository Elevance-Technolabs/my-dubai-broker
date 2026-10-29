"use client";

import React from "react";

type JetManufacturersProps = {
    dict?: any;
};

const JetManufacturers = ({ dict }: JetManufacturersProps) => {
    const title = dict?.category?.manufacturers?.title || "Manufacturers";
    const manufacturers = [
        dict?.category?.manufacturers?.gulfstream || "Gulfstream",
        dict?.category?.manufacturers?.bombardier || "Bombardier",
        dict?.category?.manufacturers?.dassault || "Dassault Aviation",
        dict?.category?.manufacturers?.embraer || "Embraer"
    ];

    return (
        <section className="py-12 bg-white">
            <div className="container mx-auto px-6 text-center">
                <div className="mb-10">
                    <h2 className="text-3xl font-serif text-black relative inline-block border-b-2 border-gold pb-2">
                        {title}
                    </h2>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
                    {manufacturers.map((name, index) => (
                        <span
                            key={index}
                            className="text-[#B5B5B5] font-serif text-xl md:text-2xl font-light hover:text-black transition-colors duration-300 cursor-default antialiased"
                        >
                            {name}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default JetManufacturers;
