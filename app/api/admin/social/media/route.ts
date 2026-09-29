import { NextResponse, type NextRequest } from "next/server";
import { isStaff } from "@/lib/requireStaff";
import { isConfigured, uploadToStorage } from "@/lib/supabase";
import { libraryFor } from "@/lib/social/library";
import type { MediaItem, MediaSource } from "@/lib/social/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const SOURCES = new Set<MediaSource>(["upload", "site", "facebook", "instagram"]);

/** The photo library, one source at a time. */
export async function GET(request: NextRequest) {
  if (!isStaff()) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const source = new URL(request.url).searchParams.get("source") as MediaSource | null;
  if (!source || !SOURCES.has(source)) {
    return NextResponse.json({ error: "Which library?" }, { status: 400 });
  }
  try {
    return NextResponse.json({ items: await libraryFor(source) });
  } catch (err) {
    console.error(`[social/media] ${source} failed:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load photos." },
      { status: 502 }
    );
  }
}

/** Upload a new photo into the library. */
export async function POST(request: NextRequest) {
  if (!isStaff()) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!isConfigured()) return NextResponse.json({ error: "Storage isn't configured." }, { status: 503 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  const file = form.get("photo");
  if (!(file instanceof File)) return NextResponse.json({ error: "No photo was attached." }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Use a JPG, PNG or WEBP image." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "That image is over 8MB." }, { status: 400 });

  try {
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    // Keep a readable bit of the original name so the library (and the AI
    // writer, which sees the label) knows roughly what it is.
    const slug = file.name
      .replace(/\.[a-z0-9]+$/i, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const url = (
      await uploadToStorage("media", `social/uploads/${id}${slug ? `-${slug}` : ""}.${ext}`, await file.arrayBuffer(), file.type)
    ).replace(/\?v=\d+$/, "");
    const item: MediaItem = { id: url, source: "upload", url, thumb: url, label: slug || "Uploaded photo" };
    return NextResponse.json({ item });
  } catch (err) {
    console.error("[social/media] upload failed:", err);
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 502 });
  }
}
