"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/formatPrice";
import Button from "./Button";
import { useRouter } from "next/navigation"; // Import useRouter
import Image from "next/image";

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
  /** First cards on a page: load the photo straight away (it is the main picture). */
  priority?: boolean;
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
  priority = false,
}: AssetCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Only photos that have been shown are rendered (and so downloaded): a card
  // used to fetch every photo of the listing up front.
  const [shown, setShown] = useState<Set<number>>(() => new Set([0]));
  useEffect(() => {
    setShown((prev) => (prev.has(currentImageIndex) ? prev : new Set(prev).add(currentImageIndex)));
  }, [currentImageIndex]);
  const router = useRouter();

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Functional update: quick repeated clicks each move one photo.
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // The whole card opens the listing (mouse, and Enter/Space from the keyboard).
  const openListing = () => router.push(link);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openListing();
    }
  };

  const hasManyImages = images.length > 1;

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={title}
      onClick={openListing}
      onKeyDown={handleKeyDown}
      className={cn(
        "group flex flex-col overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2",
        className
      )}
    >
      <div className="relative aspect-square overflow-hidden">
        {images.map((img, index) =>
          shown.has(index) || index === currentImageIndex ? (
            <Image
              key={img}
              src={img}
              alt={`${title} - image ${index + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
              quality={75}
              priority={priority && index === 0}
              className={cn(
                "object-cover ease-in-out transition-all duration-400 group-hover:scale-102",
                index === currentImageIndex ? "opacity-100" : "opacity-0"
              )}
            />
          ) : null,
        )}

        {/* Category badge: an image path, or an icon element. Nothing when not given. */}
        {typeof logo === "string" && logo ? (
          <div className="absolute top-4 left-4 z-10">
            <img loading="lazy" decoding="async"
              src={logo}
              alt=""
              className="w-10 h-10 object-contain filter drop-shadow-md"
            />
          </div>
        ) : logo ? (
          <div className="absolute top-4 left-4 z-10">
            <div className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
              {logo}
            </div>
          </div>
        ) : null}

        {hasManyImages && (
          <>
            <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous photo"
                className="pointer-events-auto w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next photo"
                className="pointer-events-auto w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full font-medium tracking-widest">
              {currentImageIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/*
        Fixed rhythm under the photo, the same on every card:
        title (always 2 lines tall) · 12px · gold line · 8px · location (1 line) · 16px · price row.
      */}
      <div className="flex flex-col grow pt-4 pb-4">
        {/* Exactly two lines tall (2 x 1.375 line height). Taller would show the
            top of a third line; short titles keep the height so cards line up. */}
        <h3 className="font-sans font-semibold text-[#1A1A1A] leading-snug line-clamp-2 h-[2.75em]">
          {title}
        </h3>

        <div className="mt-3 h-px w-full bg-gold/70" aria-hidden="true" />

        <p className="mt-2 h-4 text-[#8E8E8E] italic font-sans text-xs leading-4 truncate">
          {brandLabel && `${brandLabel} `}
          {brand}
        </p>

        {/* mt-auto: when a grid row stretches a card, the price stays at the bottom. */}
        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          {isPriceOnRequest ? (
            <div className="text-[11px] uppercase tracking-widest font-bold text-[#1A1A1A] font-sans">
              Price on request
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-[10px] sm:text-xs font-semibold text-[#8E8E8E] font-sans tracking-widest uppercase shrink-0">
                {currency}
              </span>
              <span className="text-base sm:text-lg font-bold text-[#1A1A1A] font-sans leading-none truncate">
                {formatPrice(price, currency, "en-AE", false)}
                {priceSuffix}
              </span>
            </div>
          )}
          <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-sans font-bold tracking-[0.2em] text-[#8E8E8E] group-hover:text-gold group-focus-visible:text-gold transition-colors duration-300 whitespace-nowrap shrink-0">
            VIEW
            {/* The arrow slides 4px within its own 20px slot, so on hover it never
                leaves the card (the card clips anything past its edge). */}
            <span className="inline-flex w-5 shrink-0" aria-hidden="true">
              <ArrowRight
                size={12}
                className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
              />
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default AssetCard;