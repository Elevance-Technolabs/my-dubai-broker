import { prisma } from "../../prisma/client.js";
import { recalculateQuality } from "./quality.service.js";
import { recalculateVisibilityGroup } from "./visibility.service.js";

/**
 * One visibility recalculation per search context at a time. Changes that
 * arrive while it runs are folded into a single follow-up run, so a burst
 * of edits can't start dozens of parallel recalculations that use up the
 * database connection pool.
 */
const groupRuns = new Map<string, { running: Promise<void>; rerun: boolean }>();

const scheduleVisibility = (category: string, offeringType: string): Promise<void> => {
	const key = `${category}|${offeringType}`;
	const current = groupRuns.get(key);
	if (current) {
		current.rerun = true;
		return current.running;
	}
	const entry = { running: Promise.resolve(), rerun: false };
	entry.running = (async () => {
		try {
			do {
				entry.rerun = false;
				await recalculateVisibilityGroup(category, offeringType);
			} while (entry.rerun);
		} finally {
			groupRuns.delete(key);
		}
	})();
	groupRuns.set(key, entry);
	return entry.running;
};

/**
 * Recalculates a listing's quality score, then visibility for its whole
 * search context (a change to one listing moves the others' positions).
 * Called after every change that can affect either score; failures are
 * logged rather than failing the user's request.
 *
 * The quality score is ready before this returns. Visibility covers every
 * competing listing, so by default it finishes in the background and the
 * user's save isn't kept waiting; pass `waitForVisibility` when the caller
 * is about to read it.
 */
export const refreshListingScores = async (
	listingId: string,
	{ waitForVisibility = false }: { waitForVisibility?: boolean } = {},
) => {
	try {
		const listing = await prisma.listing.findUnique({
			where: { id: listingId },
			select: { category: true, offeringType: true },
		});
		if (!listing) return;
		await recalculateQuality(listingId);
		const visibility = scheduleVisibility(listing.category, listing.offeringType).catch((error) =>
			console.error(`Visibility recalculation failed for listing ${listingId}:`, error),
		);
		if (waitForVisibility) await visibility;
	} catch (error) {
		console.error(`Score recalculation failed for listing ${listingId}:`, error);
	}
};

/** Recalculates every listing — used after a scoring rule change. */
export const recalculateAllScores = async () => {
	const listings = await prisma.listing.findMany({ select: { id: true, category: true, offeringType: true } });
	for (const l of listings) await recalculateQuality(l.id);
	const groups = new Map(listings.map((l) => [`${l.category}|${l.offeringType}`, l]));
	for (const l of groups.values()) await scheduleVisibility(l.category, l.offeringType);
	return { listings: listings.length, groups: groups.size };
};
