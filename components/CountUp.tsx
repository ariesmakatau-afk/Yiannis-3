"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A stat figure that counts up from zero the first time it comes into
 * view: "40-ish" counts 0 → 40 and keeps its "-ish". Renders the final
 * figure on the server, so it reads correctly without JavaScript.
 */
export default function CountUp({ figure, className = "" }: { figure: string; className?: string }) {
  const match = figure.match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : 0;
  const suffix = match ? match[2] : "";
  const [value, setValue] = useState<number | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !match || target === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setValue(0);
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const duration = 1400;
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setValue(Math.round(eased * target));
          if (t < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [figure]);

  return (
    <span ref={ref} className={className} aria-label={figure}>
      {match && value !== null ? `${value}${suffix}` : figure}
    </span>
  );
}
