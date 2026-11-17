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
import { fromListingLocation, fromListingPhotos } from "@/lib/schemas/listingBase";

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
      // With pending changes applied: a second edit continues from the first
      // rather than from the live version.
      const res = await listingService.getListingById(listingId, { withPending: true });
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
        // Cover first, in the listing's order.
        photos: fromListingPhotos(listing.media?.photos ?? []),
        videoUrl: listing.media?.video ?? "",
        vrTourUrl: listing.media?.vrTour ?? "",
        // Not persisted by the backend; prefilled so the required field doesn't block saving.
        qualityNarrative: listing.description ?? "",
        internalReferenceCode: listing.internalRef ?? "",
        licenseNumber: listing.licenseNumber ?? "",
        primaryEmail: listing.contact?.email ?? "",
        primaryPhone: listing.contact?.phone ?? "",
        ...fromListingLocation(listing),
      };
      const text = (v: unknown) => (v == null ? "" : String(v));
      const list = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
      const dateOnly = (v: unknown) => (v ? String(v).slice(0, 10) : "");
      const isCharter = p.offeringType === "CHARTER";
      const rateBasis = p.dailyRate != null && p.charterRate == null ? "DAY" : "HOUR";

      if (type === AssetType.CAR) {
        setInitialData({
          ...common,
          offeringType: ["SHORT_TERM_RENT", "LONG_TERM_RENT"].includes(p.offeringType) ? p.offeringType : "SALE",
          brand: d.make ?? "",
          bodyType: listing.assetType ?? "",
          model: d.model ?? "",
          year: d.year,
          variant: text(d.variant),
          mileage: d.mileage ?? 0,
          condition: d.condition ?? "",
          transmission: d.transmission ?? "",
          fuelType: text(d.fuelType),
          engineSize: text(d.engineSize),
          horsepower: d.horsepower ?? undefined,
          color: d.exteriorColor ?? "",
          interiorColor: text(d.interiorColor),
          doors: d.doors ?? undefined,
          seats: d.seats ?? undefined,
          regionalSpec: text(d.regionalSpec),
          registrationYear: d.registrationYear ?? undefined,
          plateNumber: text(d.plateNumber),
          chassisNumber: text(d.chassisNumber),
          warranty: !!d.warranty,
          serviceHistory: !!d.serviceHistory,
          options: list(d.options),
          rentalTerms: text(d.rentalTerms),
          negotiable: !!p.negotiable,
        });
      } else if (type === AssetType.JET) {
        setInitialData({
          ...common,
          offeringType: isCharter ? "CHARTER" : "SALE",
          rateBasis,
          manufacturer: d.manufacturer ?? "",
          model: d.model ?? "",
          year: d.year,
          serialNumber: text(d.serialNumber),
          registrationTail: text(d.registrationTail),
          totalHours: d.totalHours,
          engineHours: d.engineHours ?? undefined,
          passengerCapacity: d.passengerCapacity,
          range: d.rangeNm,
          interiorConfig: text(d.interiorConfig),
          interiorDetails: text(d.interiorDetails),
          avionics: text(d.avionics),
          maintenanceHistory: text(d.maintenanceHistory),
          lastInspectionDate: dateOnly(d.lastInspectionDate),
          amenities: list(d.amenities),
        });
      } else if (type === AssetType.HELICOPTER) {
        setInitialData({
          ...common,
          offeringType: isCharter ? "CHARTER" : "SALE",
          rateBasis,
          manufacturer: d.manufacturer ?? "",
          model: d.model ?? "",
          year: d.year,
          serialNumber: text(d.serialNumber),
          registrationTail: text(d.registrationTail),
          totalHours: d.totalHours ?? undefined,
          rotorHours: d.engineHours,
          engineModel: text(d.engineModel),
          seating: d.passengerCapacity,
          range: d.rangeNm ?? undefined,
          interiorConfig: text(d.interiorConfig),
          interiorDetails: text(d.interiorDetails),
          avionics: text(d.avionics),
          maintenance: text(d.maintenanceHistory),
          lastInspectionDate: dateOnly(d.lastInspectionDate),
          amenities: list(d.amenities),
        });
      } else if (type === AssetType.YACHT) {
        setInitialData({
          ...common,
          // Older yachts kept the home port only in their details.
          operatingBase: common.operatingBase || text(d.homePort),
          offeringType: isCharter ? "CHARTER" : "SALE",
          rateBasis: p.charterRate != null ? "HOUR" : "DAY",
          yachtType: listing.assetType ?? "",
          make: d.builder ?? "",
          model: text(d.model),
          year: d.year,
          length: d.lengthFt,
          beam: d.beamFt,
          draft: d.draftFt ?? undefined,
          engineHours: d.engineHours ?? undefined,
          engines: text(d.engines),
          cabins: d.cabins ?? undefined,
          guestCapacity: d.guestCapacity ?? undefined,
          crewCapacity: d.crewCapacity ?? undefined,
          crewIncluded: !!d.crewIncluded,
          materials: text(d.hullMaterial),
          flag: text(d.flag),
          registrationNumber: text(d.registrationNumber),
          classification: text(d.classification),
          charterAvailability: text(d.charterAvailability),
          navigation: list(d.navigation),
          amenities: list(d.amenities),
        });
      } else {
        setInitialData({
          ...common,
          status:
            p.offeringType === "OFF_PLAN"
              ? "OFF_PLAN"
              : p.offeringType === "SHORT_TERM_RENT"
                ? "SHORT_TERM"
                : p.offeringType === "LONG_TERM_RENT"
                  ? p.monthlyRent != null && p.annualRent == null
                    ? "RENT_MONTHLY"
                    : "RENT_YEARLY"
                  : "SALE",
          propertyType: listing.assetType ?? "",
          permitNumber: text(d.permitNumber),
          building: text(d.building),
          bedrooms: d.bedrooms,
          bathrooms: d.bathrooms,
          builtUpArea: d.builtUpArea,
          plotArea: d.plotArea ?? undefined,
          floor: d.floor ?? undefined,
          totalFloors: d.totalFloors ?? undefined,
          parking: d.parking ?? undefined,
          developer: text(d.developer),
          completionStatus: text(d.completionStatus),
          serviceCharge: d.serviceCharge != null ? Number(d.serviceCharge) : undefined,
          furnished: !!d.furnished,
          paymentPlan: text(d.paymentPlan),
          views: list(d.views),
          outdoor: list(d.outdoor),
          indoor: list(d.indoor),
          communityFeatures: list(d.communityFeatures),
          amenities: list(d.amenities),
          propertyTags: list(d.propertyTags),
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
