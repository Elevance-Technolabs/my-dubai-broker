"use client";

import React, { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Newsletter from "@/components/newsletter/Newsletter";
import { Locale } from "@/i18n/config";
import { HomeDict, SearchDict } from "@/types/dictionary";
import {
  Search,
  Home as HomeIcon,
} from "lucide-react";
import Link from "next/link";
import { listingService } from "@/services/listing.service";
import { Listing } from "@/types/listing";

interface SearchContentProps {
  t: {
    home: HomeDict;
    search: SearchDict;
  };
  locale: Locale;
}

const PropertyCard = ({
  item,
  isAr,
  t,
}: {
  item: Listing;
  isAr: boolean;
  t: SearchDict;
}) => {
  return (
    <Link href={`/details/${item.id}`} className="group block cursor-pointer">
      {/* Image Container */}
      <div className="relative aspect-4/3 overflow-hidden mb-6">
        <img
          src={item.media.photos[0] || "/images/placeholder.jpg"}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Content Overlay */}
        <div className="absolute top-4 left-4 w-10 h-10 bg-slate-900/80 rounded-full flex items-center justify-center backdrop-blur-sm">
          <HomeIcon className="w-5 h-5 text-gold" strokeWidth={1.5} />
        </div>

      </div>

      {/* Content */}
      <div className={isAr ? "text-right" : "text-left"}>
        <h3 className="text-xl font-sans font-light text-slate-900 mb-2 group-hover:text-gold transition-colors truncate">
          {item.title}
        </h3>

        <p className="text-slate-400 text-[11px] font-sans mb-6">
          {t.by}{" "}
          <span className="text-slate-500">
            {item.company?.name || item.location?.name || ""}
          </span>
        </p>

        <div className="flex items-center justify-between border-t border-gray-100 pt-6">
          <span className="text-slate-900 text-lg font-sans font-semibold">
            {item.currency} {item.price.toLocaleString("en-US")}
            {item.priceSuffix}
          </span>
          <span className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase flex items-center gap-1 group-hover:text-gold transition-colors">
            {t.view} <span className="text-xs">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default function SearchContent({ t, locale }: SearchContentProps) {
  const isAr = locale === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listingService
      .getPublicListings({ limit: 50 })
      .then((response) => {
        if (cancelled) return;
        if (response.success && response.data) {
          setListings(response.data.listings);
        } else {
          setError("Failed to load listings.");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load listings.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((l) =>
      [l.title, l.location?.name, l.company?.name].some((v) =>
        v?.toLowerCase().includes(q),
      ),
    );
  }, [listings, searchQuery]);

  return (
    <main className="bg-white min-h-screen">
      <Navbar
        t={t.home}
        locale={locale}
        wrapperClassName="!bg-white shadow-sm"
        textClassName="!text-slate-900"
        sellWithUsClassName="text-black"
        loginBtnClasses="text-black border-border-sec"
      />

      <div className="pt-40 pb-20">
        <div className="container mx-auto px-6">
          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.search.placeholder}
                className="w-full bg-white border border-slate-200 rounded-full py-5 px-8 pr-16 text-slate-900 font-sans focus:outline-none focus:border-gold shadow-xs transition-all"
              />
              <button
                className={`absolute ${isAr ? "left-6" : "right-6"} top-1/2 -translate-y-1/2 text-gold`}
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Results Info */}
          <div className="text-center mb-24">
            <p className="text-slate-400 font-sans text-sm tracking-wide">
              {t.search.resultsInfo
                .replace("{count}", filtered.length.toString())
                .replace("{query}", searchQuery)}
            </p>
          </div>

          {/* Grid */}
          {isLoading ? (
            <p className="text-center text-slate-400 font-sans text-sm">
              Loading...
            </p>
          ) : error ? (
            <p className="text-center text-slate-400 font-sans text-sm">
              {error}
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 font-sans text-sm">
              No listings found.
            </p>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                className="animate-in fade-in slide-in-from-bottom-8 duration-1000"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <PropertyCard item={item} isAr={isAr} t={t.search} />
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      <SectionWrapper bg="bg-bg-light">
        <Newsletter t={t.home} />
      </SectionWrapper>

      <Footer t={t.home} />
    </main>
  );
}
