import { NextResponse, type NextRequest } from "next/server";
import { isStaff } from "@/lib/requireStaff";
import { isConfigured, remove } from "@/lib/supabase";
import { resolveForPost } from "@/lib/social/library";
import { cleanChannels, createPost, getPost, listWeekPosts, updatePost } from "@/lib/social/store";
import { DEFAULT_POST_TIME, isDateString, isTimeString, mondayOf, shopDateTime, shopTime } from "@/lib/social/time";
import type { MediaSource } from "@/lib/social/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EDITABLE = new Set(["draft", "approved", "failed", "skipped"]);
const SOURCES = new Set<MediaSource>(["upload", "site", "facebook", "instagram"]);

function guard() {
  if (!isStaff()) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!isConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  return null;
}

/** An image choice from the picker: null clears it. */
async function imageFrom(value: unknown): Promise<string | null | undefined> {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const v = value as { source?: MediaSource; url?: string };
  if (!v.url || !v.source || !SOURCES.has(v.source)) throw new Error("Pick a photo from the library.");
  return resolveForPost({ source: v.source, url: v.url });
}

export async function GET(request: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;
  const week = new URL(request.url).searchParams.get("week");
  if (!isDateString(week)) return NextResponse.json({ error: "Which week?" }, { status: 400 });
  return NextResponse.json({ posts: await listWeekPosts(mondayOf(week)) });
}

/** Add a post by hand. */
export async function POST(request: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { post_date, title, caption } = body;
  if (!isDateString(post_date)) return NextResponse.json({ error: "Pick a day." }, { status: 400 });
  if (typeof caption !== "string" || !caption.trim()) {
    return NextResponse.json({ error: "Write the caption." }, { status: 400 });
  }
  try {
    const post = await createPost({
      week_start: mondayOf(post_date),
      post_date,
      time: isTimeString(body.time) ? body.time : DEFAULT_POST_TIME,
      title: typeof title === "string" && title.trim() ? title.trim() : "Post",
      caption: caption.trim(),
      image_url: (await imageFrom(body.image)) ?? null,
      channels: cleanChannels(body.channels) ?? ["facebook", "instagram", "website"],
      event_id: null,
    });
    return NextResponse.json({ post });
  } catch (err) {
    console.error("[social/posts] create failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not add it." }, { status: 502 });
  }
}

/** Edit, approve, un-approve or skip a post — or approve a whole week. */
export async function PATCH(request: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    if (body.action === "approve_all") {
      if (!isDateString(body.week)) return NextResponse.json({ error: "Which week?" }, { status: 400 });
      const posts = await listWeekPosts(mondayOf(body.week));
      for (const p of posts) if (p.status === "draft") await updatePost(p.id, { status: "approved" });
      return NextResponse.json({ posts: await listWeekPosts(mondayOf(body.week)) });
    }

    if (typeof body.id !== "string") return NextResponse.json({ error: "Which post?" }, { status: 400 });
    const post = await getPost(body.id);
    if (!post) return NextResponse.json({ error: "That post is gone." }, { status: 404 });
    if (!EDITABLE.has(post.status)) {
      return NextResponse.json({ error: "This post has already gone out." }, { status: 409 });
    }

    const patch: Record<string, unknown> = {};
    if (typeof body.title === "string") patch.title = body.title.trim().slice(0, 120);
    if (typeof body.caption === "string") {
      if (!body.caption.trim()) return NextResponse.json({ error: "The caption is empty." }, { status: 400 });
      patch.caption = body.caption.trim();
    }
    const channels = cleanChannels(body.channels);
    if (channels) {
      if (channels.length === 0) return NextResponse.json({ error: "Pick at least one place to post." }, { status: 400 });
      patch.channels = channels;
    }
    const image = await imageFrom(body.image);
    if (image !== undefined) patch.image_url = image;

    const date = isDateString(body.post_date) ? body.post_date : post.post_date;
    const time = isTimeString(body.time) ? body.time : shopTime(new Date(post.scheduled_for));
    if (date !== post.post_date || isTimeString(body.time)) {
      patch.post_date = date;
      patch.week_start = mondayOf(date);
      patch.scheduled_for = shopDateTime(date, time).toISOString();
    }

    if (body.status === "approved" || body.status === "draft" || body.status === "skipped") {
      patch.status = body.status;
    }

    const saved = await updatePost(post.id, patch);
    return NextResponse.json({ post: saved });
  } catch (err) {
    console.error("[social/posts] update failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not save." }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Which post?" }, { status: 400 });
  const post = await getPost(id);
  if (post && !EDITABLE.has(post.status)) {
    return NextResponse.json({ error: "This post has already gone out." }, { status: 409 });
  }
  await remove("social_posts", `id=eq.${encodeURIComponent(id)}`);
  return NextResponse.json({ ok: true });
}
