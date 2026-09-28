import type { Metadata } from "next";
import StaffLogin from "@/components/staff/StaffLogin";

export const metadata: Metadata = {
  title: "Staff",
  robots: { index: false, follow: false },
};

export default function StaffLoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  // Only ever redirect to our own paths — never to an absolute URL a
  // visitor supplied, which would be an open redirect.
  const raw = searchParams.next ?? "/kitchen";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/kitchen";

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-14">
      <StaffLogin next={next} />
    </div>
  );
}
