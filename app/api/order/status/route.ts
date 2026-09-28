import { NextResponse, type NextRequest } from "next/server";
import { isConfigured, select } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public status lookup, keyed by the order's UUID.
//
// The id is an unguessable v4 UUID, which is what protects this — there is
// no login. Only the fields a customer needs are returned: deliberately no
// phone number, no email, no other customer's data.

export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (!isConfigured()) {
    return NextResponse.json({ error: "Not available." }, { status: 503 });
  }

  try {
    const rows = await select<{
      customer_name: string;
      pickup_time: string;
      status: string;
      wait_minutes: number | null;
      created_at: string;
    }>(
      "orders",
      `id=eq.${encodeURIComponent(id)}` +
        "&select=customer_name,pickup_time,status,wait_minutes,created_at&limit=1"
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ order: rows[0] });
  } catch (err) {
    console.error("[order/status] lookup failed:", err);
    return NextResponse.json({ error: "Could not check that order." }, { status: 502 });
  }
}
