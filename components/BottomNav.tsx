"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fullAddress } from "@/lib/content";
import { trackEvent } from "@/lib/analytics";

const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  fullAddress
)}`;

// Thumb-reachable quick actions, mobile only.
//
// Previously a full-width fixed bar that permanently ate ~64px of every
// screen. Now it's a slim floating pill that tucks itself away as soon as
// you scroll down the page and slides back the moment you scroll up (or
// reach the bottom), so reading gets the full viewport. There's also a
// chevron to dismiss it manually; tapping the peeking tab brings it back.
export default function BottomNav() {
  const [hidden, setHidden] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;

    function onScroll() {
      const y = window.scrollY;
      const delta = y - lastY.current;

      // Ignore jitter and rubber-banding at the very top.
      if (Math.abs(delta) < 6) return;

      const atBottom =
        window.innerHeight + y >= document.documentElement.scrollHeight - 80;

      if (atBottom || y < 80) {
        setHidden(false);
      } else if (delta > 0) {
        setHidden(true); // scrolling down — get out of the way
      } else {
        setHidden(false); // scrolling up — likely looking for navigation
      }

      lastY.current = y;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Manually dismissed: leave a small tab to bring it back.
  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => setDismissed(false)}
        aria-label="Show quick actions"
        className="menu-panel fixed bottom-0 right-4 z-40 rounded-t-lg border border-b-0 border-cobalt/15 px-3 py-1.5 text-cobalt-dark shadow-lg md:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 14l5-5 5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    );
  }

  return (
    <nav
      aria-label="Quick actions"
      className={`fixed inset-x-3 bottom-3 z-40 flex items-center gap-1 quick-dock rounded-full p-1 transition-transform duration-300 md:hidden ${
        hidden ? "translate-y-[150%]" : "translate-y-0"
      }`}
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <Link
        href="/menu"
        onClick={() => trackEvent({ name: "menu_page_view" })}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold text-cobalt-dark transition-colors active:bg-cobalt/10"
      >
        <IconMenu />
        Menu
      </Link>

      <Link
        href="/order"
        className="flex flex-[1.3] items-center justify-center gap-1.5 btn-coal !rounded-full !px-0 !py-2.5 text-xs"
      >
        <IconBag />
        Order
      </Link>

      <a
        href={directionsHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent({ name: "get_directions_click" })}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold text-cobalt-dark transition-colors active:bg-cobalt/10"
      >
        <IconPin />
        Directions
      </a>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Hide quick actions"
        className="mr-1 shrink-0 rounded-full p-2 text-ink/35 transition-colors active:bg-ink/5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 10l5 5 5-5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </nav>
  );
}

function IconMenu() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconBag() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 8h12l1 12H5L6 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 8a3 3 0 0 1 6 0" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
