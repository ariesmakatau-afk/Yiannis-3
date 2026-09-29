import type { Metadata } from "next";
import { requireStaffPage } from "@/lib/requireStaff";
import { isConfigured } from "@/lib/supabase";
import AdminShell from "@/components/staff/AdminShell";
import EventsManager from "@/components/staff/EventsManager";
import { listEvents } from "@/lib/social/store";
import { shopDate } from "@/lib/social/time";
import type { ShopEvent } from "@/lib/social/types";

export const metadata: Metadata = {
  title: "Events",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EventsAdminPage() {
  requireStaffPage("/admin/events");

  let events: ShopEvent[] = [];
  if (isConfigured()) {
    try {
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      events = await listEvents({ fromIso: from });
    } catch (err) {
      console.error("[admin/events] load failed:", err);
    }
  }

  return (
    <AdminShell>
      <EventsManager initial={events} today={shopDate()} />
    </AdminShell>
  );
}
