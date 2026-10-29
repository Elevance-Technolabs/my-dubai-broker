"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CarListingForm from "./CarListingForm";
import YachtListingForm from "./YachtListingForm";
import RealEstateListingForm from "./RealEstateListingForm";
import JetListingForm from "./JetListingForm";
import HelicopterListingForm from "./HelicopterListingForm";
import {
  CarListingDict,
  HomeDict,
  YachtListingDict,
  RealEstateListingDict,
  JetListingDict,
  HelicopterListingDict,
} from "@/types/dictionary";
import { Locale } from "@/i18n/config";
import { listingService } from "@/services/listing.service";
import { AssetType } from "@/types/listing";
import Button from "@/components/ui/Button";

type EditListingManagerProps = {
  carDict: CarListingDict;
  homeDict: HomeDict;
  locale: Locale;
  yachtDict: YachtListingDict;
  realEstateDict: RealEstateListingDict;
  jetDict: JetListingDict;
  helicopterDict: HelicopterListingDict;
  listingId: string;
};

const toCommaString = (values?: string[] | null) => (values ?? []).join(", ");

export default function EditListingManager({
  carDict,
  yachtDict,
  realEstateDict,
  jetDict,
  helicopterDict,
  locale,
  listingId,
}: EditListingManagerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetType, setAssetType] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Record<string, any> | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      // One unified fetch — category-specific fields live under `details`.
      const res = await listingService.getListingById(listingId);
      if (cancelled) return;
      if (!res.success || !res.data) {
        setError(res.error || "Listing not found");
        setLoading(false);
        return;
      }

      const listing = res.data as any;
      const d = listing.details ?? {};
      const p = listing.pricing ?? {};

      const type =
        listing.category === "CARS"
          ? AssetType.CAR
          : listing.category === "YACHTS"
            ? AssetType.YACHT
            : listing.category === "REAL_ESTATE"
              ? AssetType.REAL_ESTATE
              : listing.assetType === "HELICOPTER"
                ? AssetType.HELICOPTER
                : listing.assetType === "JET"
                  ? AssetType.JET
                  : null;

      if (!type) {
        setError(`Editing ${listing.categoryLabel ?? "this"} listings isn't supported yet`);
        setLoading(false);
        return;
      }

      const common = {
        title: listing.title,
        description: listing.description ?? "",
        price:
          (p.offeringType === "CHARTER"
            ? (p.charterRate ?? p.dailyRate)
            : null) ??
          p.salePrice ??
          p.annualRent ??
          p.monthlyRent ??
          p.dailyRate ??
          p.charterRate ??
          0,
        currency: p.currency ?? "AED",
        existingPhotoKeys: listing.media?.photos ?? [],
        videoUrl: listing.media?.video ?? "",
        // Not persisted by the backend; prefilled so the required field doesn't block saving.
        qualityNarrative: listing.description ?? "",
        internalReferenceCode: listing.internalRef ?? "",
        licenseNumber: listing.licenseNumber ?? "",
        primaryEmail: listing.contact?.email ?? "",
        primaryPhone: listing.contact?.phone ?? "",
      };

      if (type === AssetType.CAR) {
        setInitialData({
          ...common,
          brand: d.make ?? "",
          model: d.model ?? "",
          year: d.year,
          variant: d.variant ?? "",
          mileage: d.mileage ?? 0,
          condition: d.condition ?? "",
          transmission: d.transmission ?? "",
          engineSize: d.engineSize ?? "",
          horsepower: d.horsepower ?? 0,
          color: d.exteriorColor ?? "",
          interiorColor: d.interiorColor ?? "",
          warranty: !!d.warranty,
          options: d.options ?? [],
          negotiable: !!p.negotiable,
        });
      } else if (type === AssetType.JET) {
        setInitialData({
          ...common,
          offeringType: p.offeringType === "CHARTER" ? "CHARTER" : "SALE",
          rateBasis:
            p.dailyRate != null && p.charterRate == null ? "DAY" : "HOUR",
          manufacturer: d.manufacturer ?? "",
          model: d.model ?? "",
          year: d.year,
          totalHours: d.totalHours,
          passengerCapacity: d.passengerCapacity,
          range: d.rangeNm,
          interiorDetails: d.interiorDetails ?? "",
          avionics: d.avionics ?? "",
          maintenanceHistory: d.maintenanceHistory ?? "",
        });
      } else if (type === AssetType.HELICOPTER) {
        setInitialData({
          ...common,
          offeringType: p.offeringType === "CHARTER" ? "CHARTER" : "SALE",
          rateBasis:
            p.dailyRate != null && p.charterRate == null ? "DAY" : "HOUR",
          manufacturer: d.manufacturer ?? "",
          model: d.model ?? "",
          year: d.year,
          rotorHours: d.engineHours,
          seating: d.passengerCapacity,
          interiorDetails: d.interiorDetails ?? "",
          avionics: d.avionics ?? "",
          maintenance: d.maintenanceHistory ?? "",
        });
      } else if (type === AssetType.YACHT) {
        setInitialData({
          ...common,
          yachtType: String(listing.assetType ?? "").replace(/_/g, " "),
          make: d.builder ?? "",
          year: d.year,
          length: d.lengthFt,
          beam: d.beamFt,
          engineHours: d.engineHours,
          cabins: d.cabins,
          materials: d.hullMaterial ?? "",
          navigation: d.navigation ?? [],
        });
      } else {
        setInitialData({
          ...common,
          propertyType: d.propertyType ?? "",
          status:
            p.offeringType === "LONG_TERM_RENT"
              ? "RENT"
              : p.offeringType === "OFF_PLAN"
                ? "OFF_PLAN"
                : "SALE",
          permitNumber: d.permitNumber ?? "",
          bedrooms: d.bedrooms,
          bathrooms: d.bathrooms,
          builtUpArea: d.builtUpArea,
          plotArea: d.plotArea,
          floor: d.floor,
          parking: d.parking,
          developer: d.developer ?? "",
          furnished: !!d.furnished,
          paymentPlan: d.paymentPlan ?? "",
          views: toCommaString(d.views),
          outdoor: toCommaString(d.outdoor),
          indoor: toCommaString(d.indoor),
          community: toCommaString(d.communityFeatures),
          propertyTags: toCommaString(d.propertyTags),
        });
      }

      setAssetType(type);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !initialData || !assetType) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-gray-400">{error || "Listing not found"}</p>
        <Button variant="dark" onClick={() => router.push("/dashboard")}>
          Back to Overview
        </Button>
      </div>
    );
  }

  const noop = () => {};

  switch (assetType) {
    case AssetType.CAR:
      return (
        <CarListingForm
          dict={carDict}
          locale={locale}
          categoryId=""
          onCategoryChange={noop}
          categories={[]}
          mode="edit"
          listingId={listingId}
          initialData={initialData as any}
        />
      );
    case AssetType.JET:
      return (
        <JetListingForm
          dict={jetDict}
          locale={locale}
          categoryId=""
          onCategoryChange={noop}
          categories={[]}
          mode="edit"
          listingId={listingId}
          initialData={initialData as any}
        />
      );
    case AssetType.HELICOPTER:
      return (
        <HelicopterListingForm
          dict={helicopterDict}
          locale={locale}
          categoryId=""
          onCategoryChange={noop}
          categories={[]}
          mode="edit"
          listingId={listingId}
          initialData={initialData as any}
        />
      );
    case AssetType.YACHT:
      return (
        <YachtListingForm
          dict={yachtDict}
          locale={locale}
          categoryId=""
          onCategoryChange={noop}
          categories={[]}
          mode="edit"
          listingId={listingId}
          initialData={initialData as any}
        />
      );
    default:
      return (
        <RealEstateListingForm
          dict={realEstateDict}
          locale={locale}
          categoryId=""
          onCategoryChange={noop}
          categories={[]}
          mode="edit"
          listingId={listingId}
          initialData={initialData as any}
        />
      );
  }
}
