// lib/adminAuth.ts
type VerifyResult =
  | { ok: true; payload: { u: string; iat: number; exp: number } }
  | { ok: false; error: string };

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  // Works in Edge (btoa) and Node (Buffer)
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function hmacSha256(secret: string, input: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(input));
  return new Uint8Array(sig);
}

/**
 * Creates an admin session token (Edge-safe).
 * Env required: ADMIN_SESSION_SECRET
 */
export async function createAdminSessionToken(opts: { user: string; ttlSeconds?: number }) {
  const secret = mustEnv("ADMIN_SESSION_SECRET");
  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.max(60, Math.floor(opts.ttlSeconds ?? 60 * 60 * 24)); // default 24h
  const payload = { u: opts.user, iat: now, exp: now + ttl };

  const payloadJson = JSON.stringify(payload);
  const payloadB64 = bytesToBase64Url(new TextEncoder().encode(payloadJson));

  const sigBytes = await hmacSha256(secret, payloadB64);
  const sigB64 = bytesToBase64Url(sigBytes);

  return `${payloadB64}.${sigB64}`;
}

/**
 * Verifies an admin session token (Edge-safe).
 * Env required: ADMIN_SESSION_SECRET
 */
export async function verifyAdminSessionToken(token: string): Promise<VerifyResult> {
  const secret = mustEnv("ADMIN_SESSION_SECRET");
  const t = (token || "").trim();
  const parts = t.split(".");
  if (parts.length !== 2) return { ok: false, error: "Malformed token" };

  const [payloadB64, sigB64] = parts;

  // verify signature
  const expectedSig = await hmacSha256(secret, payloadB64);
  const gotSig = base64UrlToBytes(sigB64);

  if (!timingSafeEqual(expectedSig, gotSig)) return { ok: false, error: "Bad signature" };

  // decode payload
  let payload: any;
  try {
    const payloadBytes = base64UrlToBytes(payloadB64);
    payload = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    return { ok: false, error: "Bad payload" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload?.u || !payload?.iat || !payload?.exp) return { ok: false, error: "Invalid payload" };
  if (now >= Number(payload.exp)) return { ok: false, error: "Token expired" };

  return { ok: true, payload: { u: String(payload.u), iat: Number(payload.iat), exp: Number(payload.exp) } };
}