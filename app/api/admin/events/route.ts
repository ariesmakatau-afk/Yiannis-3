import { NextResponse, type NextRequest } from "next/server";
import { isStaff } from "@/lib/requireStaff";
import { isConfigured } from "@/lib/supabase";
import { resolveForPost } from "@/lib/social/library";
import { createEvent, deleteEvent, listEvents, updateEvent } from "@/lib/social/store";
import { isDateString, isTimeString, shopDateTime } from "@/lib/social/time";
import type { MediaSource } from "@/lib/social/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function guard() {
  if (!isStaff()) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!isConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  return null;
}

/** Turn the form's fields into a row. Returns an error string on bad input. */
async function toRow(b: Record<string, unknown>) {
  const title = typeof b.title === "string" ? b.title.trim() : "";
  if (!title) return "Give the event a name.";
  if (!isDateString(b.date) || !isTimeString(b.start)) return "Pick the day and start time.";
  if (b.end !== undefined && b.end !== "" && !isTimeString(b.end)) return "The end time doesn't look right.";

  const startsAt = shopDateTime(b.date, b.start);
  let endsAt: Date | null = isTimeString(b.end) ? shopDateTime(b.date, b.end) : null;
  // Ends after midnight → next day.
  if (endsAt && endsAt <= startsAt) endsAt = new Date(endsAt.getTime() + 24 * 60 * 60 * 1000);

  let image_url: string | null = null;
  const img = b.image as { source?: MediaSource; url?: string } | null | undefined;
  if (img?.url && img.source) image_url = await resolveForPost({ source: img.source, url: img.url });

  return {
    title: title.slice(0, 120),
    description: typeof b.description === "string" ? b.description.trim().slice(0, 2000) : "",
    starts_at: startsAt.toISOString(),
    ends_at: endsAt ? endsAt.toISOString() : null,
    location: typeof b.location === "string" && b.location.trim() ? b.location.trim().slice(0, 200) : null,
    image_url,
    is_public: b.is_public !== false,
  };
}

export async function GET() {
  const blocked = guard();
  if (blocked) return blocked;
  // Everything from a month ago onwards — recent past events stay visible
  // for reference.
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  return NextResponse.json({ events: await listEvents({ fromIso: from }) });
}

export async function POST(request: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;
  const row = await toRow((await request.json().catch(() => ({}))) as Record<string, unknown>).catch(
    (e: Error) => e.message
  );
  if (typeof row === "string") return NextResponse.json({ error: row }, { status: 400 });
  try {
    return NextResponse.json({ event: await createEvent(row) });
  } catch (err) {
    console.error("[events] create failed:", err);
    return NextResponse.json({ error: "Could not save the event." }, { status: 502 });
  }
}

export async function PATCH(request: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof body.id !== "string") return NextResponse.json({ error: "Which event?" }, { status: 400 });
  const row = await toRow(body).catch((e: Error) => e.message);
  if (typeof row === "string") return NextResponse.json({ error: row }, { status: 400 });
  // Keep the existing photo unless a new one was chosen or it was cleared.
  const patch: Record<string, unknown> = { ...row };
  if (body.image === undefined) delete patch.image_url;
  try {
    return NextResponse.json({ event: await updateEvent(body.id, patch) });
  } catch (err) {
    console.error("[events] update failed:", err);
    return NextResponse.json({ error: "Could not save the event." }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Which event?" }, { status: 400 });
  try {
    await deleteEvent(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[events] delete failed:", err);
    return NextResponse.json({ error: "Could not delete it." }, { status: 502 });
  }
}
