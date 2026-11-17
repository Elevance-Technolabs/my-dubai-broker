import { prisma } from "../../prisma/client.js";

/**
 * Listing performance numbers from recorded events (plan Section 16).
 * Staff and suspicious events are excluded; enquiries come from real leads.
 */

const CONTACT_EVENTS = ["PHONE_REVEAL", "CALL_CLICK", "WHATSAPP_CLICK", "EMAIL_CLICK"] as const;

export type ListingMetrics = {
	impressions: number;
	views: number;
	contacts: number;
	enquiries: number;
	/** Listing views divided by impressions (0–1), null without impressions. */
	clickThroughRate: number | null;
	/** Enquiries divided by listing views (0–1), null without views. */
	conversionRate: number | null;
};

const emptyMetrics = (): ListingMetrics => ({
	impressions: 0,
	views: 0,
	contacts: 0,
	enquiries: 0,
	clickThroughRate: null,
	conversionRate: null,
});

export const ratio = (num: number, den: number) => (den > 0 ? num / den : null);

export const getListingMetrics = async (
	listingIds: string[],
	range: { from?: Date; to?: Date } = {},
): Promise<Map<string, ListingMetrics>> => {
	const result = new Map<string, ListingMetrics>();
	for (const id of listingIds) result.set(id, emptyMetrics());
	if (listingIds.length === 0) return result;

	const createdAt =
		range.from || range.to
			? { ...(range.from ? { gte: range.from } : {}), ...(range.to ? { lte: range.to } : {}) }
			: undefined;

	const [events, leads] = await Promise.all([
		prisma.performanceEvent.groupBy({
			by: ["listingId", "eventType"],
			where: {
				listingId: { in: listingIds },
				isStaff: false,
				isSuspicious: false,
				...(createdAt ? { createdAt } : {}),
			},
			_count: { _all: true },
		}),
		prisma.lead.groupBy({
			by: ["listingId"],
			where: { listingId: { in: listingIds }, isDuplicate: false, ...(createdAt ? { createdAt } : {}) },
			_count: { _all: true },
		}),
	]);

	for (const row of events) {
		const m = result.get(row.listingId);
		if (!m) continue;
		const count = row._count._all;
		if (row.eventType === "IMPRESSION") m.impressions += count;
		else if (row.eventType === "LISTING_VIEW") m.views += count;
		else if ((CONTACT_EVENTS as readonly string[]).includes(row.eventType)) m.contacts += count;
	}
	for (const row of leads) {
		const m = result.get(row.listingId);
		if (m) m.enquiries = row._count._all;
	}
	for (const m of result.values()) {
		m.clickThroughRate = ratio(m.views, m.impressions);
		m.conversionRate = ratio(m.enquiries, m.views);
	}
	return result;
};

/** Daily views and enquiries for one listing over the last `days` days. */
export const getListingDailySeries = async (listingId: string, days = 30) => {
	const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
	from.setHours(0, 0, 0, 0);
	const [events, leads] = await Promise.all([
		prisma.performanceEvent.findMany({
			where: { listingId, createdAt: { gte: from }, isStaff: false, isSuspicious: false },
			select: { createdAt: true, eventType: true },
		}),
		prisma.lead.findMany({
			where: { listingId, createdAt: { gte: from }, isDuplicate: false },
			select: { createdAt: true },
		}),
	]);
	const series = new Map<string, { date: string; impressions: number; views: number; enquiries: number }>();
	for (let i = 0; i <= days; i++) {
		const d = new Date(from.getTime() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
		series.set(d, { date: d, impressions: 0, views: 0, enquiries: 0 });
	}
	for (const e of events) {
		const day = series.get(e.createdAt.toISOString().slice(0, 10));
		if (!day) continue;
		if (e.eventType === "IMPRESSION") day.impressions++;
		if (e.eventType === "LISTING_VIEW") day.views++;
	}
	for (const l of leads) {
		const day = series.get(l.createdAt.toISOString().slice(0, 10));
		if (day) day.enquiries++;
	}
	return [...series.values()];
};

/**
 * Company lead response: share of leads answered within the company's
 * response window, and the average first-response time in minutes.
 */
export const getCompanyResponseStats = async (companyId: string, since?: Date) => {
	const [company, leads] = await Promise.all([
		prisma.company.findUnique({ where: { id: companyId }, select: { leadSlaMinutes: true } }),
		prisma.lead.findMany({
			where: { companyId, isDuplicate: false, ...(since ? { createdAt: { gte: since } } : {}) },
			select: { createdAt: true, firstRespondedAt: true },
		}),
	]);
	const sla = company?.leadSlaMinutes ?? 60;
	if (leads.length === 0) return { total: 0, responseRate: null, avgFirstResponseMinutes: null, slaMinutes: sla };
	const responded = leads.filter((l) => l.firstRespondedAt);
	const withinSla = responded.filter(
		(l) => (l.firstRespondedAt!.getTime() - l.createdAt.getTime()) / 60000 <= sla,
	).length;
	const avg =
		responded.length > 0
			? responded.reduce((s, l) => s + (l.firstRespondedAt!.getTime() - l.createdAt.getTime()) / 60000, 0) /
				responded.length
			: null;
	return {
		total: leads.length,
		responseRate: ratio(
			withinSla,
			leads.filter((l) => l.firstRespondedAt || (Date.now() - l.createdAt.getTime()) / 60000 > sla).length,
		),
		avgFirstResponseMinutes: avg != null ? Math.round(avg) : null,
		slaMinutes: sla,
	};
};
