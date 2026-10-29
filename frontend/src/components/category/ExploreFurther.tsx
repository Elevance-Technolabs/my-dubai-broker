import React from "react";
import SectionHeading from "../ui/SectionHeading";
import { cn } from "@/lib/utils/cn";

const ExploreFurther = ({ type = "realEstate" }: { type?: string }) => {
  const isCar = type === "cars" || type === "automotive";

  const categories = isCar
    ? [
      {
        title: "SIGNATURE BRANDS",
        items: ["Ferrari", "Lamborghini", "Rolls-Royce", "Bentley", "Porsche"],
        viewAllText: "Show all",
        link: "/brands",
      },
      {
        title: "VEHICLE CATEGORIES",
        items: [
          "Hypercars",
          "Limited Editions",
          "Collector Cars",
          "Performance Icons",
          "Luxury SUVs",
        ],
        viewAllText: "Show all",
        link: "/categories",
      },
      {
        title: "OWNERSHIP TYPES",
        items: [
          "Brand New",
          "Low Mileage",
          "Collector Grade",
          "One-Owner",
          "Heritage Models",
        ],
        viewAllText: "Show all",
        link: "/ownership",
      },
    ]
    : [
      {
        title: "PRIME COMMUNITIES",
        items: [
          "Dubai Hills Estate homes",
          "Palm Jumeirah villas",
          "Emirates Hills mansions",
          "Jumeirah Bay Island residences",
          "Al Barari private villas",
        ],
        viewAllText: "View all communities",
        link: "/communities",
      },
      {
        title: "SIGNATURE LOCATIONS",
        items: [
          "Dubai luxury homes",
          "Abu Dhabi private residences",
          "Palm Jumeirah waterfront homes",
          "Downtown Dubai signature apartments",
          "Dubai Islands beachfront estates",
        ],
        viewAllText: "View all Locations",
        link: "/locations",
      },
      {
        title: "PROPERTY CLASSIFICATIONS",
        items: [
          "Luxury villas",
          "Mansions & estates",
          "Waterfront residences",
          "Branded residences",
          "Penthouses",
        ],
        viewAllText: "View all property types",
        link: "/property-types",
      },
      {
        title: "RARE OPPORTUNITIES",
        items: [
          "Billionaire residences",
          "Signature estates (AED 20M+)",
          "Legacy land parcels",
          "Ultra-private compounds",
          "One-of-a-kind listings",
        ],
        viewAllText: "View curated collections",
        link: "/collections",
      },
    ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Header Section */}
        <div className="mb-12">
          <SectionHeading
            title={
              <>
                <span className="font-bold text-3xl font-serif">Explore</span>{" "}
                <span className="font-light text-3xl font-serif">Further</span>
              </>
            }
            align="left"
          />
        </div>
        <div className="w-full h-px bg-[#E5E5E5] mb-12"></div>

        {/* Content Grid */}
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 md:gap-8", isCar ? "md:grid-cols-3" : "")}>
          {categories.map((category, index) => (
            <div key={index} className="flex flex-col h-full">
              <h4 className="text-[13px] font-sans font-semibold uppercase tracking-widest text-[#1A1A1A] mb-8">
                {category.title}
              </h4>
              <ul className="space-y-4 mb-8">
                {category.items.map((item, idx) => (
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
              <div className="mt-auto">
                <a
                  href={category.link}
                  className={`inline-block text-[#1A1A1A] font-sans text-xs ${isCar ? "text-gold border-none" : "border-b border-[#1A1A1A] pb-0.5"
                    } hover:text-gold hover:border-gold transition-colors duration-300`}
                >
                  {category.viewAllText}
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full h-px bg-[#E5E5E5] mt-12"></div>
        <p className="text-[#8E8E8E] font-sans text-[10px] mt-6">
          Not every listing qualifies. These paths reflect what meets our
          standard.
        </p>
      </div>
    </section>
  );
};

export default ExploreFurther;
