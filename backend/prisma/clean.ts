import { prisma } from "../src/prisma/client.js";

async function main() {
	console.log("🧹 Starting database cleanup...");

	try {
		// 1. Fetch all table names in the public schema
		const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

		// 2. Filter out Prisma's internal migrations table and format for SQL
		const tables = tablenames
			.map(({ tablename }) => tablename)
			.filter((name) => name !== "_prisma_migrations")
			.map((name) => `"public"."${name}"`)
			.join(", ");

		// 3. Execute the TRUNCATE CASCADE command
		if (tables.length > 0) {
			await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
			console.log(`✅ Successfully truncated all data in tables.`);
		} else {
			console.log("⚠️ No tables found to clean.");
		}

		console.log("✨ Database is now completely empty!");
	} catch (error) {
		console.error("❌ Error cleaning the database:", error);
		throw error;
	}
}

main()
	.catch((e) => {
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
