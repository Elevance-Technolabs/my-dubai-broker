import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001",
    user: {
        additionalFields: {
            role: {
                type: "string",
                // "viewer" is the least-privileged real role — every account
                // creation path (onboarding, invitations) sets this
                // explicitly server-side regardless, this is just the
                // client-side type/default matching the server config.
                defaultValue: "viewer"
            },
            companyId: {
                type: "string",
                required: false
            }
        }
    },
    plugins: [adminClient()]
});

// Sign-up is never called directly from the browser — every account is
// created server-side (company onboarding, invitation acceptance), so
// there's no `signUp` export here.
export const { signIn, signOut, useSession, requestPasswordReset, resetPassword } = authClient;