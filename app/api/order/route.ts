import { NextRequest, NextResponse } from "next/server";
import { notifyOrder, type PickupOrder, type PickupOrderItem } from "@/lib/notifyOrder";
import { insert, isConfigured } from "@/lib/supabase";

// PROJECT_SPEC.md §4 / TECHNICAL_REQUIREMENTS.md §2:
// This is the pay-in-store pickup path. No payment is processed here —
// this route only relays the order to the shop via notifyOrder().

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseItems(value: unknown): PickupOrderItem[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const items: PickupOrderItem[] = [];
  for (const raw of value) {
    if (
      typeof raw !== "object" ||
      raw === null ||
      !isNonEmptyString((raw as any).name) ||
      typeof (raw as any).quantity !== "number" ||
      (raw as any).quantity < 1
    ) {
      return null;
    }
    items.push({
      name: (raw as any).name,
      quantity: (raw as any).quantity,
      notes: isNonEmptyString((raw as any).notes) ? (raw as any).notes : undefined,
    });
  }
  return items;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { customerName, phone, pickupTime, items, orderNotes, email } =
    body as Record<string, unknown>;

  if (!isNonEmptyString(customerName)) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!isNonEmptyString(phone)) {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }
  if (!isNonEmptyString(pickupTime)) {
    return NextResponse.json({ error: "Pickup time is required." }, { status: 400 });
  }
  const parsedItems = parseItems(items);
  if (!parsedItems) {
    return NextResponse.json(
      { error: "Order must include at least one item." },
      { status: 400 }
    );
  }

  const order: PickupOrder = {
    customerName,
    phone,
    pickupTime,
    items: parsedItems,
    orderNotes: isNonEmptyString(orderNotes) ? orderNotes : undefined,
    // Optional: only present when the customer opted into Parea Mas.
    email: isNonEmptyString(email) && email.includes("@") ? email.trim() : undefined,
  };

  // Persist first so the kitchen screen has it even if Telegram is down.
  // A failure here is logged but not fatal — getting the order to the shop
  // matters more than recording it.
  let orderId: string | null = null;
  if (isConfigured()) {
    try {
      const saved = await insert<{ id: string }>("orders", {
        customer_name: order.customerName,
        phone: order.phone,
        pickup_time: order.pickupTime,
        email: order.email ?? null,
        order_notes: order.orderNotes ?? null,
        items: order.items,
        status: "new",
      });
      orderId = saved?.id ?? null;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[api/order] could not save order to database:", err);
    }
  }

  try {
    await notifyOrder(order);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/order] notifyOrder failed:", err);
    return NextResponse.json(
      { error: "Could not send order to the shop. Please call us instead." },
      { status: 502 }
    );
  }

  // The email address is stored with the order (for future promos) but no
  // confirmation is sent — the customer gets the status link on screen.
  return NextResponse.json({ ok: true, orderId });
}
