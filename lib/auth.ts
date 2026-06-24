import crypto from "crypto";
import { cookies } from "next/headers";

// ---------------------------------------------------------------------------
// Marketing authentication.
//
// Permission model:
//   - ALL employees use the signature builder with NO login.
//   - MARKETING staff must authenticate to upload + UTM-tag banners.
//
// This is a deliberately small, dependency-free gate: a shared marketing
// password (env MARKETING_PASSWORD) exchanged for a signed, httpOnly,
// expiring session cookie (HMAC with env AUTH_SECRET).
//
// UPGRADE PATH: Greenshades runs on Microsoft 365. To move to per-user SSO,
// replace verifyPassword/createSessionToken with an Entra ID (Azure AD)
// OpenID Connect flow and gate on a "Marketing" group claim. The route
// handlers and isMarketingAuthed() contract below stay the same.
// ---------------------------------------------------------------------------

const COOKIE_NAME = "gs_marketing_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function getSecret(): string {
  return process.env.AUTH_SECRET || process.env.MARKETING_PASSWORD || "dev-insecure-secret";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/** Constant-time compare to avoid timing leaks on the password check. */
export function verifyPassword(input: string): boolean {
  const expected = process.env.MARKETING_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `marketing.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, expiresStr, signature] = parts;
  const payload = `${role}.${expiresStr}`;
  const expected = sign(payload);
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return false;
  }
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  return role === "marketing";
}

export const SESSION_COOKIE = {
  name: COOKIE_NAME,
  maxAge: SESSION_TTL_MS / 1000,
};

/** Server-side check used by API routes and the marketing page. */
export async function isMarketingAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

/** True when the deployment hasn't configured a marketing password yet. */
export function isAuthConfigured(): boolean {
  return Boolean(process.env.MARKETING_PASSWORD);
}
