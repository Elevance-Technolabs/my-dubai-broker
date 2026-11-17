import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../prisma/client.js";

/**
 * Listing Quality Score (plan Section 12).
 *
 * The score is built from the active QualityRule rows (one per component),
 * so the Super Admin can change component points or switch a component off
 * from the Configuration page without a deploy. Each rule's `checks` array
 * lists what is checked; a component's score is the share of its check
 * points earned, scaled to the component's `maxPoints`.
 */

const DAY = 24 * 60 * 60 * 1000;

export const COMPONENT_LABELS: Record<string, string> = {
	required_details: "Required details",
	media: "Media",
	verification: "Verification",
	title_description: "Title and description",
	location_specs: "Location and specifications",
	freshness_availability: "Freshness and availability",
};

type RuleCheck = {
	field: string;
	label: string;
	points: number;
	minCount?: number;
	minLength?: number;
};

type ScoringListing = Prisma.ListingGetPayload<{
	include: { availability: true; company: { select: { status: true } } };
}>;

export type QualityCheckResult = {
	label: string;
	points: number;
	passed: boolean;
	action?: string;
};

export type QualityBreakdown = Record<
	string,
	{ label: string; score: number; maxPoints: number; checks: QualityCheckResult[] }
>;

const hasPrice = (l: ScoringListing) =>
	l.priceOnRequest ||
	[l.salePrice, l.annualRent, l.monthlyRent, l.dailyRate, l.charterRate].some((p) => p != null);

// Words that suggest placeholder text rather than a real, specific title.
const TEMPLATE_WORDS = /\b(test|lorem|ipsum|sample|dummy|untitled|asdf)\b/i;

const availabilityDate = (l: ScoringListing) =>
	l.availability?.confirmedAt ?? l.publishedAt ?? null;

/** Returns whether a check passes, and the action that would fix it. */
const evaluateCheck = (
	component: string,
	check: RuleCheck,
	l: ScoringListing,
	now: number,
): { passed: boolean; action: string } => {
	switch (check.field) {
		case "title":
			if (component === "title_description") {
				const t = l.title.trim();
				return {
					passed: t.length >= 20 && !TEMPLATE_WORDS.test(t) && t !== t.toUpperCase(),
					action: "Write a specific title of at least 20 characters (no placeholder text or all capitals)",
				};
			}
			return { passed: l.title.trim().length >= 5, action: "Add a title of at least 5 characters" };
		case "description": {
			const min = check.minLength ?? 20;
			return {
				passed: l.description.trim().length >= min,
				action: `Write a description of at least ${min} characters`,
			};
		}
		case "category":
			return { passed: !!l.category, action: "Select a category" };
		case "assetType":
			return { passed: !!l.assetType, action: "Select an asset type" };
		case "offeringType":
			return { passed: !!l.offeringType, action: "Select an offering" };
		case "price":
			return { passed: hasPrice(l), action: "Add a price or mark it as price on request" };
		case "photoUrls": {
			const min = check.minCount ?? 1;
			const missing = Math.max(0, min - l.photoUrls.length);
			return {
				passed: missing === 0,
				action: `Add ${missing} more photo${missing === 1 ? "" : "s"} (at least ${min} in total)`,
			};
		}
		case "coverImageUrl":
			// The first photo is used as the cover when none is set separately.
			return { passed: !!l.coverImageUrl || l.photoUrls.length > 0, action: "Add a cover image" };
		case "videoUrl":
			return { passed: !!l.videoUrl, action: "Add a video" };
		case "licenseNumber":
			return { passed: !!l.licenseNumber?.trim(), action: "Add the permit, licence or registration number" };
		case "company.status":
			return { passed: l.company?.status === "APPROVED", action: "Company verification must be approved" };
		case "city":
			return { passed: !!l.city?.trim(), action: "Add the city" };
		case "area":
			return { passed: !!(l.area?.trim() || l.operatingBase?.trim()), action: "Add the area, community or operating base" };
		case "latitude":
			return { passed: l.latitude != null && l.longitude != null, action: "Add the map location (coordinates)" };
		case "availability.confirmedAt": {
			const confirmed = availabilityDate(l);
			return {
				passed: !!confirmed && now - confirmed.getTime() <= 30 * DAY,
				action: "Confirm the listing is still available",
			};
		}
		case "updatedAt":
			return { passed: now - l.updatedAt.getTime() <= 60 * DAY, action: "Review and update the listing details" };
		default: {
			// Unknown field from a custom rule: pass when the field has a value.
			const value = (l as Record<string, unknown>)[check.field];
			return { passed: value != null && value !== "", action: `Complete: ${check.label}` };
		}
	}
};

export const ratingFor = (score: number) =>
	score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "needs_attention" : "incomplete";

export const RATING_LABELS: Record<string, string> = {
	excellent: "Excellent",
	good: "Good",
	needs_attention: "Needs Attention",
	incomplete: "Incomplete",
};

/** Active rules: the highest version of each component, global or for this category. */
export const getActiveQualityRules = async (category?: string) => {
	const rules = await prisma.qualityRule.findMany({
		where: { isActive: true, OR: [{ category: null }, ...(category ? [{ category: category as any }] : [])] },
		orderBy: [{ version: "desc" }],
	});
	const byComponent = new Map<string, (typeof rules)[number]>();
	for (const rule of rules) {
		const current = byComponent.get(rule.component);
		// A category-specific rule wins over the global one.
		if (!current || (rule.category && !current.category)) byComponent.set(rule.component, rule);
	}
	return [...byComponent.values()];
};

export const computeQuality = async (listing: ScoringListing) => {
	const rules = await getActiveQualityRules(listing.category);
	const now = Date.now();
	const breakdown: QualityBreakdown = {};
	let score = 0;
	const maxTotal = rules.reduce((sum, r) => sum + r.maxPoints, 0);
	// The final score is out of 100, so a check's points are shown on that
	// same scale even when the active components add up to more or less.
	const toHundred = maxTotal > 0 ? 100 / maxTotal : 1;

	for (const rule of rules) {
		const checks = (rule.checks as RuleCheck[]) ?? [];
		const checkTotal = checks.reduce((sum, c) => sum + c.points, 0) || 1;
		const scale = rule.maxPoints / checkTotal;
		let earned = 0;
		const results: QualityCheckResult[] = checks.map((check) => {
			const { passed, action } = evaluateCheck(rule.component, check, listing, now);
			const points = Math.round(check.points * scale * toHundred * 10) / 10;
			if (passed) earned += check.points;
			return { label: check.label, points, passed, ...(passed ? {} : { action }) };
		});
		const componentScore = Math.round(earned * scale);
		breakdown[rule.component] = {
			label: COMPONENT_LABELS[rule.component] ?? rule.component,
			score: componentScore,
			maxPoints: rule.maxPoints,
			checks: results,
		};
		score += componentScore;
	}

	// Scale to 100 when components are switched off or re-weighted.
	const finalScore = maxTotal > 0 ? Math.round((score / maxTotal) * 100) : 0;
	const ruleVersion = rules.reduce((max, r) => Math.max(max, r.version), 1);
	return { score: finalScore, rating: ratingFor(finalScore), breakdown, ruleVersion };
};

/** Recalculates and stores the quality snapshot for one listing. */
export const recalculateQuality = async (listingId: string) => {
	const listing = await prisma.listing.findUnique({
		where: { id: listingId },
		include: { availability: true, company: { select: { status: true } } },
	});
	if (!listing) return null;

	const result = await computeQuality(listing);
	const existing = await prisma.qualitySnapshot.findUnique({ where: { listingId } });
	const data = {
		score: result.score,
		rating: result.rating,
		breakdown: result.breakdown as Prisma.InputJsonValue,
		ruleVersion: result.ruleVersion,
		calculatedAt: new Date(),
		previousScore: existing && existing.score !== result.score ? existing.score : existing?.previousScore ?? null,
	};
	return prisma.qualitySnapshot.upsert({
		where: { listingId },
		update: data,
		create: { listingId, ...data },
	});
};

/** Turns a stored breakdown into the actions shown to the partner, biggest gain first. */
export const qualityActions = (breakdown: QualityBreakdown) =>
	Object.values(breakdown)
		.flatMap((component) =>
			component.checks
				.filter((c) => !c.passed && c.action)
				.map((c) => ({ component: component.label, action: c.action as string, points: c.points })),
		)
		.sort((a, b) => b.points - a.points);
