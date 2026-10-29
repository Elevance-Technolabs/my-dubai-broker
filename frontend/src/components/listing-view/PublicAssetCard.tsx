"use client";

import React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface PublicAssetCardProps {
    id: string;
    title: string;
    location: string;
    price: string;
    image: string;
    category: string;
}

const PublicAssetCard = ({ id, title, location, price, image, category }: PublicAssetCardProps) => {
    return (
        <div className="group cursor-pointer">
            <div className="relative aspect-4/3 rounded-2xl overflow-hidden mb-4">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Navigation Arrows */}
                <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-white/90 p-1.5 rounded-full hover:bg-white">
                        <ChevronLeft size={16} />
                    </button>
                    <button className="bg-white/90 p-1.5 rounded-full hover:bg-white">
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* Badge */}
                <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-md p-1.5 rounded-full">
                    <div className="w-2 h-2 rounded-full border border-white/50 border-t-white animate-spin" />
                </div>

                {/* Page counter */}
                <div className="absolute bottom-4 right-4 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded">
                    1/5
                </div>
            </div>

            <div className="space-y-1">
                <h3 className="text-base font-bold font-satoshi">{title}</h3>
                <p className="text-xs text-slate-400 font-sans">{location}</p>
                <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-bold font-satoshi">{price}</span>
                    <Link href={`/details/${id}`} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight hover:underline">
                        Please Inquire <ArrowUpRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PublicAssetCard;
