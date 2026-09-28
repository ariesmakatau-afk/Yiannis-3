import { NextResponse, type NextRequest } from "next/server";
import { isStaff } from "@/lib/requireStaff";
import { getContent, isConfigured, setContent, uploadToStorage } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_PHOTOS = 12;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export type CustomerPhoto = {
  id: string;
  url: string;
  caption: string;
  name?: string;
};

async function readPhotos(): Promise<CustomerPhoto[]> {
  const raw = await getContent("parea_photos");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET() {
  if (!isStaff()) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({ photos: await readPhotos() });
}

export async function POST(request: NextRequest) {
  if (!isStaff()) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!isConfigured()) {
    return NextResponse.json({ error: "Storage isn't configured." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("photo");
  const caption = String(form.get("caption") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No photo was attached." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG or WEBP image." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That image is over 8MB." }, { status: 400 });
  }
  if (!caption) {
    return NextResponse.json({ error: "Add a caption." }, { status: 400 });
  }

  const photos = await readPhotos();
  if (photos.length >= MAX_PHOTOS) {
    return NextResponse.json(
      { error: `The wall holds ${MAX_PHOTOS} photos — remove one first.` },
      { status: 400 }
    );
  }

  try {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const url = await uploadToStorage(
      "media",
      `parea/wall/${id}.${ext}`,
      await file.arrayBuffer(),
      file.type
    );
    const next: CustomerPhoto[] = [
      { id, url, caption, ...(name ? { name } : {}) },
      ...photos,
    ];
    await setContent("parea_photos", JSON.stringify(next));
    return NextResponse.json({ photos: next });
  } catch (err) {
    console.error("[customer-photos] upload failed:", err);
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isStaff()) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Which photo?" }, { status: 400 });

  try {
    const photos = await readPhotos();
    const next = photos.filter((p) => p.id !== id);
    await setContent("parea_photos", JSON.stringify(next));
    // The file stays in storage — harmless at this scale, and it means a
    // mis-tap can be undone by re-adding rather than re-uploading.
    return NextResponse.json({ photos: next });
  } catch (err) {
    console.error("[customer-photos] delete failed:", err);
    return NextResponse.json({ error: "Could not remove it." }, { status: 502 });
  }
}
