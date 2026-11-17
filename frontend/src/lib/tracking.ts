import { API_BASE_URL } from "@/core/env";
import { getAuthToken } from "@/lib/auth-token";

/**
 * Listing performance tracking: impressions, detail views and contact
 * clicks are sent to the backend so dashboards show real numbers. Sent
 * fire-and-forget; tracking must never break the page.
 */

export type TrackedEvent =
  | "IMPRESSION"
  | "LISTING_VIEW"
  | "PHONE_REVEAL"
  | "CALL_CLICK"
  | "WHATSAPP_CLICK"
  | "EMAIL_CLICK"
  | "FAVOURITE"
  | "SHARE";

const SESSION_KEY = "mdb_session_ref";

/** Anonymous per-browser-session id, used to ignore repeated views. */
const sessionRef = () => {
  if (typeof window === "undefined") return undefined;
  try {
    let ref = sessionStorage.getItem(SESSION_KEY);
    if (!ref) {
      ref = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, ref);
    }
    return ref;
  } catch {
    return undefined;
  }
};

// An impression counts once per listing per page session, even when a list
// re-renders (filters, carousels).
const seenImpressions = new Set<string>();

export function trackListingEvents(events: { listingId: string; eventType: TrackedEvent }[]) {
  if (typeof window === "undefined") return;
  events = events.filter((e) => {
    if (e.eventType !== "IMPRESSION") return true;
    if (seenImpressions.has(e.listingId)) return false;
    seenImpressions.add(e.listingId);
    return true;
  });
  if (events.length === 0) return;
  const ref = sessionRef();
  const token = getAuthToken();
  const body = JSON.stringify({
    events: events.slice(0, 50).map((e) => ({
      ...e,
      sessionRef: ref,
      sourcePage: window.location.pathname.slice(0, 300),
    })),
  });
  fetch(`${API_BASE_URL}/events`, {
    method: "POST",
    credentials: "include",
    keepalive: true,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body,
  }).catch(() => {});
}

export const trackListingEvent = (listingId: string, eventType: TrackedEvent) =>
  trackListingEvents([{ listingId, eventType }]);
