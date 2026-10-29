"use client";

import React from "react";
import { SlidersHorizontal, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ListingFilterBarProps {
    onOpenFilters: () => void;
    category: string;
}

const ListingFilterBar = ({ onOpenFilters, category }: ListingFilterBarProps) => {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={onOpenFilters}
                    className="flex bg-dark items-center gap-2 px-4 py-2 border text-white border-slate-200 rounded-full text-xs font-bold uppercase transition-all hover:border-black"
                >
                    <SlidersHorizontal size={14} />
                    Filters <span className="bg-[#FFFFFF33] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">0</span>
                </button>

                {/* Quick filters based on category */}
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-xs font-bold uppercase transition-all hover:border-black">
                    Type
                    <ChevronDown size={14} />
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-xs font-bold uppercase transition-all hover:border-black">
                    Price
                    <ChevronDown size={14} />
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-xs font-bold uppercase transition-all hover:border-black">
                    Beds
                    <ChevronDown size={14} />
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-xs font-bold uppercase transition-all hover:border-black">
                    Amenities
                    <ChevronDown size={14} />
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-xs font-bold uppercase transition-all hover:border-black">
                    Lifestyle
                    <ChevronDown size={14} />
                </button>
            </div>

            <div className="relative w-full md:w-[350px]">
                <input
                    type="text"
                    placeholder="Search by location, community, or lifestyle"
                    className="w-full px-4 py-3 pr-10 border border-slate-200 rounded-full text-sm font-sans focus:outline-none focus:border-black"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gold" size={18} />
            </div>
        </div>
    );
};

export default ListingFilterBar;
