"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: any) => void;
}

const FilterModal = ({ isOpen, onClose, onApply }: FilterModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                    <div className="flex items-center gap-6">
                        <h2 className="text-xl font-bold font-satoshi">Filters</h2>
                        <button className="text-sm font-medium text-slate-500 hover:text-black underline underline-offset-4">Clear all</button>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-8 space-y-10">
                    {/* Property Type */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-6 font-satoshi">Type</h3>
                        <div className="grid grid-cols-2 gap-y-4">
                            {["Villa", "Apartment", "Penthouse", "Duplex", "Townhouse", "Full floor"].map((type) => (
                                <label key={type} className="flex items-center gap-3 group cursor-pointer">
                                    <div className="w-5 h-5 border border-slate-300 rounded group-hover:border-black transition-colors flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-black rounded-sm opacity-0 group-has-checked:opacity-100" />
                                    </div>
                                    <input type="checkbox" className="hidden" />
                                    <span className="text-sm text-slate-700 font-sans">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest font-satoshi">Price</h3>
                            <span className="text-xs font-medium text-slate-500">Max (AED)</span>
                        </div>
                        <div className="relative pt-6 pb-2">
                            <div className="h-[2px] bg-black w-full relative">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-200 rounded-full cursor-pointer" />
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-200 rounded-full cursor-pointer" />
                            </div>
                            <div className="flex justify-between mt-4">
                                <span className="text-xs text-slate-400">No Min</span>
                                <span className="text-xs text-slate-400">No Max</span>
                            </div>
                        </div>
                    </div>

                    {/* Beds */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-6 font-satoshi">Beds</h3>
                        <div className="flex flex-wrap gap-4">
                            {["1+", "2+", "3+", "4+", "5+", "6+", "7+", "8+", "9+", "10+", "11+"].map((bed) => (
                                <button key={bed} className="w-10 h-10 flex items-center justify-center text-sm font-sans text-slate-700 hover:text-black hover:font-bold transition-all">
                                    {bed}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Size */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-6 font-satoshi">Size</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <select className="w-full h-12 px-4 border border-slate-200 rounded text-sm font-sans appearance-none bg-transparent">
                                    <option>Min. SQ.FT.</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            </div>
                            <div className="relative">
                                <select className="w-full h-12 px-4 border border-slate-200 rounded text-sm font-sans appearance-none bg-transparent">
                                    <option>Max. SQ.FT.</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-6">
                            <span className="text-xs font-medium text-slate-600 font-sans">Property size</span>
                            <div className="flex border border-slate-200 rounded overflow-hidden">
                                <button className="px-4 py-2 text-[10px] font-bold uppercase hover:bg-slate-50 border-r border-slate-200">SQ.M.</button>
                                <button className="px-4 py-2 text-[10px] font-bold uppercase bg-[#232B38] text-white">SQ.FT.</button>
                            </div>
                        </div>
                    </div>

                    {/* Lifestyle */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-6 font-satoshi">Lifestyle</h3>
                        <div className="grid grid-cols-2 gap-y-4">
                            {["Cosmopolitan", "Community Living", "Pet-Friendly", "Private Living", "Golf", "Eco-Friendly", "Gated / Private Community", "Modern", "Waterfront", "Outdoor Activities"].map((item) => (
                                <label key={item} className="flex items-center gap-3 group cursor-pointer">
                                    <div className="w-5 h-5 border border-slate-300 rounded group-hover:border-black transition-colors flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-black rounded-sm opacity-0 group-has-checked:opacity-100" />
                                    </div>
                                    <input type="checkbox" className="hidden" />
                                    <span className="text-sm text-slate-700 font-sans">{item}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100">
                    <button className="w-full h-14 bg-[#1A1A1A] text-white font-bold text-sm uppercase rounded-lg hover:bg-black transition-colors">
                        Show 400+
                    </button>
                </div>
            </div>
        </div>
    );
};

const ChevronDown = ({ size, className }: { size: number; className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m6 9 6 6 6-6" />
    </svg>
);

export default FilterModal;
