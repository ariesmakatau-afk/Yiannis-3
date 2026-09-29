import { NextResponse, type NextRequest } from "next/server";
import { isConfigured, select } from "@/lib/supabase";
import { cronAuthorised } from "@/lib/social/cron";
import { notifyFailures, notifyNeedsApproval } from "@/lib/social/notify";
import { publishPost } from "@/lib/social/publish";
import { duePosts } from "@/lib/social/store";
import { shopDate, shopDateTime, shopTime } from "@/lib/social/time";
import type { SocialPost } from "@/lib/social/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Publishing job (see vercel.json).
//
// SOCIAL_PUBLISH_WINDOW decides what counts as "due":
//   "day"   (default) — everything approved for today goes out on this run.
//            Right for a once-a-day cron, which is all Vercel's free plan allows.
//   "exact" — only posts whose time has passed. Use with an hourly cron
//            (Vercel Pro) so each post goes out at its own time.
//
// Drafts are never published — they're the owner's "not yet". If today's
// post is still a draft, the owner gets a nudge instead.

export async function GET(request: NextRequest) {
  if (!cronAuthorised(request)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }
  if (!isConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const today = shopDate();
  const exact = process.env.SOCIAL_PUBLISH_WINDOW === "exact";
  const until = exact ? new Date() : shopDateTime(today, "23:59");

  try {
    const due = await duePosts(until.toISOString());
    const done: SocialPost[] = [];
    for (const post of due) {
      try {
        done.push(await publishPost(post));
      } catch (err) {
        console.error(`[social/publish-due] post ${post.id} failed:`, err);
      }
    }
    await notifyFailures(done.filter((p) => p.status !== "published"));

    // Nudge about today's unapproved drafts — every run in "day" mode (one
    // run a day), only the 10 o'clock run in "exact" mode.
    let nudged = false;
    if (!exact || shopTime(new Date()).startsWith("10:")) {
      const waiting = await select<SocialPost>(
        "social_posts",
        `status=eq.draft&post_date=eq.${today}&order=scheduled_for.asc`
      );
      nudged = (await notifyNeedsApproval(waiting)).telegram;
    }

    return NextResponse.json({
      ok: true,
      published: done.map((p) => ({ id: p.id, status: p.status })),
      nudged,
    });
  } catch (err) {
    console.error("[social/publish-due] failed:", err);
    return NextResponse.json({ error: "Publishing run failed." }, { status: 502 });
  }
}
