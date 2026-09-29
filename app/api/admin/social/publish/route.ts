import { NextResponse, type NextRequest } from "next/server";
import { isStaff } from "@/lib/requireStaff";
import { isConfigured } from "@/lib/supabase";
import { publishPost } from "@/lib/social/publish";
import { getPost } from "@/lib/social/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** "Post now" — also retries the channels that failed last time. */
export async function POST(request: NextRequest) {
  if (!isStaff()) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!isConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "Which post?" }, { status: 400 });

  const post = await getPost(body.id);
  if (!post) return NextResponse.json({ error: "That post is gone." }, { status: 404 });
  if (post.status === "published") {
    return NextResponse.json({ error: "Already posted everywhere." }, { status: 409 });
  }
  if (post.status === "skipped") {
    return NextResponse.json({ error: "This post is skipped — bring it back first." }, { status: 409 });
  }
  try {
    return NextResponse.json({ post: await publishPost(post) });
  } catch (err) {
    console.error("[social/publish] failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Posting failed." }, { status: 502 });
  }
}
