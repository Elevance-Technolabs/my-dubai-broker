/**
 * Short-lived in-memory caches for the two lookups every signed-in request
 * makes: "who is this session?" and "what may this user do?". The database
 * is remote, so each lookup costs a full round trip; caching them for a few
 * seconds removes 2–3 round trips from almost every request.
 *
 * Anything that changes a user's access (deactivation, role or permission
 * changes, sign-out) clears that user's entries straight away, so the cache
 * never grants access that was just taken away.
 */

const SESSION_TTL_MS = 30_000;
const ACCESS_TTL_MS = 30_000;
const MAX_ENTRIES = 5_000;

type SessionEntry = { user: any; session: any; expiresAt: number };
type AccessEntry = { permissions: Record<string, boolean> | null; banned: boolean; expiresAt: number };

const sessions = new Map<string, SessionEntry>();
const access = new Map<string, AccessEntry>();

const prune = <T extends { expiresAt: number }>(map: Map<string, T>) => {
	if (map.size < MAX_ENTRIES) return;
	const now = Date.now();
	for (const [key, value] of map) if (value.expiresAt <= now) map.delete(key);
	// Still full: drop the oldest entries (Map keeps insertion order).
	while (map.size >= MAX_ENTRIES) map.delete(map.keys().next().value as string);
};

/** The credential a request carries: its bearer token or its cookies. */
export const sessionKeyOf = (headers: { authorization?: string; cookie?: string }) =>
	headers.authorization?.startsWith("Bearer ") ? headers.authorization : headers.cookie ? `cookie:${headers.cookie}` : null;

export const getCachedSession = (key: string | null) => {
	if (!key) return null;
	const entry = sessions.get(key);
	if (!entry) return null;
	const sessionExpiry = entry.session?.expiresAt ? new Date(entry.session.expiresAt).getTime() : Infinity;
	if (entry.expiresAt <= Date.now() || sessionExpiry <= Date.now()) {
		sessions.delete(key);
		return null;
	}
	return entry;
};

export const cacheSession = (key: string | null, user: any, session: any) => {
	if (!key) return;
	prune(sessions);
	sessions.set(key, { user, session, expiresAt: Date.now() + SESSION_TTL_MS });
};

export const forgetSessionKey = (key: string | null) => {
	if (key) sessions.delete(key);
};

export const getCachedAccess = (userId: string) => {
	const entry = access.get(userId);
	if (!entry) return null;
	if (entry.expiresAt <= Date.now()) {
		access.delete(userId);
		return null;
	}
	return entry;
};

export const cacheAccess = (userId: string, permissions: Record<string, boolean> | null, banned: boolean) => {
	prune(access);
	access.set(userId, { permissions, banned, expiresAt: Date.now() + ACCESS_TTL_MS });
};

/** Call whenever a user's role, permissions, company or active state changes. */
export const invalidateUserAccess = (userId: string) => {
	access.delete(userId);
	for (const [key, entry] of sessions) if (entry.user?.id === userId) sessions.delete(key);
};
