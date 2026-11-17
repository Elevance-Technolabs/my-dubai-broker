import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../utils/AppError.js";
import { exportAdminListingsCsv, toCsv } from "../listings/listings.admin.js";
import { ratio } from "../scoring/metrics.service.js";
import { COMPONENT_LABELS } from "../scoring/quality.service.js";
import { recalculateAllScores } from "../scoring/scoring.service.js";
import { VISIBILITY_COMPONENT_LABELS } from "../scoring/visibility.service.js";

/**
 * Super Admin Leads, Reports and Configuration (plan Section 7).
 */

const DAY = 24 * 60 * 60 * 1000;
const MAX_ROWS = 5000;
const QUALIFIED_STAGES = ["QUALIFIED", "APPOINTMENT", "NEGOTIATION", "WON"];
const OPEN_STAGES = ["NEW", "CONTACTED", "QUALIFIED", "APPOINTMENT", "NEGOTIATION"];

const range = (from?: Date, to?: Date) =>
	from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined;

// ─── Leads ────────────────────────────────────────────────────

export type AdminLeadQuery = {
	page?: number;
	limit?: number;
	companyId?: string;
	stage?: string;
	assignedToId?: string;
	overdueOnly?: boolean;
	search?: string;
	dateFrom?: Date;
	dateTo?: Date;
};

const loadAdminLeads = async (q: AdminLeadQuery) => {
	const createdAt = range(q.dateFrom, q.dateTo);
	const where: Prisma.LeadWhereInput = {
		...(q.companyId ? { companyId: q.companyId } : {}),
		...(q.stage ? { stage: q.stage as any } : {}),
		...(q.assignedToId === "unassigned" ? { assignedToId: null } : q.assignedToId ? { assignedToId: q.assignedToId } : {}),
		...(createdAt ? { createdAt } : {}),
		...(q.search
			? {
					OR: [
						{ customerName: { contains: q.search, mode: "insensitive" } },
						{ customerEmail: { contains: q.search, mode: "insensitive" } },
						{ customerPhone: { contains: q.search } },
						{ listing: { title: { contains: q.search, mode: "insensitive" } } },
					],
				}
			: {}),
	};
	const leads = await prisma.lead.findMany({
		where,
		orderBy: { createdAt: "desc" },
		take: MAX_ROWS,
		select: {
			id: true,
			createdAt: true,
			stage: true,
			customerName: true,
			customerEmail: true,
			customerPhone: true,
			isDuplicate: true,
			firstRespondedAt: true,
			lastActivityAt: true,
			sourcePage: true,
			utmSource: true,
			company: { select: { id: true, name: true, leadSlaMinutes: true } },
			listing: { select: { id: true, title: true, publicRef: true } },
			assignedTo: { select: { id: true, name: true, banned: true } },
		},
	});
	const now = Date.now();
	return leads.map((l) => {
		const sla = l.company.leadSlaMinutes ?? 60;
		const responseMinutes = l.firstRespondedAt
			? Math.round((l.firstRespondedAt.getTime() - l.createdAt.getTime()) / 60000)
			: null;
		const waitingMinutes = Math.round((now - l.createdAt.getTime()) / 60000);
		return {
			...l,
			slaMinutes: sla,
			responseMinutes,
			// No response yet and past the company's response window.
			overdue: !l.firstRespondedAt && OPEN_STAGES.includes(l.stage) && waitingMinutes > sla,
			respondedWithinSla: responseMinutes != null ? responseMinutes <= sla : null,
			// Answered, or the response window has already passed.
			windowClosed: responseMinutes != null || waitingMinutes > sla,
		};
	});
};

export const getAdminLeads = async (q: AdminLeadQuery) => {
	const all = await loadAdminLeads(q);
	const rows = q.overdueOnly ? all.filter((l) => l.overdue) : all;
	const responded = all.filter((l) => l.responseMinutes != null);
	const byStage: Record<string, number> = {};
	for (const l of all) byStage[l.stage] = (byStage[l.stage] ?? 0) + 1;
	const page = Math.max(1, q.page ?? 1);
	const limit = Math.min(100, Math.max(1, q.limit ?? 25));
	return {
		leads: rows.slice((page - 1) * limit, page * limit),
		summary: {
			total: all.length,
			newLeads: byStage.NEW ?? 0,
			unassigned: all.filter((l) => !l.assignedTo || l.assignedTo.banned).length,
			overdue: all.filter((l) => l.overdue).length,
			duplicates: all.filter((l) => l.isDuplicate).length,
			avgFirstResponseMinutes: responded.length
				? Math.round(responded.reduce((s, l) => s + (l.responseMinutes ?? 0), 0) / responded.length)
				: null,
			responseRate: ratio(
				all.filter((l) => l.respondedWithinSla).length,
				all.filter((l) => l.windowClosed).length,
			),
			byStage,
		},
		pagination: { total: rows.length, page, limit, totalPages: Math.ceil(rows.length / limit) },
	};
};

// ─── Reports ──────────────────────────────────────────────────

export type ReportQuery = { from?: Date; to?: Date; category?: string; companyId?: string };

const countBy = <T extends string>(rows: { key: T; count: number }[]) =>
	Object.fromEntries(rows.map((r) => [r.key, r.count]));

export const getReportSummary = async (q: ReportQuery) => {
	const to = q.to ?? new Date();
	const from = q.from ?? new Date(to.getTime() - 30 * DAY);
	const listingScope: Prisma.ListingWhereInput = {
		...(q.category ? { category: q.category as any } : {}),
		...(q.companyId ? { companyId: q.companyId } : {}),
	};
	const created = { gte: from, lte: to };

	const [
		companiesByStatus,
		newCompanies,
		listingsByApproval,
		listingsByPublication,
		listingsByCategory,
		newListings,
		leadsInRange,
		events,
	] = await Promise.all([
		prisma.company.groupBy({
			by: ["status"],
			where: q.companyId ? { id: q.companyId } : {},
			_count: { _all: true },
		}),
		prisma.company.count({ where: { createdAt: created, ...(q.companyId ? { id: q.companyId } : {}) } }),
		prisma.listing.groupBy({ by: ["approvalStatus"], where: listingScope, _count: { _all: true } }),
		prisma.listing.groupBy({ by: ["publicationStatus"], where: listingScope, _count: { _all: true } }),
		prisma.listing.groupBy({ by: ["category"], where: listingScope, _count: { _all: true } }),
		prisma.listing.count({ where: { ...listingScope, createdAt: created } }),
		prisma.lead.findMany({
			where: { createdAt: created, listing: listingScope },
			select: {
				id: true,
				createdAt: true,
				stage: true,
				isDuplicate: true,
				firstRespondedAt: true,
				listingId: true,
				company: { select: { leadSlaMinutes: true } },
			},
		}),
		prisma.performanceEvent.findMany({
			where: { createdAt: created, isStaff: false, isSuspicious: false, listing: listingScope },
			select: { createdAt: true, eventType: true, listingId: true },
		}),
	]);

	const valid = leadsInRange.filter((l) => !l.isDuplicate);
	const responded = valid.filter((l) => l.firstRespondedAt);
	const withinSla = responded.filter(
		(l) => (l.firstRespondedAt!.getTime() - l.createdAt.getTime()) / 60000 <= (l.company.leadSlaMinutes ?? 60),
	);
	const leadsByStage: Record<string, number> = {};
	for (const l of valid) leadsByStage[l.stage] = (leadsByStage[l.stage] ?? 0) + 1;

	const totals = { impressions: 0, views: 0, contacts: 0 };
	const perListing = new Map<string, { views: number; enquiries: number }>();
	const days = Math.min(366, Math.ceil((to.getTime() - from.getTime()) / DAY) + 1);
	const daily = new Map<string, { date: string; views: number; enquiries: number }>();
	for (let i = 0; i < days; i++) {
		const d = new Date(from.getTime() + i * DAY).toISOString().slice(0, 10);
		daily.set(d, { date: d, views: 0, enquiries: 0 });
	}
	for (const e of events) {
		if (e.eventType === "IMPRESSION") totals.impressions++;
		else if (e.eventType === "LISTING_VIEW") {
			totals.views++;
			const p = perListing.get(e.listingId) ?? { views: 0, enquiries: 0 };
			p.views++;
			perListing.set(e.listingId, p);
			const day = daily.get(e.createdAt.toISOString().slice(0, 10));
			if (day) day.views++;
		} else if (["PHONE_REVEAL", "CALL_CLICK", "WHATSAPP_CLICK", "EMAIL_CLICK"].includes(e.eventType)) totals.contacts++;
	}
	for (const l of valid) {
		const p = perListing.get(l.listingId) ?? { views: 0, enquiries: 0 };
		p.enquiries++;
		perListing.set(l.listingId, p);
		const day = daily.get(l.createdAt.toISOString().slice(0, 10));
		if (day) day.enquiries++;
	}

	const topIds = [...perListing.entries()]
		.sort((a, b) => b[1].enquiries - a[1].enquiries || b[1].views - a[1].views)
		.slice(0, 10);
	const topListings = await prisma.listing.findMany({
		where: { id: { in: topIds.map(([id]) => id) } },
		select: { id: true, title: true, publicRef: true, company: { select: { name: true } } },
	});
	const titleOf = new Map(topListings.map((l) => [l.id, l]));

	return {
		range: { from, to },
		generatedAt: new Date(),
		companies: {
			byStatus: countBy(companiesByStatus.map((r) => ({ key: r.status, count: r._count._all }))),
			newInRange: newCompanies,
		},
		listings: {
			byApproval: countBy(listingsByApproval.map((r) => ({ key: r.approvalStatus, count: r._count._all }))),
			byPublication: countBy(listingsByPublication.map((r) => ({ key: r.publicationStatus, count: r._count._all }))),
			byCategory: countBy(listingsByCategory.map((r) => ({ key: r.category, count: r._count._all }))),
			newInRange: newListings,
		},
		leads: {
			total: valid.length,
			duplicates: leadsInRange.length - valid.length,
			byStage: leadsByStage,
			responseRate: ratio(
				withinSla.length,
				valid.filter(
					(l) =>
						l.firstRespondedAt ||
						(Date.now() - l.createdAt.getTime()) / 60000 > (l.company.leadSlaMinutes ?? 60),
				).length,
			),
			avgFirstResponseMinutes: responded.length
				? Math.round(
						responded.reduce((s, l) => s + (l.firstRespondedAt!.getTime() - l.createdAt.getTime()) / 60000, 0) /
							responded.length,
					)
				: null,
			qualifiedRate: ratio(valid.filter((l) => QUALIFIED_STAGES.includes(l.stage)).length, valid.length),
			won: leadsByStage.WON ?? 0,
			lost: leadsByStage.LOST ?? 0,
		},
		performance: {
			...totals,
			enquiries: valid.length,
			clickThroughRate: ratio(totals.views, totals.impressions),
			conversionRate: ratio(valid.length, totals.views),
		},
		topListings: topIds.map(([id, m]) => ({
			id,
			title: titleOf.get(id)?.title ?? "—",
			publicRef: titleOf.get(id)?.publicRef ?? "",
			company: titleOf.get(id)?.company.name ?? "",
			views: m.views,
			enquiries: m.enquiries,
			conversionRate: ratio(m.enquiries, m.views),
		})),
		daily: [...daily.values()],
	};
};

export const exportReportCsv = async (type: string, q: ReportQuery) => {
	const created = range(q.from, q.to);
	switch (type) {
		case "listings":
			return exportAdminListingsCsv({ category: q.category, companyId: q.companyId, dateFrom: q.from, dateTo: q.to });
		case "companies": {
			const companies = await prisma.company.findMany({
				where: { ...(created ? { createdAt: created } : {}), ...(q.companyId ? { id: q.companyId } : {}) },
				orderBy: { createdAt: "desc" },
				include: {
					assignedReviewer: { select: { name: true } },
					_count: { select: { listings: true, leads: true, users: true } },
				},
			});
			return toCsv(
				["Company", "Status", "Categories", "Contact email", "Reviewer", "Users", "Listings", "Leads", "Created"],
				companies.map((c) => [
					c.name, c.status, c.categories.join(" / "), c.contactEmail, c.assignedReviewer?.name,
					c._count.users, c._count.listings, c._count.leads, c.createdAt,
				]),
			);
		}
		case "leads": {
			const leads = await loadAdminLeads({ companyId: q.companyId, dateFrom: q.from, dateTo: q.to });
			return toCsv(
				["Created", "Customer", "Email", "Phone", "Stage", "Company", "Listing", "Assigned to", "First response (min)", "Within SLA", "Overdue", "Duplicate", "Source"],
				leads.map((l) => [
					l.createdAt, l.customerName, l.customerEmail, l.customerPhone, l.stage, l.company.name,
					l.listing.publicRef, l.assignedTo?.name, l.responseMinutes,
					l.respondedWithinSla == null ? "" : l.respondedWithinSla ? "Yes" : "No",
					l.overdue ? "Yes" : "No", l.isDuplicate ? "Yes" : "No", l.utmSource ?? l.sourcePage,
				]),
			);
		}
		case "performance": {
			const summary = await getReportSummary(q);
			return toCsv(
				["Date", "Views", "Enquiries"],
				summary.daily.map((d) => [d.date, d.views, d.enquiries]),
			);
		}
		default:
			throw new AppError("Unknown report type", 400);
	}
};

// ─── Configuration ────────────────────────────────────────────

const latestGlobalRules = async <T extends { component: string; version: number }>(rows: T[]) => {
	const byComponent = new Map<string, T>();
	for (const r of rows.sort((a, b) => b.version - a.version)) {
		if (!byComponent.has(r.component)) byComponent.set(r.component, r);
	}
	return [...byComponent.values()];
};

export const getConfiguration = async () => {
	const [quality, ranking, history] = await Promise.all([
		prisma.qualityRule.findMany({ where: { category: null } }),
		prisma.rankRule.findMany({ where: { category: null } }),
		prisma.auditLog.findMany({
			where: { action: { startsWith: "config." } },
			orderBy: { createdAt: "desc" },
			take: 20,
			include: { actor: { select: { name: true } } },
		}),
	]);
	const q = await latestGlobalRules(quality);
	const r = await latestGlobalRules(ranking);
	return {
		quality: q
			.map((rule) => ({
				component: rule.component,
				label: COMPONENT_LABELS[rule.component] ?? rule.component,
				maxPoints: rule.maxPoints,
				isActive: rule.isActive,
				version: rule.version,
				checks: rule.checks,
			}))
			.sort((a, b) => b.maxPoints - a.maxPoints),
		ranking: r
			.map((rule) => ({
				component: rule.component,
				label: VISIBILITY_COMPONENT_LABELS[rule.component] ?? rule.component,
				weight: Math.round(rule.weight * 1000) / 10,
				isActive: rule.isActive,
				version: rule.version,
			}))
			.sort((a, b) => b.weight - a.weight),
		history: history.map((h) => ({
			at: h.createdAt,
			actor: h.actor.name,
			action: h.action,
			reason: h.reason,
			previousValue: h.previousValue,
			newValue: h.newValue,
		})),
	};
};

type QualityInput = { component: string; maxPoints: number; isActive: boolean };
type RankingInput = { component: string; weight: number; isActive: boolean };

export const updateQualityConfig = async (components: QualityInput[], reason: string, actorId: string) => {
	if (!reason?.trim()) throw new AppError("A reason is required to change scoring rules.", 400);
	const current = await latestGlobalRules(await prisma.qualityRule.findMany({ where: { category: null } }));
	const byComponent = new Map(current.map((r) => [r.component, r]));
	if (components.some((c) => !byComponent.has(c.component))) throw new AppError("Unknown quality component.", 400);
	if (!components.some((c) => c.isActive && c.maxPoints > 0)) {
		throw new AppError("At least one quality component must be active.", 400);
	}
	const version = Math.max(...current.map((r) => r.version)) + 1;

	await prisma.$transaction([
		prisma.qualityRule.updateMany({ where: { category: null }, data: { isActive: false } }),
		...components.map((c) => {
			const old = byComponent.get(c.component)!;
			return prisma.qualityRule.create({
				data: {
					component: c.component,
					maxPoints: c.maxPoints,
					weight: c.maxPoints / 100,
					isActive: c.isActive,
					version,
					checks: old.checks as Prisma.InputJsonValue,
				},
			});
		}),
		prisma.auditLog.create({
			data: {
				actorId,
				action: "config.quality_rules_changed",
				entityType: "configuration",
				entityId: "quality_rules",
				previousValue: current.map((r) => ({ component: r.component, maxPoints: r.maxPoints, isActive: r.isActive })),
				newValue: components,
				reason: reason.trim(),
			},
		}),
	]);
	const recalculated = await recalculateAllScores();
	return { version, recalculated };
};

export const updateRankingConfig = async (components: RankingInput[], reason: string, actorId: string) => {
	if (!reason?.trim()) throw new AppError("A reason is required to change ranking rules.", 400);
	const current = await latestGlobalRules(await prisma.rankRule.findMany({ where: { category: null } }));
	const known = new Set(current.map((r) => r.component));
	if (components.some((c) => !known.has(c.component))) throw new AppError("Unknown ranking component.", 400);
	const activeTotal = components.filter((c) => c.isActive).reduce((s, c) => s + c.weight, 0);
	if (Math.round(activeTotal) !== 100) {
		throw new AppError(`Active weights must add up to 100% (currently ${Math.round(activeTotal * 10) / 10}%).`, 400);
	}
	const version = Math.max(...current.map((r) => r.version)) + 1;

	await prisma.$transaction([
		prisma.rankRule.updateMany({ where: { category: null }, data: { isActive: false } }),
		...components.map((c) =>
			prisma.rankRule.create({
				data: { component: c.component, weight: c.weight / 100, isActive: c.isActive, version },
			}),
		),
		prisma.auditLog.create({
			data: {
				actorId,
				action: "config.ranking_rules_changed",
				entityType: "configuration",
				entityId: "ranking_rules",
				previousValue: current.map((r) => ({ component: r.component, weight: r.weight * 100, isActive: r.isActive })),
				newValue: components,
				reason: reason.trim(),
			},
		}),
	]);
	const recalculated = await recalculateAllScores();
	return { version, recalculated };
};
