import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, bearer } from "better-auth/plugins";
import { prisma } from "../prisma/client.js";
import { emailTemplates, sendEmail } from "./email.js";
import { env } from "./env.js";
import { hashPassword, verifyPassword } from "./password.js";

const isProd =
	process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

export const auth = betterAuth({
	trustedOrigins: env.CORS_ORIGINS,
	advanced: {
		defaultCookieAttributes: {
			sameSite: isProd ? "none" : "lax",
			secure: isProd,
		},
	},
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			await sendEmail({
				to: user.email,
				...emailTemplates.verifyEmail({ url }),
			});
		},
	},
	user: {
		additionalFields: {
			role: {
				type: "string",
				// "viewer" is the least-privileged real role (matches the
				// Prisma User.role column's own @default) — every path that
				// creates a user (onboarding, invitations) sets this
				// explicitly afterward regardless. "user" is NOT a valid
				// UserRole enum value and will make signUpEmail fail with
				// FAILED_TO_CREATE_USER if this ever regresses back to it.
				defaultValue: "viewer",
			},
			companyId: {
				type: "string",
				required: false,
			},
		},
	},
	session: {
		additionalFields: {
			companyId: {
				type: "string",
			},
		},
	},
	plugins: [
		// The admin() plugin sets its own default role on every new user via
		// a databaseHooks.user.create.before hook — options.defaultRole,
		// which otherwise defaults to "user" and overrides whatever
		// additionalFields.role.defaultValue says above. "user" is not a
		// valid UserRole. This is the option that actually controls it.
		admin({ defaultRole: "viewer" }),
		// Accepts `Authorization: Bearer <token>` as an alternative to the
		// session cookie. The deployed frontend (vercel.app) and backend
		// (onrender.com) are different sites, so browsers that block
		// third-party cookies never send the cookie back — the frontend
		// stores the `set-auth-token` response header and sends it instead.
		bearer(),
	],
	// socialProviders: {
	// 	google: {
	// 		prompt: "select_account",
	// 		clientId: env.GOOGLE_CLIENT_ID,
	// 		clientSecret: env.GOOGLE_CLIENT_SECRET,
	// 	},
	// },
	emailAndPassword: {
		requireEmailVerification: env.EMAIL_VERIFICATION || false,
		enabled: true,
		sendResetPassword: async ({ user, url }) => {
			await sendEmail({
				to: user.email,
				...emailTemplates.resetPassword({ url }),
			});
		},
		// Tuned scrypt cost (r=8 instead of better-auth's default r=16) — see
		// ./password.ts for why. Must match prisma/seed.ts's hashPassword.
		password: {
			hash: hashPassword,
			verify: verifyPassword,
		},
	},
});
