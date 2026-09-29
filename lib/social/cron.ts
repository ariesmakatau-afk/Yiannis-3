// lib/social/cron.ts — shared guard for the scheduled social jobs.
// Same CRON_SECRET the order digest uses; Vercel sends it automatically.

import type { NextRequest } from "next/server";

export function cronAuthorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
