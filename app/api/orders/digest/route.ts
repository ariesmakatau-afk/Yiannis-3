import { NextResponse, type NextRequest } from "next/server";
import { business } from "@/lib/content";
import { isConfigured, select, update } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Weekly digest: email the week's orders, then mark them archived.
//
// Orders are NEVER deleted — they are the sales record, and at ~1KB a row
// even five years fits inside a free database tier. `archived_at` only
// records that an order has been reported, so the next run skips it.
//
// Triggered by a scheduled job (see vercel.json), not a person. Guarded by
// CRON_SECRET so a stranger can't trigger sends or mass-archive orders.

type Item = { name: string; quantity: number; notes?: string };
type Order = {
  id: string;
  created_at: string;
  customer_name: string;
  phone: string;
  pickup_time: string;
  email: string | null;
  order_notes: string | null;
  items: Item[];
  status: string;
  wait_minutes: number | null;
  archived_at: string | null;
};

function authorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

function buildHtml(orders: Order[]): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  const first = new Date(orders[0].created_at);
  const last = new Date(orders[orders.length - 1].created_at);
  const range = `${fmt(first)} – ${fmt(last)}`;

  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const rows = orders
    .map((o) => {
      const items = o.items
        .map((i) => `${i.quantity}× ${i.name}${i.notes ? ` (${i.notes})` : ""}`)
        .join("<br>");
      const time = new Date(o.created_at).toLocaleString("en-AU", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
      });
      return `
        <tr style="border-bottom:1px solid #e3e9ec">
          <td style="padding:10px 8px;vertical-align:top;white-space:nowrap">${time}</td>
          <td style="padding:10px 8px;vertical-align:top">
            <strong>${o.customer_name}</strong><br>
            <span style="color:#667">${o.phone}</span>
            ${o.email ? `<br><span style="color:#667">${o.email}</span>` : ""}
          </td>
          <td style="padding:10px 8px;vertical-align:top">${items}
            ${o.order_notes ? `<br><em style="color:#846">Note: ${o.order_notes}</em>` : ""}
          </td>
          <td style="padding:10px 8px;vertical-align:top;white-space:nowrap">${o.pickup_time}</td>
          <td style="padding:10px 8px;vertical-align:top;text-transform:capitalize">${o.status}</td>
        </tr>`;
    })
    .join("");

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#1c3850;max-width:760px">
    <h2 style="margin:0 0 4px">Online orders — ${range}</h2>
    <p style="margin:0 0 18px;color:#667">
      ${orders.length} total ·
      ${counts.collected ?? 0} collected ·
      ${counts.accepted ?? 0} accepted ·
      ${counts.rejected ?? 0} rejected ·
      ${counts.new ?? 0} never actioned
    </p>
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      <thead>
        <tr style="background:#eef3f5;text-align:left">
          <th style="padding:8px">Time</th>
          <th style="padding:8px">Customer</th>
          <th style="padding:8px">Order</th>
          <th style="padding:8px">Pickup</th>
          <th style="padding:8px">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:22px;color:#889;font-size:12px">
      These orders stay in the system as your sales record — this email is a
      summary, not the only copy.
    </p>
  </div>`;
}

export async function GET(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }
  if (!isConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.DIGEST_EMAIL_TO;
  const from = process.env.DIGEST_EMAIL_FROM;
  if (!apiKey || !to || !from) {
    return NextResponse.json(
      { error: "Email not configured — set RESEND_API_KEY, DIGEST_EMAIL_TO, DIGEST_EMAIL_FROM." },
      { status: 503 }
    );
  }

  let orders: Order[];
  try {
    // Everything not yet reported. If a week is missed, the next run
    // picks up both weeks rather than losing any.
    orders = await select<Order>(
      "orders",
      "archived_at=is.null&order=created_at.asc"
    );
  } catch (err) {
    console.error("[digest] load failed:", err);
    return NextResponse.json({ error: "Could not load orders." }, { status: 502 });
  }

  if (orders.length === 0) {
    return NextResponse.json({ ok: true, sent: false, reason: "No new orders." });
  }

  // Send BEFORE deleting. If the email fails the orders stay put and the
  // next run picks them up — losing a day's records to a transient email
  // error would be unrecoverable.
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: to.split(",").map((a) => a.trim()),
      subject: `${business.shortName} — ${orders.length} online order${orders.length === 1 ? "" : "s"} this week`,
      html: buildHtml(orders),
    }),
  });

  if (!res.ok) {
    console.error("[digest] email failed:", await res.text());
    return NextResponse.json(
      { error: "Email failed — orders left un-archived for the next run." },
      { status: 502 }
    );
  }

  // Mark as reported only after the email is away. If this fails, next
  // week's digest repeats them — harmless, since nothing is destroyed.
  try {
    const ids = orders.map((o) => o.id).join(",");
    await update("orders", `id=in.(${ids})`, {
      archived_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[digest] archive failed (email was sent):", err);
  }

  return NextResponse.json({ ok: true, sent: true, count: orders.length });
}
