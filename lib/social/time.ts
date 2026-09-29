// lib/social/time.ts
//
// Dates for the social planner, always in the shop's own time zone.
//
// The server runs in UTC (Vercel) but "Monday's post" means Monday in
// Adelaide, daylight saving included. Dates are passed around as plain
// "YYYY-MM-DD" strings so nothing is silently shifted by a time zone.

export const SHOP_TZ = "Australia/Adelaide";

/** Default time of day a post goes out, in shop time. */
export const DEFAULT_POST_TIME = "11:00";

function parts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: SHOP_TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const out: Record<string, number> = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return out;
}

/** Minutes the shop's clock is ahead of UTC at a given instant. */
function offsetMinutes(date: Date): number {
  const p = parts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

/** Today's date in the shop, as "YYYY-MM-DD". */
export function shopDate(at: Date = new Date()): string {
  const p = parts(at);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** "HH:MM" in shop time for an instant. */
export function shopTime(at: Date): string {
  const p = parts(at);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** A shop-local date + time, as a real instant. */
export function shopDateTime(date: string, time: string = DEFAULT_POST_TIME): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const first = offsetMinutes(new Date(guess));
  let instant = guess - first * 60000;
  // Re-check across a daylight-saving boundary.
  const second = offsetMinutes(new Date(instant));
  if (second !== first) instant = guess - second * 60000;
  return new Date(instant);
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday, for a "YYYY-MM-DD" date. */
export function weekday(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** The Monday of the week containing `date`. */
export function mondayOf(date: string): string {
  return addDays(date, -((weekday(date) + 6) % 7));
}

/**
 * The week the owner is most likely planning: from Saturday onwards that is
 * next week, otherwise the current one.
 */
export function planningWeek(at: Date = new Date()): string {
  const today = shopDate(at);
  const day = weekday(today);
  return day === 0 || day === 6 ? mondayOf(addDays(today, 2)) : mondayOf(today);
}

export function isDateString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isTimeString(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** "Mon 6 Oct" */
export function labelDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
