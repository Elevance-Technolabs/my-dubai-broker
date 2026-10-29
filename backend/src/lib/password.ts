import { randomBytes, scrypt } from "node:crypto";

// Same envelope format as better-auth's own default scrypt hasher
// (`${salt}:${keyHex}`, see @better-auth/utils/dist/password.node.mjs), but
// with r=8 instead of the library default r=16 — half the memory/CPU cost
// per hash (r=16 was making every login take 0.5-2s+), while r=8/N=16384 is
// still a standard "interactive" scrypt preset, not a weak one.
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, dkLen: 64 };

function deriveKey(password: string, salt: string): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		scrypt(
			password.normalize("NFKC"),
			salt,
			SCRYPT_PARAMS.dkLen,
			{
				N: SCRYPT_PARAMS.N,
				r: SCRYPT_PARAMS.r,
				p: SCRYPT_PARAMS.p,
				maxmem: 128 * SCRYPT_PARAMS.N * SCRYPT_PARAMS.r * 2,
			},
			(err, key) => {
				if (err) reject(err);
				else resolve(key);
			},
		);
	});
}

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString("hex");
	const key = await deriveKey(password, salt);
	return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword({
	hash,
	password,
}: {
	hash: string;
	password: string;
}): Promise<boolean> {
	const [salt, key] = hash.split(":");
	if (!salt || !key) throw new Error("Invalid password hash");
	const derived = await deriveKey(password, salt);
	return derived.toString("hex") === key;
}
