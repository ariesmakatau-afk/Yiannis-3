"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const TABS = [
  { href: "/admin/social", label: "Social posts" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin", label: "Photos" },
];

/** Header + tab bar shared by every /admin screen. */
export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  async function signOut() {
    await fetch("/api/staff/session", { method: "DELETE" });
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-porcelain">
      <header className="border-b border-cobalt/15 bg-white">
        <div className="container-page flex items-center justify-between gap-4 py-3.5">
          <p className="font-display text-lg font-semibold text-cobalt-dark">Admin</p>
          <div className="flex items-center gap-2">
            <Link href="/kitchen" className="rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold">
              Kitchen
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav aria-label="Admin sections" className="container-page flex gap-1 overflow-x-auto pb-2">
          {TABS.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  active ? "bg-cobalt text-white" : "text-cobalt-dark hover:bg-cobalt/10"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
    </div>
  );
}
