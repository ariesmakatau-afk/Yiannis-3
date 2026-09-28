// lib/notifyOrder.ts
//
// The client hasn't finalized the notification channel yet (Telegram bot vs
// SMS/phone number). This module is the single swappable seam: the /order
// flow and the API route never talk to Telegram or an SMS provider directly
// — they only call `notifyOrder(order)`. Switching channels later means
// editing this file only.
//
// In local development with no credentials set, orders are logged to the
// server console so the end-to-end flow is still testable.

export type PickupOrderItem = {
  name: string;
  quantity: number;
  notes?: string;
};

export type PickupOrder = {
  customerName: string;
  phone: string;
  pickupTime: string;
  items: PickupOrderItem[];
  orderNotes?: string;
  /** Optional — supplied only if the customer joined Parea Mas. */
  email?: string;
};

function formatOrderText(order: PickupOrder): string {
  const lines = [
    `New pickup order — Yianni's on Hindley Street`,
    `Name: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Pickup time: ${order.pickupTime}`,
    ...(order.email ? [`Email (Parea Mas): ${order.email}`] : []),
    "",
    "Items:",
    ...order.items.map(
      (item) =>
        `  • ${item.quantity}x ${item.name}${item.notes ? ` (${item.notes})` : ""}`
    ),
  ];
  if (order.orderNotes) {
    lines.push("", `Notes: ${order.orderNotes}`);
  }
  return lines.join("\n");
}

async function sendViaTelegram(order: PickupOrder): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    throw new Error("Telegram credentials missing (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID).");
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatOrderText(order),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram notify failed: ${res.status} ${body}`);
  }
}

async function sendViaSms(order: PickupOrder): Promise<void> {
  const apiKey = process.env.SMS_PROVIDER_API_KEY;
  const toNumber = process.env.NOTIFY_PHONE_NUMBER;
  if (!apiKey || !toNumber) {
    throw new Error("SMS credentials missing (SMS_PROVIDER_API_KEY / NOTIFY_PHONE_NUMBER).");
  }

  // PLACEHOLDER: exact SMS provider (e.g. Twilio) is still to be confirmed
  // by the client — wire up the real API call here once chosen. Keeping
  // this as a clearly-labelled stub rather than guessing a provider.
  throw new Error(
    "SMS notification provider not yet implemented — client has not confirmed a provider."
  );
}

function logToConsole(order: PickupOrder): void {
  // Local-dev fallback so the flow is testable end to end without
  // real credentials.
  // eslint-disable-next-line no-console
  console.log("[notifyOrder] No notification channel configured — logging order instead:\n");
  // eslint-disable-next-line no-console
  console.log(formatOrderText(order));
}

/**
 * Sends a pickup order to the shop. This is the ONLY function the rest of
 * the app should call for order notification — do not call Telegram/SMS
 * providers directly from elsewhere.
 */
export async function notifyOrder(order: PickupOrder): Promise<void> {
  const hasTelegram = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
  const hasSms = Boolean(process.env.SMS_PROVIDER_API_KEY && process.env.NOTIFY_PHONE_NUMBER);

  if (hasTelegram) {
    await sendViaTelegram(order);
    return;
  }

  if (hasSms) {
    await sendViaSms(order);
    return;
  }

  logToConsole(order);
}
