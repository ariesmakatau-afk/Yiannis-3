import type { Metadata } from "next";
import { requireStaffPage } from "@/lib/requireStaff";
import { isConfigured } from "@/lib/supabase";
import AdminShell from "@/components/staff/AdminShell";
import SocialPlanner from "@/components/staff/SocialPlanner";
import { aiConfigured } from "@/lib/social/generate";
import { siteUrl } from "@/lib/social/library";
import { facebookConfigured, instagramConfigured } from "@/lib/social/meta";
import { listWeekPosts } from "@/lib/social/store";
import { isDateString, mondayOf, planningWeek, shopDate } from "@/lib/social/time";
import type { SocialPost } from "@/lib/social/types";

export const metadata: Metadata = {
  title: "Social posts",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SocialAdminPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  requireStaffPage("/admin/social");

  const weekStart = isDateString(searchParams.week) ? mondayOf(searchParams.week) : planningWeek();
  let posts: SocialPost[] = [];
  if (isConfigured()) {
    try {
      posts = await listWeekPosts(weekStart);
    } catch (err) {
      console.error("[admin/social] load failed:", err);
    }
  }

  return (
    <AdminShell>
      <SocialPlanner
        // Remount when the week changes so local state starts fresh.
        key={weekStart}
        weekStart={weekStart}
        today={shopDate()}
        initialPosts={posts}
        status={{
          database: isConfigured(),
          ai: aiConfigured(),
          facebook: facebookConfigured(),
          instagram: instagramConfigured(),
          siteUrl: siteUrl() !== null,
          publishWindow: process.env.SOCIAL_PUBLISH_WINDOW === "exact" ? "exact" : "day",
        }}
      />
    </AdminShell>
  );
}
