// Edge-safe token helpers (no next/headers import)
const SECRET = process.env.AUTH_SECRET || "dev-secret";

async function hmac(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function makeToken(): Promise<string> {
  const payload = `teacher.${Date.now()}`;
  return `${payload}.${await hmac(payload)}`;
}

export async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const i = token.lastIndexOf(".");
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = await hmac(payload);
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let k = 0; k < sig.length; k++)
    diff |= sig.charCodeAt(k) ^ expected.charCodeAt(k);
  return diff === 0;
}

export const SESSION_COOKIE = "st_session";
