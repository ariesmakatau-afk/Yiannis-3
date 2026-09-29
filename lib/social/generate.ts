// lib/social/generate.ts
//
// Writes the week's posts.
//
// With ANTHROPIC_API_KEY set, Claude drafts one post per day from what is
// actually happening that week (events, the current offer, opening hours,
// the menu), looks at the photo library and picks a photo for each. Without
// a key — or if the call fails — simple built-in templates fill the week
// instead, so the planner never comes back empty.
//
// Nothing here publishes anything. Every post lands as a draft for the
// owner to approve.

import Anthropic from "@anthropic-ai/sdk";
import { aboutCopy, business, openingHours, shopStats } from "@/lib/content";
import { menuGroups } from "@/lib/menu";
import { promo } from "@/lib/parea";
import { absoluteUrl, fullLibrary, resolveForPost } from "@/lib/social/library";
import { listEvents, recentCaptions, type NewPost } from "@/lib/social/store";
import { addDays, DEFAULT_POST_TIME, labelDate, shopDateTime, shopTime, weekday } from "@/lib/social/time";
import type { Channel, MediaItem, ShopEvent, SocialPost } from "@/lib/social/types";

const MODEL = "claude-opus-5-5";
const MAX_PHOTOS_SHOWN = 16;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type WeekContext = {
  weekStart: string;
  days: string[];
  events: ShopEvent[];
  photos: MediaItem[];
  recent: { post_date: string; caption: string }[];
};

async function loadContext(weekStart: string): Promise<WeekContext> {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  // This week plus the next, so upcoming events can be teased early.
  const [events, library, recent] = await Promise.all([
    listEvents({
      fromIso: shopDateTime(weekStart, "00:00").toISOString(),
      toIso: shopDateTime(addDays(weekStart, 14), "00:00").toISOString(),
    }).catch(() => []),
    fullLibrary(),
    recentCaptions(weekStart).catch(() => []),
  ]);
  // Claude can only look at photos it can reach over https.
  const photos = library
    .map((p) => ({ ...p, url: absoluteUrl(p.url) ?? "" }))
    .filter((p) => p.url.startsWith("https://"))
    .slice(0, MAX_PHOTOS_SHOWN);
  return { weekStart, days, events, photos, recent };
}

function describeEvent(e: ShopEvent): string {
  const start = new Date(e.starts_at);
  const when = `${start.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Australia/Adelaide",
  })} at ${shopTime(start)}`;
  return [
    `- id ${e.id}: "${e.title}" — ${when}${e.ends_at ? ` until ${shopTime(new Date(e.ends_at))}` : ""}`,
    e.location ? `  Where: ${e.location}` : "",
    e.description ? `  Details: ${e.description}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function briefing(ctx: WeekContext, note?: string): string {
  const hours = openingHours.map((h) => `${h.day}: ${h.hours}`).join("\n");
  const menu = menuGroups
    .map((g) => `${g.title}: ${g.products.map((p) => p.name).join(", ")}`)
    .join("\n");
  const events = ctx.events.length ? ctx.events.map(describeEvent).join("\n") : "None this fortnight.";
  const recent = ctx.recent.length
    ? ctx.recent.map((r) => `- ${r.post_date}: ${r.caption.replace(/\s+/g, " ").slice(0, 200)}`).join("\n")
    : "None yet.";
  const days = ctx.days.map((d) => `${d} (${DAY_NAMES[weekday(d)]})`).join(", ");

  return `Plan the posts for the week of ${labelDate(ctx.weekStart)}: ${days}.

## Events coming up
${events}

## The current offer
${promo.active ? `${promo.title} — ${promo.body} (${promo.finePrint})` : "No offer running."}

## Opening hours
${hours}

## Menu
${menu}

## Address and links
${business.address.street}, ${business.address.suburb}. Order ahead for pickup on the website, or through Uber Eats.

## Posts from the last few weeks (don't repeat these)
${recent}
${note ? `\n## Note from the owner for this week\n${note}\n` : ""}`;
}

const SYSTEM = `You write the social media for ${business.shortName}, a charcoal yiros shop in Adelaide's CBD that has been on the same corner for about forty years.

Voice: warm, confident, dry and a little deadpan — never shouty, no marketing clichés, no "foodies", at most one or two emoji per post. Examples of the house voice:
"${aboutCopy.eyebrow}"
${shopStats.map((s) => `"${s.figure} ${s.label}. ${s.aside}"`).join("\n")}

Each post goes to the Facebook Page, Instagram and the "What's on" page of the website, so the same caption must read well in all three. Captions are 40–120 words, end with 3–6 relevant hashtags on their own line (always including #Adelaide), and never invent prices, dates, deals or events that aren't in the briefing. Only mention the current offer on the days it applies. Don't promise evening trade on days the shop closes early.

Events take priority: post about an event on its day, and tease big ones a day or two before. Fill the other days with a varied mix — a menu item, the charcoal and the craft, the regulars (parea), opening hours or ordering ahead — so no two posts in a row feel the same.

For each post pick the best-fitting photo from the numbered photos you are shown (look at them — choose what actually matches the post), or -1 if none suits. Try not to use the same photo twice in a week.`;

// ---------------------------------------------------------------------------
// Claude
// ---------------------------------------------------------------------------

const POST_SCHEMA = {
  type: "object",
  properties: {
    date: { type: "string", description: "YYYY-MM-DD" },
    time: { type: "string", description: "HH:MM, 24h, shop time. Usually 11:00; earlier or later only for a reason (e.g. an evening event)." },
    title: { type: "string", description: "A short headline, used on the website. Under 60 characters." },
    caption: { type: "string" },
    photo: { type: "integer", description: "Photo number from the list, or -1 for none." },
    event_id: { type: "string", description: "The id of the event this post is about, or an empty string." },
  },
  required: ["date", "time", "title", "caption", "photo", "event_id"],
  additionalProperties: false,
} as const;

type DraftShape = {
  date: string;
  time: string;
  title: string;
  caption: string;
  photo: number;
  event_id: string;
};

function photoBlocks(photos: MediaItem[]): Anthropic.Beta.BetaContentBlockParam[] {
  const blocks: Anthropic.Beta.BetaContentBlockParam[] = [];
  photos.forEach((p, i) => {
    blocks.push({ type: "text", text: `Photo ${i}: ${p.label} (${p.source})` });
    blocks.push({ type: "image", source: { type: "url", url: p.url } });
  });
  return blocks;
}

async function askClaude<T>(
  text: string,
  photos: MediaItem[],
  schema: Record<string, unknown>
): Promise<T> {
  const client = new Anthropic();
  const run = async (withImages: boolean) => {
    const listOnly = photos.map((p, i) => `Photo ${i}: ${p.label} (${p.source})`).join("\n");
    const content: Anthropic.Beta.BetaContentBlockParam[] = withImages
      ? [...photoBlocks(photos), { type: "text", text }]
      : [{ type: "text", text: `${text}\n\n## Photos (descriptions only)\n${listOnly || "None."}` }];
    return client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema } },
      system: SYSTEM,
      messages: [{ role: "user", content }],
    });
  };

  let response;
  try {
    response = await run(photos.length > 0);
  } catch (err) {
    // A photo Claude can't fetch (too big, gone private) fails the whole
    // request — retry once choosing from the descriptions alone.
    if (err instanceof Anthropic.BadRequestError && photos.length > 0) {
      console.warn("[social/generate] retrying without images:", err.message);
      response = await run(false);
    } else {
      throw err;
    }
  }

  if (response.stop_reason === "refusal") {
    throw new Error("The writer declined this request.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("The draft was cut off before it finished.");
  }
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No draft came back.");
  return JSON.parse(textBlock.text) as T;
}

// ---------------------------------------------------------------------------
// Templates — used when there's no API key or the call fails
// ---------------------------------------------------------------------------

const EVERGREEN: { title: string; caption: string; photo: string }[] = [
  {
    title: "Real charcoal, every day",
    caption:
      "Gas is quicker. Charcoal is better. The spit has been turning over real coals on this corner for about forty years, and it's lit again today.\n\nCome and see what the fuss is about.\n\n#Adelaide #HindleyStreet #Yiros #Charcoal",
    photo: "coal-bed.jpg",
  },
  {
    title: "Lamb, chicken or pork?",
    caption:
      "Three meats. There is no fourth. People ask.\n\nLamb, chicken or pork — or mix them — carved off the spit and straight into warm pita.\n\n#Adelaide #Yiros #AdelaideEats #HindleyStreet",
    photo: "food-yiros.jpg",
  },
  {
    title: "Order ahead, skip the wait",
    caption:
      "In a hurry? Order ahead on our website, pay when you pick up, and walk straight past the queue. Or get it delivered through Uber Eats.\n\n#Adelaide #AdelaideCBD #Yiros #Takeaway",
    photo: "storefront-wide.jpg",
  },
  {
    title: "Feeding a crowd?",
    caption:
      "Platters and packs, built for sharing — or for not sharing, we don't judge. Lamb, chicken and pork off the charcoal, with all the trimmings.\n\n#Adelaide #Yiros #AdelaideEats #Parea",
    photo: "food-platters.jpg",
  },
  {
    title: "Same corner, same fire",
    caption:
      "Hindley Street has reinvented itself a dozen times around us. We've moved the furniture twice. The recipe hasn't changed once — it was right the first time.\n\n#Adelaide #HindleyStreet #Yiros #AdelaideCBD",
    photo: "interior-wide.jpg",
  },
  {
    title: "Don't forget the chips",
    caption:
      "A yiros without chips is a perfectly good yiros. A yiros with chips is a better one. Add them in or grab a box on the side.\n\n#Adelaide #Yiros #Chips #AdelaideEats",
    photo: "food-chips.jpg",
  },
];

function templateWeek(ctx: WeekContext): NewPost[] {
  let evergreen = 0;
  return ctx.days.map((date) => {
    const dow = weekday(date);
    const event = ctx.events.find((e) => e.starts_at && dateOf(e.starts_at) === date);
    const base = { week_start: ctx.weekStart, post_date: date, time: DEFAULT_POST_TIME };
    const channels: Channel[] = ["facebook", "instagram", "website"];
    if (event) {
      const time = shopTime(new Date(event.starts_at));
      return {
        ...base,
        title: event.title,
        caption: `${event.title} — today from ${time}${event.location ? ` at ${event.location}` : ""}.\n\n${event.description}\n\n#Adelaide #HindleyStreet #Yiros`,
        image_url: event.image_url,
        channels,
        event_id: event.id,
      };
    }
    if (promo.active && (dow === 2 || dow === 3)) {
      return {
        ...base,
        title: promo.title,
        caption: `${promo.body}\n\n${promo.finePrint}\n\n#Adelaide #Yiros #HindleyStreet #AdelaideEats`,
        image_url: "/images/food-chips.jpg",
        channels,
        event_id: null,
      };
    }
    const pick = EVERGREEN[evergreen++ % EVERGREEN.length];
    return {
      ...base,
      title: pick.title,
      caption: pick.caption,
      image_url: `/images/${pick.photo}`,
      channels,
      event_id: null,
    };
  });
}

function dateOf(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Australia/Adelaide" });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

async function photoUrl(photos: MediaItem[], index: number): Promise<string | null> {
  const p = photos[index];
  if (!p) return null;
  try {
    return await resolveForPost(p);
  } catch (err) {
    console.warn("[social/generate] could not import photo:", err);
    return null;
  }
}

function cleanTime(t: string): string {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t) ? t : DEFAULT_POST_TIME;
}

/**
 * Draft posts for the given days of a week (default: all seven).
 * Returns the drafts plus which writer produced them.
 */
export async function draftWeek(
  weekStart: string,
  opts: { onlyDays?: string[]; note?: string } = {}
): Promise<{ posts: NewPost[]; writer: "ai" | "template"; warning?: string }> {
  const ctx = await loadContext(weekStart);
  const wanted = new Set(opts.onlyDays ?? ctx.days);
  const eventIds = new Set(ctx.events.map((e) => e.id));

  if (aiConfigured()) {
    try {
      const skip = ctx.days.filter((d) => !wanted.has(d));
      const text =
        briefing(ctx, opts.note) +
        (skip.length ? `\nThese days are already planned — write posts only for the others: ${skip.join(", ")}.\n` : "") +
        `\nWrite exactly one post for each of: ${[...wanted].join(", ")}.`;
      const out = await askClaude<{ posts: DraftShape[] }>(text, ctx.photos, {
        type: "object",
        properties: { posts: { type: "array", items: POST_SCHEMA } },
        required: ["posts"],
        additionalProperties: false,
      });
      const byDate = new Map<string, DraftShape>();
      for (const p of out.posts) if (wanted.has(p.date) && !byDate.has(p.date)) byDate.set(p.date, p);
      const posts: NewPost[] = [];
      for (const date of ctx.days) {
        const p = byDate.get(date);
        if (!p) continue;
        posts.push({
          week_start: weekStart,
          post_date: date,
          time: cleanTime(p.time),
          title: p.title.slice(0, 120),
          caption: p.caption,
          image_url: await photoUrl(ctx.photos, p.photo),
          channels: ["facebook", "instagram", "website"],
          event_id: eventIds.has(p.event_id) ? p.event_id : null,
        });
      }
      if (posts.length > 0) return { posts, writer: "ai" };
      throw new Error("No usable drafts came back.");
    } catch (err) {
      console.error("[social/generate] AI drafting failed, using templates:", err);
      const posts = templateWeek(ctx).filter((p) => wanted.has(p.post_date));
      return {
        posts,
        writer: "template",
        warning: `The AI writer failed (${err instanceof Error ? err.message : "unknown error"}), so simple templates were used.`,
      };
    }
  }
  return { posts: templateWeek(ctx).filter((p) => wanted.has(p.post_date)), writer: "template" };
}

/** Rewrite one post, following the owner's instruction. */
export async function redraftPost(
  post: SocialPost,
  instruction: string,
  keepPhoto: boolean
): Promise<{ title: string; caption: string; image_url: string | null; time: string }> {
  if (!aiConfigured()) {
    throw new Error("Rewrites need the AI writer — set ANTHROPIC_API_KEY.");
  }
  const ctx = await loadContext(post.week_start);
  const text =
    briefing(ctx) +
    `\n## The post to rewrite — ${post.post_date} (${DAY_NAMES[weekday(post.post_date)]})\n` +
    `Title: ${post.title}\nCaption:\n${post.caption}\n\n` +
    `Rewrite it${instruction ? ` following this instruction from the owner: "${instruction}"` : " with a fresh angle"}.` +
    (keepPhoto ? " Keep the current photo: set photo to -1." : " Pick the best photo for the new version.");
  const p = await askClaude<DraftShape>(text, keepPhoto ? [] : ctx.photos, POST_SCHEMA);
  return {
    title: p.title.slice(0, 120),
    caption: p.caption,
    image_url: keepPhoto ? post.image_url : (await photoUrl(ctx.photos, p.photo)) ?? post.image_url,
    time: cleanTime(p.time),
  };
}
