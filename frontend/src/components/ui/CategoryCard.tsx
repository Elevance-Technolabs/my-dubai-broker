"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/formatPrice";
import Button from "./Button";
import { useRouter } from "next/navigation"; // Import useRouter

interface AssetCardProps {
  images: string[];
  title: string;
  brand: string;
  price: string | number;
  currency?: string;
  link?: string;
  logo?: string | React.ReactNode;
  brandLabel?: string;
  className?: string;
  isPriceOnRequest?: boolean;
  priceSuffix?: string;
}

const AssetCard = ({
  images,
  title,
  brand,
  price,
  currency = "AED",
  link = "/details/luxury-apartment",
  logo,
  brandLabel = "",
  className,
  isPriceOnRequest = false,
  priceSuffix = "",
}: AssetCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const router = useRouter();

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Navigate to the link when the card is clicked
  const handleCardClick = () => {
    router.push(link);
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group flex flex-col overflow-hidden cursor-pointer",
        className
      )}
    >
      <div className="relative aspect-square overflow-hidden">
        {images.map((img, index) => (
          <img
            key={img}
            src={img}
            alt={`${title} - image ${index + 1}`}
            className={cn(
              "absolute inset-0 w-full h-full object-cover ease-in-out transition-all duration-400 group-hover:scale-102",
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            )}
          />
        ))}

        {logo && typeof logo === "string" ? (
          <div className="absolute top-4 left-4 z-10">
            <img
              src={logo}
              alt="Logo"
              className="w-10 h-10 object-contain filter drop-shadow-md"
            />
          </div>
        ) : (
          <div className="absolute top-4 left-4 z-10">
            <div className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
              {logo}
            </div>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handlePrev}
            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNext}
            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full font-medium tracking-widest">
          {currentImageIndex + 1} / {images.length}
        </div>
      </div>

      <div className="flex flex-col grow py-4">
        <h3 className="font-sans font-semibold text-[#1A1A1A] leading-tight mb-0  line-clamp-2 min-h-12">
          {title}
        </h3>

        <div className="h-[0.5px] bg-gold w-full mb-1"></div>

        <p className="text-[#8E8E8E] italic font-sans text-xs mb-6 truncate">
          {brandLabel && `${brandLabel} `}
          {brand}
        </p>

        <div className="flex items-center justify-between mt-auto gap-2">
          {isPriceOnRequest ? (
            <div className="text-[11px] uppercase tracking-widest font-bold text-[#1A1A1A] font-sans flex items-center gap-2">
              PRICE ON REQUEST
            </div>
          ) : (
            <div className="flex flex-wrap items-baseline gap-1.5 min-w-0">
              <span className="text-[10px] sm:text-xs font-semibold text-[#8E8E8E] font-sans tracking-widest uppercase">
                {currency}
              </span>
              <span className="text-base sm:text-lg font-bold text-[#1A1A1A] font-sans leading-none truncate pr-1">
                {formatPrice(price, currency, "en-AE", false)}
                {priceSuffix}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] font-sans font-bold tracking-[0.2em] text-[#8E8E8E] group-hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0">
            VIEW{" "}
            <ArrowRight
              size={12}
              className="transition-transform group-hover:translate-x-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetCard;