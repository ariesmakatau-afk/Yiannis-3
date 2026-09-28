"use client";

import { useEffect } from "react";

/**
 * Anything marked `data-reveal` rises into place the first time it scrolls
 * into view. Set `--reveal-delay` inline to stagger a row of them.
 *
 * Content is only hidden once this has run (it adds `reveal-ready` to
 * <html>), so without JavaScript — or for reduced-motion readers, whom the
 * CSS leaves alone — everything is simply there.
 */
export default function RevealOnScroll() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    function scan() {
      document
        .querySelectorAll("[data-reveal]:not(.is-revealed)")
        .forEach((el) => io.observe(el));
    }

    root.classList.add("reveal-ready");
    scan();
    // New pages arrive by client-side navigation.
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
