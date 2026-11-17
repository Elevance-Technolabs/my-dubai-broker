import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		adapter,
		// Every query in full is slow to print; set PRISMA_LOG_QUERIES=true to see them.
		log: process.env.PRISMA_LOG_QUERIES === "true" ? ["query", "info", "warn", "error"] : ["warn", "error"],
		// Prisma's defaults (2s to start, 5s to finish) are too tight for the
		// free hosting tier and a remote database.
		transactionOptions: { maxWait: 10_000, timeout: 20_000 },
	});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
