// lib/social/library.ts
//
// The photo library the planner (and the owner) choose from:
//   upload     — photos uploaded in /admin/social, plus the Parea wall
//   site       — the photos already on the website
//   facebook   — recent photos on the Facebook Page
//   instagram  — recent Instagram posts
//
// Facebook/Instagram image URLs are signed and expire, so before one is
// attached to a post it is copied into our own storage (`importImage`).

import { isConfigured, listStorage, uploadToStorage } from "@/lib/supabase";
import { facebookPhotos, instagramPhotos } from "@/lib/social/meta";
import type { MediaItem, MediaSource } from "@/lib/social/types";

/** The public site address, for turning "/images/x.jpg" into a full URL. */
export function siteUrl(): string | null {
  const raw =
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null);
  return raw ? raw.replace(/\/+$/, "") : null;
}

export function absoluteUrl(url: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  const base = siteUrl();
  return base ? `${base}${url.startsWith("/") ? "" : "/"}${url}` : null;
}

// Photos shipped with the site (public/images). Decorative files — logo,
// columns, textures — are left out on purpose.
const SITE_PHOTOS: { file: string; label: string }[] = [
  { file: "food-yiros.jpg", label: "Yiros" },
  { file: "food-platters.jpg", label: "Platters" },
  { file: "food-chips.jpg", label: "Chips" },
  { file: "food-drinks.jpg", label: "Drinks" },
  { file: "interior-wide.jpg", label: "Yiros at the counter (wide)" },
  { file: "storefront-wide.jpg", label: "The shopfront on Hindley Street" },
  { file: "coal-bed.jpg", label: "The charcoal" },
];

export function sitePhotos(): MediaItem[] {
  return SITE_PHOTOS.map((p) => ({
    id: p.file,
    source: "site" as const,
    url: `/images/${p.file}`,
    thumb: `/images/${p.file}`,
    label: p.label,
  }));
}

export async function uploadedPhotos(): Promise<MediaItem[]> {
  if (!isConfigured()) return [];
  const folders = ["social/uploads", "social/imported", "parea/wall"];
  const lists = await Promise.all(
    folders.map((f) => listStorage("media", f).catch(() => []))
  );
  return lists
    .flat()
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f.name))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .map((f) => ({
      id: f.url,
      source: "upload" as const,
      url: f.url,
      thumb: f.url,
      label: f.name.replace(/^\d+-[a-z0-9]+-?/, "").replace(/\.[a-z]+$/i, "") || "Uploaded photo",
      createdAt: f.createdAt,
    }));
}

export async function libraryFor(source: MediaSource): Promise<MediaItem[]> {
  switch (source) {
    case "site":
      return sitePhotos();
    case "upload":
      return uploadedPhotos();
    case "facebook":
      return (await facebookPhotos()).map((p) => ({ ...p, source: "facebook" as const }));
    case "instagram":
      return (await instagramPhotos()).map((p) => ({ ...p, source: "instagram" as const }));
  }
}

/** Everything, for the weekly planner. Platform errors are swallowed. */
export async function fullLibrary(): Promise<MediaItem[]> {
  const sources: MediaSource[] = ["upload", "facebook", "instagram", "site"];
  const lists = await Promise.all(sources.map((s) => libraryFor(s).catch(() => [])));
  return lists.flat();
}

const ALLOWED_HOSTS = /(^|\.)(fbcdn\.net|cdninstagram\.com|facebook\.com|instagram\.com)$/;

/**
 * Copy a Facebook/Instagram image into our storage so the URL stays valid
 * until the post goes out. Returns the new public URL.
 */
export async function importImage(url: string): Promise<string> {
  const host = new URL(url).hostname;
  if (!ALLOWED_HOSTS.test(host)) throw new Error("Only Facebook or Instagram images can be imported.");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not download the photo (${res.status}).`);
  const type = res.headers.get("content-type") ?? "image/jpeg";
  if (!type.startsWith("image/")) throw new Error("That link isn't an image.");
  const bytes = await res.arrayBuffer();
  if (bytes.byteLength > 8 * 1024 * 1024) throw new Error("That photo is over 8MB.");
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const stored = await uploadToStorage("media", `social/imported/${id}.${ext}`, bytes, type);
  return stored.replace(/\?v=\d+$/, "");
}

/** Make any chosen library item safe to store on a post. */
export async function resolveForPost(item: Pick<MediaItem, "source" | "url">): Promise<string> {
  if (item.source === "facebook" || item.source === "instagram") return importImage(item.url);
  return item.url;
}
