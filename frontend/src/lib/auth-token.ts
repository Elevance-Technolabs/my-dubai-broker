// The deployed frontend and backend are on different sites, so browsers that
// block third-party cookies drop the session cookie. The backend's bearer()
// plugin returns the session token in a `set-auth-token` header on sign-in;
// we keep it here and send it as `Authorization: Bearer` on every request
// (better-auth client in auth-client.ts, everything else in core/api.ts).
const AUTH_TOKEN_KEY = "bearer_token";

export const getAuthToken = (): string | null =>
    typeof window === "undefined" ? null : localStorage.getItem(AUTH_TOKEN_KEY);

export const setAuthToken = (token: string) => {
    if (typeof window !== "undefined") localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = () => {
    if (typeof window !== "undefined") localStorage.removeItem(AUTH_TOKEN_KEY);
};
