import { hashPassword } from "../src/lib/password.js";
import {
	CompanyStatus,
	CompanyOnboardingStep,
	CompanyCategory,
	UserRole,
} from "../generated/prisma/enums.js";
import { prisma } from "../src/prisma/client.js";

async function main() {
	console.log("🌱 Starting database seeding...");

	// 1. Create the platform's own company workspace
	const companyName = "My Dubai Broker";
	const company = await prisma.company.upsert({
		where: { name: companyName },
		update: {},
		create: {
			name: companyName,
			slug: "my-dubai-broker",
			status: CompanyStatus.APPROVED,
			onboardingStep: CompanyOnboardingStep.COMPLETED,
			onboardingCompletedAt: new Date(),
			categories: [
				CompanyCategory.REAL_ESTATE,
				CompanyCategory.CARS,
				CompanyCategory.YACHTS,
				CompanyCategory.PRIVATE_AVIATION,
				CompanyCategory.COLLECTIBLES,
			],
			description: "The premier multi-category luxury brokerage in Dubai.",
			contactEmail: "hello@mydubaibroker.com",
			languages: ["English", "Arabic"],
			leadSlaMinutes: 60,
			timezone: "Asia/Dubai",
		},
	});
	console.log(`✅ Company created/found: ${company.name}`);

	// 2. Super Admin
	const adminEmail = "super.admin@mdb.com";
	const hashedPassword = await hashPassword("admin@123");
	const adminUserId = "user_super_admin_001";

	const user = await prisma.user.upsert({
		where: { email: adminEmail },
		update: {},
		create: {
			id: adminUserId,
			name: "Super Admin",
			email: adminEmail,
			emailVerified: true,
			role: UserRole.super_admin,
			companyId: company.id,
		},
	});
	console.log(`✅ Super Admin created/found: ${user.email}`);

	const existingAccount = await prisma.account.findFirst({
		where: { userId: user.id, providerId: "credential" },
	});

	if (!existingAccount) {
		await prisma.account.create({
			data: {
				id: `account_${adminUserId}`,
				userId: user.id,
				// better-auth's sign-in-email flow looks up the credential
				// account by `accountId === userId` (see
				// api/routes/sign-in.mjs), NOT by email — accountId must be
				// the user's own id here, not their email address.
				accountId: user.id,
				providerId: "credential",
				password: hashedPassword,
			},
		});
		console.log(`✅ Credentials account created for: ${user.email}`);
	} else {
		await prisma.account.update({
			where: { id: existingAccount.id },
			data: { password: hashedPassword, accountId: user.id },
		});
		console.log(`✅ Credentials account updated for: ${user.email}`);
	}

	// 3. Platform Reviewer account
	const reviewerEmail = "reviewer@mdb.com";
	const reviewerUserId = "user_reviewer_001";

	const reviewer = await prisma.user.upsert({
		where: { email: reviewerEmail },
		update: {},
		create: {
			id: reviewerUserId,
			name: "Platform Reviewer",
			email: reviewerEmail,
			emailVerified: true,
			role: UserRole.platform_reviewer,
			companyId: company.id,
		},
	});
	console.log(`✅ Reviewer created/found: ${reviewer.email}`);

	const existingReviewerAccount = await prisma.account.findFirst({
		where: { userId: reviewerUserId, providerId: "credential" },
	});
	if (!existingReviewerAccount) {
		await prisma.account.create({
			data: {
				id: `account_${reviewerUserId}`,
				userId: reviewerUserId,
				// Same reasoning as the super-admin account above — accountId
				// must equal the user's id, not their email.
				accountId: reviewerUserId,
				providerId: "credential",
				password: await hashPassword("reviewer@123"),
			},
		});
		console.log(`✅ Credentials account created for: ${reviewer.email}`);
	} else {
		await prisma.account.update({
			where: { id: existingReviewerAccount.id },
			data: { password: await hashPassword("reviewer@123"), accountId: reviewerUserId },
		});
		console.log(`✅ Credentials account updated for: ${reviewer.email}`);
	}

	// 4. Default Quality Rules
	const qualityRules = [
		{
			component: "required_details",
			maxPoints: 20,
			weight: 0.2,
			checks: [
				{ field: "title", label: "Title (5+ chars)", points: 3 },
				{ field: "description", label: "Description (20+ chars)", points: 5 },
				{ field: "category", label: "Category selected", points: 3 },
				{ field: "assetType", label: "Asset type selected", points: 3 },
				{ field: "offeringType", label: "Offering type selected", points: 3 },
				{ field: "price", label: "Price set or POQ marked", points: 3 },
			],
		},
		{
			component: "media",
			maxPoints: 20,
			weight: 0.2,
			checks: [
				{ field: "photoUrls", label: "At least 3 photos", points: 8, minCount: 3 },
				{ field: "photoUrls", label: "At least 8 photos", points: 7, minCount: 8 },
				{ field: "coverImageUrl", label: "Cover image set", points: 2 },
				{ field: "videoUrl", label: "Video added", points: 3 },
			],
		},
		{
			component: "verification",
			maxPoints: 25,
			weight: 0.25,
			checks: [
				{ field: "licenseNumber", label: "License/permit number", points: 15 },
				{ field: "company.status", label: "Company approved", points: 10 },
			],
		},
		{
			component: "title_description",
			maxPoints: 15,
			weight: 0.15,
			checks: [
				{ field: "title", label: "Title is unique (no template text)", points: 5 },
				{ field: "description", label: "Description is detailed (100+ chars)", points: 10, minLength: 100 },
			],
		},
		{
			component: "location_specs",
			maxPoints: 10,
			weight: 0.1,
			checks: [
				{ field: "city", label: "City specified", points: 4 },
				{ field: "area", label: "Area or district specified", points: 3 },
				{ field: "latitude", label: "Coordinates (map pin)", points: 3 },
			],
		},
		{
			component: "freshness_availability",
			maxPoints: 10,
			weight: 0.1,
			checks: [
				{ field: "availability.confirmedAt", label: "Availability confirmed in last 30 days", points: 7 },
				{ field: "updatedAt", label: "Listing updated in last 60 days", points: 3 },
			],
		},
	];

	for (const rule of qualityRules) {
		// category is nullable (these are global, not per-category, rules) —
		// Prisma's compound-unique `where` input rejects an explicit `null`
		// for a nullable field in the key, so upsert() can't be used here.
		// Find-then-create-or-update instead.
		const existingRule = await prisma.qualityRule.findFirst({
			where: { category: null, component: rule.component, version: 1 },
		});
		if (existingRule) {
			await prisma.qualityRule.update({
				where: { id: existingRule.id },
				data: { checks: rule.checks, weight: rule.weight, maxPoints: rule.maxPoints },
			});
		} else {
			await prisma.qualityRule.create({
				data: {
					component: rule.component,
					maxPoints: rule.maxPoints,
					weight: rule.weight,
					checks: rule.checks,
					isActive: true,
					version: 1,
				},
			});
		}
	}
	console.log(`✅ Default quality rules seeded (${qualityRules.length} components)`);

	// 5. Default Rank Rules
	const rankRules = [
		{ component: "relevance", weight: 0.3 },
		{ component: "quality", weight: 0.25 },
		{ component: "freshness_availability", weight: 0.15 },
		{ component: "response_performance", weight: 0.1 },
		{ component: "engagement", weight: 0.1 },
		{ component: "price_context", weight: 0.1 },
	];

	for (const rule of rankRules) {
		// Same reasoning as the quality rules loop above — find-then-create-or-
		// update instead of upsert, since category is null (global rule).
		const existingRankRule = await prisma.rankRule.findFirst({
			where: { category: null, component: rule.component, version: 1 },
		});
		if (existingRankRule) {
			await prisma.rankRule.update({
				where: { id: existingRankRule.id },
				data: { weight: rule.weight },
			});
		} else {
			await prisma.rankRule.create({
				data: {
					component: rule.component,
					weight: rule.weight,
					isActive: true,
					version: 1,
				},
			});
		}
	}
	console.log(`✅ Default rank rules seeded (${rankRules.length} components)`);

	console.log("\n🎉 Seeding completed successfully!");
	console.log("\nSeed accounts:");
	console.log(`  Super Admin : ${adminEmail} / admin@123`);
	console.log(`  Reviewer    : ${reviewerEmail} / reviewer@123`);
}

main()
	.catch((e) => {
		console.error("❌ Seeding failed:");
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
