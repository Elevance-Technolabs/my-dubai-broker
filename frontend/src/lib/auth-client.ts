import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { clearAuthToken, getAuthToken, setAuthToken } from "./auth-token";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001",
    fetchOptions: {
        auth: {
            type: "Bearer",
            token: () => getAuthToken() ?? "",
        },
        onSuccess: (ctx) => {
            const token = ctx.response.headers.get("set-auth-token");
            if (token) setAuthToken(token);
        },
    },
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
export const { signIn, useSession, requestPasswordReset, resetPassword } = authClient;

// Always drop the stored bearer token, even if the server call fails —
// otherwise a stale token would keep the user "signed in" on this device.
export const signOut = async (...args: Parameters<typeof authClient.signOut>) => {
    try {
        return await authClient.signOut(...args);
    } finally {
        clearAuthToken();
    }
};