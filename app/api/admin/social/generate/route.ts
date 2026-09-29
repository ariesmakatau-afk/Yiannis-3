import { NextResponse, type NextRequest } from "next/server";
import { isStaff } from "@/lib/requireStaff";
import { isConfigured } from "@/lib/supabase";
import { draftWeek, redraftPost } from "@/lib/social/generate";
import { createPost, deleteDrafts, getPost, listWeekPosts, updatePost } from "@/lib/social/store";
import { addDays, isDateString, mondayOf, shopDateTime } from "@/lib/social/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Two jobs:
//   { week, note?, replace? } — draft the week's empty days
//                               (replace: throw away the current drafts first)
//   { id, instruction?, keepPhoto? } — rewrite one post

export async function POST(request: NextRequest) {
  if (!isStaff()) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!isConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    if (typeof body.id === "string") {
      const post = await getPost(body.id);
      if (!post) return NextResponse.json({ error: "That post is gone." }, { status: 404 });
      if (post.status !== "draft" && post.status !== "approved" && post.status !== "failed") {
        return NextResponse.json({ error: "This post has already gone out." }, { status: 409 });
      }
      const instruction = typeof body.instruction === "string" ? body.instruction.trim().slice(0, 500) : "";
      const next = await redraftPost(post, instruction, body.keepPhoto === true);
      const saved = await updatePost(post.id, {
        title: next.title,
        caption: next.caption,
        image_url: next.image_url,
        scheduled_for: shopDateTime(post.post_date, next.time).toISOString(),
        // A rewrite needs a fresh look before it goes out.
        status: "draft",
      });
      return NextResponse.json({ post: saved });
    }

    if (!isDateString(body.week)) return NextResponse.json({ error: "Which week?" }, { status: 400 });
    const weekStart = mondayOf(body.week);
    if (body.replace === true) await deleteDrafts(weekStart);

    const existing = await listWeekPosts(weekStart);
    const taken = new Set(existing.filter((p) => p.status !== "skipped").map((p) => p.post_date));
    const empty = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter((d) => !taken.has(d));
    if (empty.length === 0) {
      return NextResponse.json({ posts: existing, writer: null, message: "Every day already has a post." });
    }

    const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : undefined;
    const drafted = await draftWeek(weekStart, { onlyDays: empty, note });
    for (const p of drafted.posts) await createPost(p);
    return NextResponse.json({
      posts: await listWeekPosts(weekStart),
      writer: drafted.writer,
      warning: drafted.warning,
    });
  } catch (err) {
    console.error("[social/generate] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Drafting failed." },
      { status: 502 }
    );
  }
}
