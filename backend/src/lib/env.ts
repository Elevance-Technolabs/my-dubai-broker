import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),

	PORT: z
		.preprocess(
			(val) => (val === "" || val === undefined ? undefined : val),
			z.coerce.number().min(1).max(65535),
		)
		.default(4000),

	R2_ACCOUNT_ID: z.string().min(1),
	R2_ACCESS_KEY_ID: z.string().min(1),
	R2_SECRET_ACCESS_KEY: z.string().min(1),
	R2_BUCKET_NAME: z.string().min(1),
	R2_PUBLIC_URL: z.string().url(),

	CORS_ORIGINS: z
		.string()
		.default("http://localhost:3000")
		.transform((val) => val.split(",").map((origin) => origin.trim())),

	// GOOGLE_CLIENT_ID: z.string(),
	// GOOGLE_CLIENT_SECRET: z.string(),

	// Used to build links inside outgoing emails (invites, notifications).
	FRONTEND_URL: z.string().url().default("http://localhost:3000"),

	// "From" address for outgoing emails. No provider is wired up yet — see
	// src/lib/email.ts — so this is unused until a real one (Resend) lands.
	EMAIL_FROM: z.string().default("My Dubai Broker <noreply@mydubaibroker.com>"),

	EMAIL_VERIFICATION: z
		.preprocess((val) => {
			if (val === "true" || val === "1") return true;
			if (val === "false" || val === "0") return false;
			return val; // Let Zod handle validation if it's something else
		}, z.coerce.boolean())
		.default(false),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
	console.error("\n❌ Invalid or missing environment variables:\n");
	result.error.issues.forEach((issue) => {
		console.error(`- ${issue.path.join(".")}: ${issue.message}`);
	});
	console.error("\n💡 Fix your .env file before starting the server.\n");
	process.exit(1);
}

export const env = result.data;
