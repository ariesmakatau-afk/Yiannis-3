// lib/social/store.ts
//
// Database access for events and planned posts. Server-side only (uses
// lib/supabase.ts, which holds the service_role key).

import { insert, remove, select, update } from "@/lib/supabase";
import type { Channel, ShopEvent, SocialPost } from "@/lib/social/types";
import { CHANNELS } from "@/lib/social/types";
import { addDays, shopDateTime } from "@/lib/social/time";

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function listEvents(opts: { fromIso?: string; toIso?: string; publicOnly?: boolean } = {}) {
  const filters = ["order=starts_at.asc"];
  // An event counts as "upcoming" until it ends, not until it starts.
  if (opts.fromIso) {
    const from = `"${opts.fromIso}"`; // quoted: ISO timestamps contain reserved characters
    filters.push(`or=(ends_at.gte.${from},and(ends_at.is.null,starts_at.gte.${from}))`);
  }
  if (opts.toIso) filters.push(`starts_at=lt.${opts.toIso}`);
  if (opts.publicOnly) filters.push("is_public=is.true");
  return select<ShopEvent>("events", filters.join("&"));
}

export async function createEvent(row: Omit<ShopEvent, "id" | "created_at">) {
  return insert<ShopEvent>("events", row);
}

export async function updateEvent(id: string, patch: Partial<ShopEvent>) {
  const rows = await update<ShopEvent>("events", `id=eq.${encodeURIComponent(id)}`, patch);
  return rows[0] ?? null;
}

export async function deleteEvent(id: string) {
  await remove("events", `id=eq.${encodeURIComponent(id)}`);
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export async function listWeekPosts(weekStart: string) {
  return select<SocialPost>(
    "social_posts",
    `week_start=eq.${weekStart}&order=post_date.asc,scheduled_for.asc`
  );
}

export async function getPost(id: string) {
  const rows = await select<SocialPost>("social_posts", `id=eq.${encodeURIComponent(id)}&limit=1`);
  return rows[0] ?? null;
}

/** Captions from recent weeks, so new drafts don't repeat them. */
export async function recentCaptions(beforeDate: string, days = 21) {
  const rows = await select<Pick<SocialPost, "post_date" | "caption">>(
    "social_posts",
    `post_date=gte.${addDays(beforeDate, -days)}&post_date=lt.${beforeDate}` +
      `&status=in.(approved,published,partial)&select=post_date,caption&order=post_date.desc&limit=21`
  );
  return rows;
}

export type NewPost = {
  week_start: string;
  post_date: string;
  time: string;
  title: string;
  caption: string;
  image_url: string | null;
  channels: Channel[];
  event_id: string | null;
};

export async function createPost(p: NewPost) {
  return insert<SocialPost>("social_posts", {
    week_start: p.week_start,
    post_date: p.post_date,
    scheduled_for: shopDateTime(p.post_date, p.time).toISOString(),
    title: p.title,
    caption: p.caption,
    image_url: p.image_url,
    channels: p.channels,
    event_id: p.event_id,
    status: "draft",
  });
}

export async function updatePost(id: string, patch: Record<string, unknown>) {
  const rows = await update<SocialPost>("social_posts", `id=eq.${encodeURIComponent(id)}`, {
    ...patch,
    updated_at: new Date().toISOString(),
  });
  return rows[0] ?? null;
}

export async function deleteDrafts(weekStart: string) {
  await remove("social_posts", `week_start=eq.${weekStart}&status=eq.draft`);
}

/** Approved posts whose time has come. */
export async function duePosts(untilIso: string) {
  return select<SocialPost>(
    "social_posts",
    `status=eq.approved&scheduled_for=lte.${untilIso}&order=scheduled_for.asc&limit=20`
  );
}

/** Posts that went out on the website, newest first, for /whats-on. */
export async function websitePosts(limit = 12) {
  return select<SocialPost>(
    "social_posts",
    `status=in.(published,partial)&channels=cs.{website}&results->website->>ok=eq.true` +
      `&order=scheduled_for.desc&limit=${limit}`
  );
}

export function cleanChannels(value: unknown): Channel[] | null {
  if (!Array.isArray(value)) return null;
  const set = new Set(value.filter((c): c is Channel => CHANNELS.includes(c as Channel)));
  return CHANNELS.filter((c) => set.has(c));
}
