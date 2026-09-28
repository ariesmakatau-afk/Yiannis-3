// lib/session.ts
//
// Authentication for /kitchen and /admin.
//
// A single shared staff password rather than per-user accounts. That is a
// deliberate trade: a kitchen tablet and the owner's phone are the only two
// devices, casual staff come and go, and nobody wants to manage user records
// for a yiros shop. The cost is that changing the password logs everyone out
// — which is exactly what you want when someone leaves.
//
// The session cookie carries an expiry and an HMAC signature, so it cannot be
// forged without STAFF_SESSION_SECRET. httpOnly keeps it away from scripts.

import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "yiannis_staff";
const SESSION_DAYS = 14;

function secret(): string {
  const s = process.env.STAFF_SESSION_SECRET;
  if (!s) throw new Error("STAFF_SESSION_SECRET is not set.");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

/** Constant-time compare, so a wrong password can't be found by timing. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.STAFF_PASSWORD;
  if (!expected) return false;
  return safeEqual(candidate, expected);
}

/** Build a signed cookie value: "<expiryMs>.<signature>". */
export function createSessionValue(): string {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = String(expires);
  return `${payload}.${sign(payload)}`;
}

/** Verify a cookie value: correct signature and not expired. */
export function verifySessionValue(value: string | undefined): boolean {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;

  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return false; // secret missing — fail closed
  }
  if (!safeEqual(signature, expected)) return false;

  const expires = Number(payload);
  return Number.isFinite(expires) && expires > Date.now();
}

export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;
