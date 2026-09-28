"use client";

import { useEffect } from "react";
import CentaurWallpaper from "@/components/theme/CentaurWallpaper";

/**
 * The wall the whole site hangs on: whitewash with the shop's centaur
 * wallpaper printed over it in blue, and the warmth of the coals coming up
 * from the bottom of the screen.
 *
 * Fixed behind the page; every section is a veil over it, so the wallpaper
 * carries on under the content. Scroll progress is written to `--heat`
 * (0 → 1) on <html>: the further down the page, the closer to the grill,
 * and the stronger the glow (see `.shop-heat` in globals.css). The embers
 * themselves are live, drawn by <EmberField />.
 */
export default function ShopBackdrop() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;

    function update() {
      frame = 0;
      const max = root.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      root.style.setProperty("--heat", progress.toFixed(4));
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Page height changes on client-side navigation and as images load.
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div aria-hidden="true" className="shop-backdrop">
      <div className="shop-layer shop-wall" />

      {/* The centaur wallpaper, as it hangs in the shop */}
      <CentaurWallpaper id="centaur-wallpaper" className="shop-layer shop-wallpaper" />

      <div className="shop-layer shop-heat" />
    </div>
  );
}
