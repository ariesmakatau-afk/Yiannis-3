import { NextResponse, type NextRequest } from "next/server";
import { isConfigured } from "@/lib/supabase";
import { cronAuthorised } from "@/lib/social/cron";
import { draftWeek } from "@/lib/social/generate";
import { notifyWeekReady } from "@/lib/social/notify";
import { createPost, listWeekPosts } from "@/lib/social/store";
import { addDays, mondayOf, shopDate } from "@/lib/social/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Drafting a week with photos can take a minute or two.
export const maxDuration = 300;

// Sunday job (see vercel.json): draft next week's posts, then message the
// owner to review them. Nothing is published here — drafts wait for approval.
//
// Days that already have a post (say the owner planned Friday by hand) are
// left alone; only the empty days are filled.

export async function GET(request: NextRequest) {
  if (!cronAuthorised(request)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }
  if (!isConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const weekStart = mondayOf(addDays(shopDate(), 1));
  try {
    const existing = await listWeekPosts(weekStart);
    const taken = new Set(existing.filter((p) => p.status !== "skipped").map((p) => p.post_date));
    const empty = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter((d) => !taken.has(d));

    let writer: string | null = null;
    let warning: string | undefined;
    if (empty.length > 0) {
      const drafted = await draftWeek(weekStart, { onlyDays: empty });
      writer = drafted.writer;
      warning = drafted.warning;
      for (const p of drafted.posts) await createPost(p);
    }

    const posts = (await listWeekPosts(weekStart)).filter((p) => p.status !== "skipped");
    const sent = await notifyWeekReady(weekStart, posts);
    return NextResponse.json({ ok: true, weekStart, created: empty.length, writer, warning, notified: sent });
  } catch (err) {
    console.error("[social/weekly] failed:", err);
    return NextResponse.json({ error: "Weekly planning failed." }, { status: 502 });
  }
}
