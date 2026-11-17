import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../prisma/client.js";
import { getCompanyResponseStats, getListingMetrics } from "./metrics.service.js";

/**
 * Organic search visibility (plan Sections 13–14).
 *
 * There is no single page position, so a listing is compared with the
 * other live listings in its search context (same category and offering).
 * Each component is scored 0–1 and weighted by the active RankRule rows,
 * which the Super Admin can change or switch off without a deploy.
 */

const DAY = 24 * 60 * 60 * 1000;
/** Price and engagement comparisons are skipped below this many listings. */
const MIN_SAMPLE = 5;
const ENGAGEMENT_WINDOW_DAYS = 30;

export const VISIBILITY_COMPONENT_LABELS: Record<string, string> = {
	relevance: "Search relevance",
	quality: "Listing quality",
	freshness_availability: "Freshness and availability",
	response_performance: "Company response performance",
	engagement: "Engagement",
	price_context: "Price context",
};

export const getActiveRankRules = async (category?: string) => {
	const rules = await prisma.rankRule.findMany({
		where: { isActive: true, OR: [{ category: null }, ...(category ? [{ category: category as any }] : [])] },
		orderBy: [{ version: "desc" }],
	});
	const byComponent = new Map<string, (typeof rules)[number]>();
	for (const rule of rules) {
		const current = byComponent.get(rule.component);
		if (!current || (rule.category && !current.category)) byComponent.set(rule.component, rule);
	}
	return [...byComponent.values()];
};

type GroupListing = Prisma.ListingGetPayload<{
	include: { availability: true; qualitySnapshot: true; company: { select: { status: true } } };
}>;

const priceOf = (l: GroupListing) => {
	const p = l.salePrice ?? l.annualRent ?? l.monthlyRent ?? l.dailyRate ?? l.charterRate;
	return p != null ? Number(p) : null;
};

const confirmedAt = (l: GroupListing) => l.availability?.confirmedAt ?? l.publishedAt ?? l.updatedAt;

const eligibilityReasons = (l: GroupListing) => {
	const reasons: string[] = [];
	if (l.company?.status !== "APPROVED") reasons.push("Company verification is not approved");
	if (l.approvalStatus !== "APPROVED") reasons.push("Listing is not approved yet");
	if (l.publicationStatus !== "LIVE") reasons.push("Listing is not live");
	const required = (l.qualitySnapshot?.breakdown as any)?.required_details;
	if (required && required.score < required.maxPoints) reasons.push("Required fields are incomplete");
	if (l.availability && !l.availability.isAvailable) reasons.push("Listing is marked as not available");
	return reasons;
};

const freshnessScore = (days: number) => (days <= 7 ? 1 : days <= 30 ? 0.7 : days <= 60 ? 0.4 : 0.1);

const describe = (component: string, value: number, l: GroupListing, extra: { days: number }) => {
	const good = value >= 0.7;
	switch (component) {
		case "quality":
			return good
				? `Strong quality score (${l.qualitySnapshot?.score ?? 0}/100)`
				: `Quality score is ${l.qualitySnapshot?.score ?? 0}/100 — complete the missing items`;
		case "freshness_availability":
			return good
				? `Availability confirmed ${extra.days} day${extra.days === 1 ? "" : "s"} ago`
				: `Availability not confirmed for ${extra.days} days`;
		case "response_performance":
			return good
				? "Your company answers enquiries quickly"
				: "Response time is slower than your response window";
		case "engagement":
			return good ? "More views and enquiries than similar listings" : "Fewer views and enquiries than similar listings";
		case "price_context":
			return good ? "Price is in line with similar listings" : "Price is far from similar listings";
		default:
			return "Matches the category and offering searched";
	}
};

/**
 * Recalculates visibility for every listing in one search context
 * (category + offering) and stores a RankSnapshot for each.
 */
export const recalculateVisibilityGroup = async (category: string, offeringType: string) => {
	const rules = await getActiveRankRules(category);
	const listings = await prisma.listing.findMany({
		where: { category: category as any, offeringType: offeringType as any },
		include: { availability: true, qualitySnapshot: true, company: { select: { status: true } } },
	});
	if (listings.length === 0) return;

	const eligible = listings.filter((l) => eligibilityReasons(l).length === 0);
	const since = new Date(Date.now() - ENGAGEMENT_WINDOW_DAYS * DAY);
	const metrics = await getListingMetrics(
		eligible.map((l) => l.id),
		{ from: since },
	);
	const companyIds = [...new Set(eligible.map((l) => l.companyId))];
	const response = new Map(
		await Promise.all(companyIds.map(async (id) => [id, await getCompanyResponseStats(id, since)] as const)),
	);

	const engagementRaw = new Map(
		eligible.map((l) => {
			const m = metrics.get(l.id);
			return [l.id, (m?.views ?? 0) + (m?.enquiries ?? 0) * 5] as const;
		}),
	);
	const maxEngagement = Math.max(0, ...engagementRaw.values());
	const prices = eligible.map(priceOf).filter((p): p is number => p != null).sort((a, b) => a - b);
	const median = prices.length ? prices[Math.floor(prices.length / 2)] : null;

	const scored = eligible.map((l) => {
		const days = Math.floor((Date.now() - confirmedAt(l).getTime()) / DAY);
		const stats = response.get(l.companyId);
		const price = priceOf(l);
		const values: Record<string, number> = {
			relevance: 1,
			quality: (l.qualitySnapshot?.score ?? 0) / 100,
			freshness_availability: freshnessScore(days),
			response_performance: stats?.responseRate ?? 0.5,
			engagement:
				eligible.length >= MIN_SAMPLE && maxEngagement > 0 ? (engagementRaw.get(l.id) ?? 0) / maxEngagement : 0.5,
			price_context:
				prices.length >= MIN_SAMPLE && median && price != null
					? Math.max(0, 1 - Math.abs(price / median - 1))
					: 0.5,
		};
		const totalWeight = rules.reduce((s, r) => s + r.weight, 0) || 1;
		const breakdown: Record<string, { label: string; value: number; weight: number }> = {};
		let score = 0;
		for (const rule of rules) {
			const value = values[rule.component] ?? 0.5;
			const weight = rule.weight / totalWeight;
			score += value * weight;
			breakdown[rule.component] = {
				label: VISIBILITY_COMPONENT_LABELS[rule.component] ?? rule.component,
				value: Math.round(value * 100) / 100,
				weight: Math.round(weight * 1000) / 1000,
			};
		}
		// The three components that move this listing the most, worst first.
		const reasons = rules
			.filter((r) => r.component !== "relevance")
			.map((r) => {
				const value = values[r.component] ?? 0.5;
				return {
					component: r.component,
					gap: (1 - value) * r.weight,
					impact: value >= 0.7 ? "positive" : value >= 0.4 ? "neutral" : "negative",
					description: describe(r.component, value, l, { days }),
				};
			})
			.sort((a, b) => b.gap - a.gap)
			.slice(0, 3)
			.map(({ gap, ...rest }) => rest);
		return { listing: l, score, breakdown, reasons };
	});

	scored.sort((a, b) => b.score - a.score);
	const total = scored.length;
	const ruleVersion = rules.reduce((max, r) => Math.max(max, r.version), 1);
	const now = new Date();

	await prisma.$transaction([
		...scored.map((s, index) => {
			const rank = index + 1;
			// "Top x%": the share of competing listings ranked above this one,
			// so the first listing is always in the top band.
			const percentile = Math.round(((rank - 1) / total) * 1000) / 10;
			const level = percentile <= 25 ? "high" : percentile <= 50 ? "medium" : "low";
			const data = {
				visibilityLevel: level,
				percentile,
				rank,
				totalCompeting: total,
				reasons: s.reasons as Prisma.InputJsonValue,
				breakdown: s.breakdown as Prisma.InputJsonValue,
				eligibilityPassed: true,
				eligibilityReasons: [] as Prisma.InputJsonValue,
				ruleVersion,
				calculatedAt: now,
			};
			return prisma.rankSnapshot.upsert({
				where: { listingId: s.listing.id },
				update: data,
				create: { listingId: s.listing.id, ...data },
			});
		}),
		...listings
			.filter((l) => !eligible.includes(l))
			.map((l) => {
				const data = {
					visibilityLevel: "not_eligible",
					percentile: null,
					rank: null,
					totalCompeting: total,
					reasons: [] as Prisma.InputJsonValue,
					breakdown: {} as Prisma.InputJsonValue,
					eligibilityPassed: false,
					eligibilityReasons: eligibilityReasons(l) as Prisma.InputJsonValue,
					ruleVersion,
					calculatedAt: now,
				};
				return prisma.rankSnapshot.upsert({
					where: { listingId: l.id },
					update: data,
					create: { listingId: l.id, ...data },
				});
			}),
	]);
};

export const VISIBILITY_LABELS: Record<string, string> = {
	high: "High",
	medium: "Medium",
	low: "Low",
	not_eligible: "Not Eligible",
};

/** "Top 10%" style band for a percentile, as shown to the partner. */
export const percentileBand = (percentile: number | null | undefined) => {
	if (percentile == null) return null;
	if (percentile <= 10) return "Top 10%";
	if (percentile <= 25) return "Top 25%";
	if (percentile <= 50) return "Top 50%";
	return "Low Visibility";
};
