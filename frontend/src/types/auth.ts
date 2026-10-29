
// There is no client-side registration payload — every account is created
// server-side (company onboarding, invitation acceptance).

export interface LoginPayload {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    user: AuthUser;
    session: {
        id: string;
        token: string;
        expiresAt: string;
    };
}