"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bed,
  Bath,
  Move,
  Car,
  Gauge,
  Ruler,
  Users,
  MapPin,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/formatPrice";
import { Listing } from "@/types/listing";

interface MainListingCardProps {
  listing?: Listing;
}

const getSpecs = (listing: Listing) => {
  switch (listing.type) {
    case "REAL_ESTATE":
      return [
        { icon: Bed, label: `${listing.bedrooms} Beds` },
        { icon: Bath, label: `${listing.bathrooms} Baths` },
        { icon: Move, label: `${listing.builtUpArea} SqFt` },
        { icon: Car, label: `${listing.parking ?? 0} Parking Space` },
      ];
    case "CAR":
      return [
        { icon: Car, label: listing.brand },
        { icon: Gauge, label: `${listing.mileage.toLocaleString()} km` },
        { icon: Ruler, label: listing.transmission },
        { icon: Car, label: `${listing.year}` },
      ];
    case "YACHT":
      return [
        { icon: Ruler, label: `${listing.length} ft` },
        { icon: Users, label: `${listing.cabins} Cabins` },
        { icon: Car, label: listing.make },
        { icon: Car, label: `${listing.year}` },
      ];
    case "JET":
    case "HELICOPTER":
      return [
        { icon: Car, label: listing.manufacturer },
        {
          icon: Users,
          label: `${listing.passengerCapacity ?? listing.seating ?? "-"} Seats`,
        },
        { icon: Ruler, label: `${listing.range ?? "-"} nm Range` },
        { icon: Car, label: `${listing.year}` },
      ];
    default:
      return [];
  }
};

const getSubtitle = (listing: Listing) => {
  switch (listing.type) {
    case "REAL_ESTATE":
      return listing.propertyType;
    case "CAR":
      return `${listing.brand} ${listing.model}`;
    case "YACHT":
      return `${listing.make} ${listing.yachtType}`;
    case "JET":
    case "HELICOPTER":
      return `${listing.manufacturer} ${listing.model}`;
    default:
      return "Asset";
  }
};

const MainListingCard = ({ listing }: MainListingCardProps) => {
  if (!listing) return null;

  const isRealEstate = listing.type === "REAL_ESTATE";
  const images = listing.media.photos.length
    ? listing.media.photos
    : ["/images/placeholder.jpg"];
  const specs = getSpecs(listing);

  return (
    <Link
      href={`/details/${listing.id}`}
      className="block my-10 bg-white overflow-hidden shadow-sm border border-slate-100 mb-8 p-4"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Images */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-4/3 overflow-hidden group">
            <Image
              src={images[0]}
              alt={listing.title}
              fill
              priority
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-4 left-4 bg-[#FFB800] text-white text-[10px] font-bold uppercase px-3 py-1">
              Featured
            </div>
            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1">
              <Maximize2 size={12} />
              1/{images.length}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {images.slice(1, 3).map((img, idx) => (
              <div key={idx} className="relative aspect-video overflow-hidden">
                <Image
                  src={img}
                  alt={`${listing.title} detail`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Middle: Details */}
        <div
          className={cn(
            "lg:col-span-4 flex flex-col justify-between py-2",
            isRealEstate ? "lg:col-span-4" : "lg:col-span-7",
          )}
        >
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-satoshi mb-2">
                {formatPrice(listing.price, listing.currency, "en-AE")}
                {listing.priceSuffix}
              </h2>
              <p className="text-sm text-slate-500 font-sans">
                {getSubtitle(listing)}
              </p>
              {listing.location?.name && (
                <p className="text-xs text-slate-400 font-sans mt-1 flex items-center gap-1">
                  <MapPin size={12} /> {listing.location.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2 border-t border-slate-100 pt-6">
              {specs.map(({ icon: Icon, label }, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Icon size={16} className="text-slate-400" />
                  <span className="text-xs text-slate-600 font-sans">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-black mb-3 font-satoshi italic">
                Curator's Note
              </h4>
              <p className="text-sm text-slate-600 font-sans leading-relaxed line-clamp-4">
                {listing.description}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-8 mt-auto border-t border-slate-50">
            <div className="flex items-center gap-6">
              <div className="w-20 h-8 relative">
                <Image
                  src={"/images/logo/light-logo.svg"}
                  alt="Broker Logo"
                  fill
                  className="object-contain invert-100"
                />
              </div>
              {listing.company?.name && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-sans">
                    Curated by
                  </span>
                  <span className="text-xs font-bold font-satoshi">
                    {listing.company.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Map (Only for Real Estate) */}
        {isRealEstate && (
          <div className="lg:col-span-3">
            <div className="h-full overflow-hidden relative border border-slate-100 group">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3613.5268412695535!2d55.13401737604343!3d25.1161749342735!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f15307447e70b%3A0x633ee721245815!2sPalm%20Jumeirah!5e0!3m2!1sen!2sae!4v1740424560002!5m2!1sen!2sae"
                className="absolute inset-0 w-full h-full border-0 grayscale opacity-80"
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Map"
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default MainListingCard;
