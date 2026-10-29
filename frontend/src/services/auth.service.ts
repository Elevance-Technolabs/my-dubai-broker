import { authClient, signIn, signOut, requestPasswordReset, resetPassword } from "@/lib/auth-client";
import { AuthResponse, LoginPayload } from "@/types/auth";
import { ApiResponse } from "@/types/types";

// Accounts are only ever created server-side (company onboarding,
// invitation acceptance) — there is no client-side self-registration
// anymore, so this service only covers login/session/password reset.
export const FrontendAuthService = {
    async login(data: LoginPayload): Promise<ApiResponse<AuthResponse>> {
        const { data: authData, error } = await signIn.email({
            email: data.email,
            password: data.password,
            rememberMe: data.rememberMe,
        });

        if (error) {
            return { success: false, error: error.message || "Login failed" };
        }

        // Warm the shared session cache before the caller navigates —
        // otherwise AuthGuard mounts on the destination page still
        // `isPending`, re-fetches the session itself, and shows a second,
        // separate full-page spinner right after this one.
        await authClient.getSession();

        return { success: true, data: authData as any };
    },

    async signOut(): Promise<ApiResponse<any>> {
        const { error } = await signOut();

        if (error) {
            return { success: false, error: error.message || "Sign out failed" };
        }

        return { success: true, data: { message: "Signed out" } };
    },

    async getSession(): Promise<ApiResponse<AuthResponse>> {
        const { data: authData, error } = await authClient.getSession();

        if (error) {
            return { success: false, error: error.message || "Failed to get session" };
        }

        return { success: true, data: authData as any };
    },

    async forgotPassword(email: string, redirectTo: string): Promise<ApiResponse<any>> {
        const { error } = await requestPasswordReset({ email, redirectTo });

        if (error) {
            return { success: false, error: error.message || "Failed to send reset email" };
        }

        return { success: true, data: { message: "Reset email sent" } };
    },

    async resetPassword(newPassword: string, token: string): Promise<ApiResponse<any>> {
        const { error } = await resetPassword({ newPassword, token });

        if (error) {
            return { success: false, error: error.message || "Failed to reset password" };
        }

        return { success: true, data: { message: "Password reset" } };
    },
};
