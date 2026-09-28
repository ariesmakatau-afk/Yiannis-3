import type { Metadata } from "next";
import { requireStaffPage } from "@/lib/requireStaff";
import KitchenBoard from "@/components/staff/KitchenBoard";

export const metadata: Metadata = {
  title: "Kitchen",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function KitchenPage() {
  requireStaffPage("/kitchen");
  return <KitchenBoard />;
}
