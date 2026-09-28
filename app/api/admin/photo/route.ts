import { NextResponse, type NextRequest } from "next/server";
import { isStaff } from "@/lib/requireStaff";
import { getContent, isConfigured, setContent, uploadToStorage } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB — phone photos land well under this
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET() {
  if (!isStaff()) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const url = await getContent("team_photo_url");
  return NextResponse.json({ url });
}

export async function POST(request: NextRequest) {
  if (!isStaff()) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Storage isn't configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No photo was attached." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Use a JPG, PNG or WEBP image." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That image is over 8MB — try a smaller one." },
      { status: 400 }
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    // Fixed path: each upload overwrites the last, so only ever one photo
    // is stored and there is nothing to clean up.
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const url = await uploadToStorage("media", `parea/team.${ext}`, bytes, file.type);
    await setContent("team_photo_url", url);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[admin/photo] upload failed:", err);
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 502 });
  }
}

export async function DELETE() {
  if (!isStaff()) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  try {
    await setContent("team_photo_url", null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/photo] clear failed:", err);
    return NextResponse.json({ error: "Could not remove the photo." }, { status: 502 });
  }
}
