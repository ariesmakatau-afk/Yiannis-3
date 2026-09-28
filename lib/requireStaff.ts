// lib/requireStaff.ts
//
// The real authentication check. Middleware only confirms a cookie exists;
// this verifies the signature, and runs in the Node runtime where crypto is
// available. Every protected page and API route calls it.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/session";

/** True if the current request carries a valid staff session. */
export function isStaff(): boolean {
  return verifySessionValue(cookies().get(SESSION_COOKIE)?.value);
}

/** For pages: bounce to the login screen unless signed in. */
export function requireStaffPage(next: string): void {
  if (!isStaff()) {
    redirect(`/staff?next=${encodeURIComponent(next)}`);
  }
}
