"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import CarListingForm from "./CarListingForm";
import YachtListingForm from "./YachtListingForm";
import RealEstateListingForm from "./RealEstateListingForm";
import JetListingForm from "./JetListingForm";
import HelicopterListingForm from "./HelicopterListingForm";
import DefaultListingForm from "./DefaultListingForm";
import {
  CarListingDict,
  HomeDict,
  YachtListingDict,
  RealEstateListingDict,
  JetListingDict,
  HelicopterListingDict,
} from "@/types/dictionary";

import { Locale } from "@/i18n/config";
import { CompanyService } from "@/services/company.service";
import { CompanyCategory } from "@/types/enums";

type ListingManagerProps = {
  carDict: CarListingDict;
  homeDict: HomeDict;

  locale: Locale;
  yachtDict: YachtListingDict;
  realEstateDict: RealEstateListingDict;
  jetDict: JetListingDict;
  helicopterDict: HelicopterListingDict;
};

export default function ListingManager({
  carDict,
  homeDict,
  locale,
  yachtDict,
  realEstateDict,
  jetDict,
  helicopterDict,
}: ListingManagerProps) {
  const router = useRouter();

  const [categoryId, setCategoryId] = useState("");

  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
  };

  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      setIsLoadingCategories(true);
      setCategoriesError(null);

      try {
        const response = await CompanyService.getMyCompany();
        if (!response.success) {
          setCategoriesError(
            response.error || "Failed to load your company's categories.",
          );
          return;
        }

        const apiCategories = (response.data?.categories ?? []) as string[];
        const filtered: { id: string; name: string }[] = [];

        if (apiCategories.includes(CompanyCategory.REAL_ESTATE))
          filtered.push({ id: "1", name: "REAL ESTATE" });
        if (apiCategories.includes(CompanyCategory.CARS))
          filtered.push({ id: "2", name: "CARS" });
        if (apiCategories.includes(CompanyCategory.YACHTS))
          filtered.push({ id: "3", name: "YACHTS" });
        if (apiCategories.includes(CompanyCategory.PRIVATE_AVIATION)) {
          filtered.push({ id: "5", name: "JETS" });
          filtered.push({ id: "6", name: "HELICOPTERS" });
        }

        setCategories(filtered);
        if (filtered.length === 0) {
          setCategoriesError(
            "Your company has no approved categories to list under yet.",
          );
        }
      } catch (error) {
        setCategoriesError(
          error instanceof Error
            ? error.message
            : "Failed to load your company's categories.",
        );
      } finally {
        setIsLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  return (
    <div className="max-w-6xl mx-auto animate-slide-up pb-16">
      <div className="mb-12 flex items-center justify-between border-b border-gray-100 pb-8">
        <div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-luxury-black flex items-center mb-4 transition-colors"
          >
            <ArrowLeft size={12} className="mr-2" /> Back to Overview
          </button>
          <h2 className="text-3xl font-serif text-luxury-black">Listing</h2>
        </div>
        <div className="hidden md:block">
          <span className="text-[9px] uppercase tracking-widest text-gray-400 border border-gray-200 px-4 py-2 bg-white">
            Create Listing
          </span>
        </div>
      </div>

      {isLoadingCategories && (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoadingCategories && categoriesError && (
        <p className="mb-8 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3">
          {categoriesError}
        </p>
      )}

      {!isLoadingCategories &&
        (categoryId === "2" ? (
          <CarListingForm
            dict={carDict}
            locale={locale}
            categoryId={categoryId}
            onCategoryChange={handleCategoryChange}
            categories={categories}
          />
        ) : categoryId === "3" ? (
          <YachtListingForm
            dict={yachtDict}
            locale={locale}
            categoryId={categoryId}
            categories={categories}
            onCategoryChange={handleCategoryChange}
          />
        ) : categoryId === "1" ? (
          <RealEstateListingForm
            dict={realEstateDict}
            locale={locale}
            categoryId={categoryId}
            categories={categories}
            onCategoryChange={handleCategoryChange}
          />
        ) : categoryId === "5" ? (
          <JetListingForm
            dict={jetDict}
            locale={locale}
            categoryId={categoryId}
            categories={categories}
            onCategoryChange={handleCategoryChange}
          />
        ) : categoryId === "6" ? (
          <HelicopterListingForm
            dict={helicopterDict}
            locale={locale}
            categoryId={categoryId}
            categories={categories}
            onCategoryChange={handleCategoryChange}
          />
        ) : (
          <DefaultListingForm
            categoryId={categoryId}
            categories={categories}
            onCategoryChange={handleCategoryChange}
          />
        ))}
    </div>
  );
}
