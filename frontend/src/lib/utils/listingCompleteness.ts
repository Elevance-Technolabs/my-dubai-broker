// Interim listing "score" for the admin panel. The real quality engine
// (QualityRule/QualitySnapshot) isn't built yet, so this is a transparent
// completeness check computed from the mapped listing the API already returns.

export interface CompletenessCheck {
  label: string;
  weight: number;
  earned: number; // 0..weight (details check can be partial)
  hint?: string;
}

export interface Completeness {
  score: number;
  rating: "Excellent" | "Good" | "Fair" | "Poor";
  checks: CompletenessCheck[];
  missing: string[];
}

const DETAIL_KEYS: Record<string, string[]> = {
  CARS: ["make", "model", "year", "mileage", "condition", "transmission", "fuelType", "exteriorColor"],
  REAL_ESTATE: ["propertyType", "bedrooms", "bathrooms", "builtUpArea", "community", "completionStatus"],
  YACHTS: ["builder", "model", "year", "lengthFt", "cabins", "hullMaterial"],
  PRIVATE_AVIATION: ["manufacturer", "model", "year", "totalHours", "passengerCapacity", "rangeNm"],
  COLLECTIBLES: ["makerOrArtist", "year", "condition", "referenceNumber"],
};

const isFilled = (v: unknown) =>
  v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);

const hasPrice = (p: any) =>
  !!p &&
  (p.priceOnRequest ||
    [p.salePrice, p.annualRent, p.monthlyRent, p.dailyRate, p.charterRate].some(
      (n) => n != null,
    ));

export const computeCompleteness = (listing: any): Completeness => {
  const photos = listing.media?.photos?.length ?? 0;
  const detailKeys = DETAIL_KEYS[listing.category] ?? [];
  const filledDetails = detailKeys.filter((k) => isFilled(listing.details?.[k])).length;

  const checks: CompletenessCheck[] = [
    { label: "At least 1 photo", weight: 10, earned: photos >= 1 ? 10 : 0, hint: "Add a photo" },
    { label: "5+ photos", weight: 10, earned: photos >= 5 ? 10 : 0, hint: "Add more photos (5+)" },
    {
      label: "Description (150+ chars)",
      weight: 15,
      earned: (listing.description?.trim().length ?? 0) >= 150 ? 15 : 0,
      hint: "Write a fuller description",
    },
    { label: "Pricing", weight: 15, earned: hasPrice(listing.pricing) ? 15 : 0, hint: "Set a price" },
    {
      label: "Location",
      weight: 10,
      earned: listing.location?.city && listing.location?.area ? 10 : 0,
      hint: "Add city and area",
    },
    {
      label: "Contact details",
      weight: 10,
      earned: listing.contact?.email && listing.contact?.phone ? 10 : 0,
      hint: "Add contact email and phone",
    },
    {
      label: "Category details",
      weight: 25,
      earned: detailKeys.length ? Math.round((filledDetails / detailKeys.length) * 25) : 25,
      hint: detailKeys.length
        ? `Complete asset specs (${filledDetails}/${detailKeys.length} filled)`
        : undefined,
    },
    {
      label: "Video or VR tour",
      weight: 5,
      earned: listing.media?.video || listing.media?.vrTour ? 5 : 0,
      hint: "Add a video or VR tour",
    },
  ];

  const score = checks.reduce((sum, c) => sum + c.earned, 0);
  const rating = score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Fair" : "Poor";
  const missing = checks.filter((c) => c.earned < c.weight && c.hint).map((c) => c.hint as string);

  return { score, rating, checks, missing };
};

// Picks the displayed amount and its unit suffix from a pricing object.
export const resolveListingPrice = (p?: any) => {
  if (p?.salePrice != null) return { amount: p.salePrice, suffix: "" };
  if (p?.annualRent != null) return { amount: p.annualRent, suffix: " / yr" };
  if (p?.monthlyRent != null) return { amount: p.monthlyRent, suffix: " / mo" };
  if (p?.dailyRate != null) return { amount: p.dailyRate, suffix: " / day" };
  if (p?.charterRate != null) return { amount: p.charterRate, suffix: " / hr" };
  return { amount: undefined, suffix: "" };
};

export const formatListingPrice = (p?: any) => {
  const { amount, suffix } = resolveListingPrice(p);
  if (!p || p.priceOnRequest || amount == null) return "Price on Request";
  return `${p.currency} ${Number(amount).toLocaleString()}${suffix}`;
};
