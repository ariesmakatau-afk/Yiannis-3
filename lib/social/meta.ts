// lib/social/meta.ts
//
// Facebook Page + Instagram (Business/Creator account linked to that Page),
// through Meta's Graph API with plain fetch.
//
// Needs three values (see HANDOFF.md → "Social media planner" for how to
// get them):
//   META_PAGE_ID            — the Facebook Page's numeric id
//   META_PAGE_ACCESS_TOKEN  — a long-lived Page access token
//   META_IG_USER_ID         — the Instagram account id linked to the Page
//
// Anything missing just switches that platform off; the rest keeps working.

const GRAPH = "https://graph.facebook.com/v23.0";

export function facebookConfigured(): boolean {
  return Boolean(process.env.META_PAGE_ID && process.env.META_PAGE_ACCESS_TOKEN);
}

export function instagramConfigured(): boolean {
  return Boolean(process.env.META_IG_USER_ID && process.env.META_PAGE_ACCESS_TOKEN);
}

function token(): string {
  const t = process.env.META_PAGE_ACCESS_TOKEN;
  if (!t) throw new Error("META_PAGE_ACCESS_TOKEN is not set.");
  return t;
}

async function graph<T>(path: string, params: Record<string, string>, method: "GET" | "POST" = "GET"): Promise<T> {
  const body = new URLSearchParams({ ...params, access_token: token() });
  const res =
    method === "GET"
      ? await fetch(`${GRAPH}/${path}?${body}`, { cache: "no-store" })
      : await fetch(`${GRAPH}/${path}`, { method: "POST", body });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `Meta API error (${res.status})`);
  }
  return json;
}

// ---------------------------------------------------------------------------
// Publishing
// ---------------------------------------------------------------------------

export async function publishToFacebook(caption: string, imageUrl: string | null) {
  const page = process.env.META_PAGE_ID;
  if (!page || !facebookConfigured()) throw new Error("Facebook isn't connected.");
  if (imageUrl) {
    const r = await graph<{ id: string; post_id?: string }>(
      `${page}/photos`,
      { url: imageUrl, caption },
      "POST"
    );
    const id = r.post_id ?? r.id;
    return { id, link: `https://www.facebook.com/${id}` };
  }
  const r = await graph<{ id: string }>(`${page}/feed`, { message: caption }, "POST");
  return { id: r.id, link: `https://www.facebook.com/${r.id}` };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function publishToInstagram(caption: string, imageUrl: string | null) {
  const ig = process.env.META_IG_USER_ID;
  if (!ig || !instagramConfigured()) throw new Error("Instagram isn't connected.");
  if (!imageUrl) throw new Error("Instagram posts need a photo.");
  if (!/\.jpe?g$/i.test(new URL(imageUrl).pathname) && !/fbcdn|cdninstagram/.test(imageUrl)) {
    throw new Error("Instagram only accepts JPG photos — pick or upload a JPG.");
  }

  // Two steps: create a media container, wait for Instagram to fetch the
  // image, then publish it.
  const container = await graph<{ id: string }>(
    `${ig}/media`,
    { image_url: imageUrl, caption },
    "POST"
  );
  for (let i = 0; i < 10; i++) {
    const s = await graph<{ status_code?: string }>(container.id, { fields: "status_code" });
    if (s.status_code === "FINISHED") break;
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED") {
      throw new Error("Instagram couldn't process the photo.");
    }
    await sleep(2000);
  }
  const published = await graph<{ id: string }>(
    `${ig}/media_publish`,
    { creation_id: container.id },
    "POST"
  );
  let link: string | undefined;
  try {
    const p = await graph<{ permalink?: string }>(published.id, { fields: "permalink" });
    link = p.permalink;
  } catch {
    // The post is up; a missing link isn't worth failing over.
  }
  return { id: published.id, link };
}

// ---------------------------------------------------------------------------
// Existing photos, for the media library
// ---------------------------------------------------------------------------

export async function facebookPhotos(limit = 30) {
  const page = process.env.META_PAGE_ID;
  if (!page || !facebookConfigured()) return [];
  const r = await graph<{
    data: { id: string; name?: string; created_time?: string; images?: { source: string; width: number }[] }[];
  }>(`${page}/photos`, {
    type: "uploaded",
    fields: "id,name,created_time,images",
    limit: String(limit),
  });
  return r.data
    .filter((p) => p.images && p.images.length > 0)
    .map((p) => {
      const sorted = [...p.images!].sort((a, b) => b.width - a.width);
      const thumb = sorted.find((i) => i.width <= 480) ?? sorted[sorted.length - 1];
      return {
        id: p.id,
        url: sorted[0].source,
        thumb: thumb.source,
        label: (p.name ?? "Facebook photo").slice(0, 120),
        createdAt: p.created_time ?? null,
      };
    });
}

export async function instagramPhotos(limit = 30) {
  const ig = process.env.META_IG_USER_ID;
  if (!ig || !instagramConfigured()) return [];
  const r = await graph<{
    data: {
      id: string;
      caption?: string;
      media_type: string;
      media_url?: string;
      thumbnail_url?: string;
      timestamp?: string;
    }[];
  }>(`${ig}/media`, {
    fields: "id,caption,media_type,media_url,thumbnail_url,timestamp",
    limit: String(limit),
  });
  return r.data
    .map((m) => {
      const url = m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url;
      return url
        ? {
            id: m.id,
            url,
            thumb: url,
            label: (m.caption ?? "Instagram post").slice(0, 120),
            createdAt: m.timestamp ?? null,
          }
        : null;
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);
}
