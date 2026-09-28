import { NextResponse, type NextRequest } from "next/server";
import { isStaff } from "@/lib/requireStaff";
import { isConfigured, select, update } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUS = ["new", "accepted", "rejected", "collected"] as const;
type Status = (typeof VALID_STATUS)[number];

/** List today's orders, newest first. */
export async function GET() {
  if (!isStaff()) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Database not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  // Midnight local-ish: orders are cleared daily, so anything still here is
  // today's. The filter is belt-and-braces in case a digest was missed.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const orders = await select<Record<string, unknown>>(
      "orders",
      `created_at=gte.${since}&order=created_at.desc`
    );
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[kitchen/orders] load failed:", err);
    return NextResponse.json({ error: "Could not load orders." }, { status: 502 });
  }
}

/** Update one order's status and/or wait time. */
export async function PATCH(request: NextRequest) {
  if (!isStaff()) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { id, status, waitMinutes } = body as Record<string, unknown>;

  if (typeof id !== "string" || id.length === 0) {
    return NextResponse.json({ error: "Order id is required." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if (status !== undefined) {
    if (typeof status !== "string" || !VALID_STATUS.includes(status as Status)) {
      return NextResponse.json({ error: "Unknown status." }, { status: 400 });
    }
    patch.status = status;
  }

  if (waitMinutes !== undefined) {
    if (
      waitMinutes !== null &&
      (typeof waitMinutes !== "number" || waitMinutes < 0 || waitMinutes > 240)
    ) {
      return NextResponse.json({ error: "Wait time looks wrong." }, { status: 400 });
    }
    patch.wait_minutes = waitMinutes;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const rows = await update<Record<string, unknown>>(
      "orders",
      `id=eq.${encodeURIComponent(id)}`,
      patch
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ order: rows[0] });
  } catch (err) {
    console.error("[kitchen/orders] update failed:", err);
    return NextResponse.json({ error: "Could not update the order." }, { status: 502 });
  }
}
