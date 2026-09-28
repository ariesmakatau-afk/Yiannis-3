import type { Metadata } from "next";
import { requireStaffPage } from "@/lib/requireStaff";
import { getContent } from "@/lib/supabase";
import PhotoManager from "@/components/staff/PhotoManager";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  requireStaffPage("/admin");
  const current = await getContent("team_photo_url");
  const rawWall = await getContent("parea_photos");
  let wall: { id: string; url: string; caption: string; name?: string }[] = [];
  try {
    const parsed = JSON.parse(rawWall ?? "[]");
    if (Array.isArray(parsed)) wall = parsed;
  } catch {
    wall = [];
  }
  return <PhotoManager initialUrl={current} wall={wall} />;
}
