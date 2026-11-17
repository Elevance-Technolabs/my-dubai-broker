"use client";

import { useEffect } from "react";
import { trackListingEvent, trackListingEvents } from "@/lib/tracking";

/** Records one detail-page view when a public listing page opens. */
export function TrackListingView({ listingId }: { listingId: string }) {
  useEffect(() => {
    trackListingEvent(listingId, "LISTING_VIEW");
  }, [listingId]);
  return null;
}

/** Records that these listings appeared in a list or search result. */
export function TrackImpressions({ listingIds }: { listingIds: string[] }) {
  const key = listingIds.join(",");
  useEffect(() => {
    if (!key) return;
    trackListingEvents(key.split(",").map((listingId) => ({ listingId, eventType: "IMPRESSION" as const })));
  }, [key]);
  return null;
}
