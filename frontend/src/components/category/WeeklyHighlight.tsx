import React from "react";
import SectionHeading from "../ui/SectionHeading";
import {
  CAR_WEEKLY_HIGHLIGHT,
  REAL_ESTATE_WEEKLY_HIGHLIGHT,
} from "@/data/category-data";

type WeeklyHighlightProps = {
  type?: string;
};

const WeeklyHighlight = ({ type = "realEstate" }: WeeklyHighlightProps) => {
  const isCar = type === "cars" || type === "automotive";
  const data = isCar ? CAR_WEEKLY_HIGHLIGHT : REAL_ESTATE_WEEKLY_HIGHLIGHT;

  return (
    <div className="py-15">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          {/* Left Side: Content */}
          <div className="w-full lg:w-1/2">
            <SectionHeading
              title={
                <>
                  <span className="font-bold text-3xl font-sans">
                    {data.titleBold}
                  </span>{" "}
                  <span className="font-light text-3xl font-sans">
                    {data.titleLight}
                  </span>
                </>
              }
              align="left"
            />

            <div className="mt-8 space-y-6">
              <div>
                <h3 className="text-xl font-bold font-sans text-slate-900 mb-1">
                  {data.itemTitle}
                </h3>
                <p className="text-slate-500 text-sm font-sans">
                  {data.itemSubtitle}
                </p>
              </div>

              <p className="text-slate-600 font-sans leading-relaxed max-w-lg">
                {data.description}
              </p>

              <button className="group flex items-center gap-2 text-xs font-semibold tracking-widest uppercase mt-4 hover:text-gold transition-colors">
                VIEW
                <span className="transform group-hover:translate-x-1 transition-transform duration-300">
                  →
                </span>
              </button>
            </div>
          </div>

          {/* Right Side: Image */}
          <div className="w-full lg:w-1/2 h-[400px] lg:h-[500px] relative overflow-hidden">
            <img
              src={data.image}
              alt="Weekly Highlight Property"
              className="w-full h-full object-cover ease-in-out transition-all duration-400 group-hover:scale-102"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyHighlight;
