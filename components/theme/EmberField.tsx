"use client";

import { useEffect, useRef } from "react";
import { IGNITE_EVENT, type IgniteDetail } from "@/lib/embers";

type Ember = {
  x: number;
  y: number;
  px: number; // last position, for the motion streak
  py: number;
  vx: number;
  vy: number;
  life: number; // seconds remaining
  maxLife: number;
  size: number; // core width in px
  heat: number; // 0–1 starting temperature
  seed: number; // per-ember offset for turbulence and flicker
};

// A pour of sparks from one rectangle over a short time (the order button).
type Fountain = {
  left: number;
  right: number;
  top: number;
  remaining: number;
};

const MAX_EMBERS = 900;
// The home hero, the dark olive bands and the footer are drawn as coal
// beds; sparks rise off them. The cream pages stay calm.
const COAL_SELECTOR = ".hero-fire, .coal-bed, .footer-coals, .menu-panel--grill";

/**
 * Live embers over the whole site, drawn on one canvas.
 *
 * - Every coal bed on screen (the dark bands, the menu, the footer) throws
 *   off its own steady stream from its bottom edge.
 * - When an order is sent, the button it was sent from pours out a fountain
 *   of sparks (see `igniteEmbers` in lib/embers.ts). Nothing else on the
 *   page triggers a burst.
 *
 * The sparks are drawn the way real ones photograph: tiny, hot points with
 * a short motion streak, flickering, cooling from yellow-white to deep red
 * as they climb, pushed around by the air, and some winking out early.
 *
 * The canvas never takes pointer events, so it can sit above the content
 * without getting in the way of a single click. It pauses when the tab is
 * hidden, and it switches off entirely for people who ask for reduced motion.
 */
export default function EmberField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const embers: Ember[] = [];
    const fountains: Fountain[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let last = performance.now();
    let clock = 0;
    let coals: Element[] = [];
    // Fractional spawn carry, so low rates still emit at the right average.
    const carry = new Map<unknown, number>();

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function findCoals() {
      coals = Array.from(document.querySelectorAll(COAL_SELECTOR));
    }

    function spawn(x: number, y: number, vx: number, vy: number, life: number, heat: number) {
      if (embers.length >= MAX_EMBERS) embers.shift();
      // Most sparks are pin-pricks; a few are bigger flakes.
      const size = 0.6 + Math.pow(Math.random(), 3) * 1.6;
      embers.push({
        x,
        y,
        px: x,
        py: y,
        vx,
        vy,
        life,
        maxLife: life,
        size,
        heat,
        seed: Math.random() * 1000,
      });
    }

    // Emit `rate` sparks per second along a horizontal edge.
    function emitAlong(
      key: unknown,
      left: number,
      right: number,
      y: number,
      rate: number,
      dt: number,
      lift: number
    ) {
      const due = (carry.get(key) ?? 0) + rate * dt;
      const count = Math.floor(due);
      carry.set(key, due - count);
      for (let i = 0; i < count; i++) {
        spawn(
          left + Math.random() * (right - left),
          y - Math.random() * 6,
          (Math.random() - 0.5) * 30,
          -(lift * (0.5 + Math.random())),
          1.6 + Math.random() * 3.2,
          0.55 + Math.random() * 0.45
        );
      }
    }

    // An order was sent: pour sparks up off the button for a moment.
    function onIgnite(e: Event) {
      const { left, right, top } = (e as CustomEvent<IgniteDetail>).detail;
      fountains.push({ left, right, top, remaining: 1.6 });
    }

    function colour(t: number, alpha: number) {
      // Temperature → colour, like cooling charcoal: white-gold, orange,
      // then a deep red just before it goes out.
      const r = t < 0.25 ? Math.round(170 + 340 * t) : 255;
      const g = Math.round(60 + 190 * Math.pow(t, 1.3));
      const b = Math.round(10 + 150 * Math.pow(t, 3));
      return `rgba(${r},${g},${b},${alpha})`;
    }

    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;

      const narrow = width < 640;

      // Each coal bed on screen feeds its own stream.
      for (const el of coals) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > height) continue;
        const bottom = Math.min(r.bottom, height + 6);
        // The hero's fire is the biggest on the site, so it throws the most.
        const boost = el.classList.contains("hero-fire") ? 2.2 : 1;
        emitAlong(el, r.left, r.right, bottom, (r.width / (narrow ? 40 : 60)) * boost, dt, 80 * boost);
      }

      // The order button's fountain: heavy at first, then tailing off.
      for (let i = fountains.length - 1; i >= 0; i--) {
        const f = fountains[i];
        f.remaining -= dt;
        if (f.remaining <= 0) {
          fountains.splice(i, 1);
          continue;
        }
        const strength = Math.min(1, f.remaining / 1.2);
        const due = (carry.get(f) ?? 0) + 260 * strength * dt;
        const count = Math.floor(due);
        carry.set(f, due - count);
        for (let n = 0; n < count; n++) {
          const x = f.left + Math.random() * (f.right - f.left);
          const spread = (x - (f.left + f.right) / 2) * 0.9;
          spawn(
            x,
            f.top + Math.random() * 8,
            spread + (Math.random() - 0.5) * 90,
            -(160 + Math.random() * 280),
            1 + Math.random() * 1.8,
            0.55 + Math.random() * 0.35
          );
        }
      }

      ctx!.clearRect(0, 0, width, height);
      ctx!.globalCompositeOperation = "lighter";
      ctx!.lineCap = "round";

      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.life -= dt;
        // Some sparks just wink out, as real ones do.
        if (e.life <= 0 || e.y < -30 || (e.life < e.maxLife * 0.5 && Math.random() < 0.004)) {
          embers.splice(i, 1);
          continue;
        }

        // Rising hot air, drag, and smooth turbulence that makes them wander.
        const gust =
          Math.sin(e.y * 0.013 + clock * 1.1 + e.seed) * 42 +
          Math.sin(e.y * 0.041 + clock * 2.3 + e.seed * 1.7) * 18;
        e.vx += (gust - e.vx) * 1.6 * dt;
        e.vy -= 30 * dt;
        e.vy *= 1 - 0.9 * dt;
        e.px = e.x;
        e.py = e.y;
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        const age = e.life / e.maxLife; // 1 → 0
        const t = e.heat * (0.35 + 0.65 * age); // cools as it climbs
        const flicker = 0.55 + 0.45 * Math.sin(clock * 22 + e.seed * 3) * Math.sin(clock * 9 + e.seed);
        const alpha = Math.min(1, age * 2.2) * (0.6 + 0.4 * flicker);

        // Motion streak: a short line back along its path, like a camera
        // catching a moving spark.
        // Capped so fast sparks read as streaks, not lines.
        let dx = e.x - e.px;
        let dy = e.y - e.py;
        const len = Math.hypot(dx, dy) * 1.3;
        const maxLen = 3 + e.size * 3;
        if (len > maxLen) {
          dx *= maxLen / len;
          dy *= maxLen / len;
        }
        const sx = e.x - dx * 1.3;
        const sy = e.y - dy * 1.3;

        // Faint heat halo, then the hot core.
        ctx!.strokeStyle = colour(t * 0.8, alpha * 0.18);
        ctx!.lineWidth = e.size * 4;
        ctx!.beginPath();
        ctx!.moveTo(sx, sy);
        ctx!.lineTo(e.x, e.y);
        ctx!.stroke();

        ctx!.strokeStyle = colour(t, alpha);
        ctx!.lineWidth = e.size;
        ctx!.beginPath();
        ctx!.moveTo(sx, sy);
        ctx!.lineTo(e.x, e.y);
        ctx!.stroke();
      }
    }

    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }

    resize();
    findCoals();
    // Pages change under us on client-side navigation.
    const observer = new MutationObserver(findCoals);
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("resize", resize);
    window.addEventListener(IGNITE_EVENT, onIgnite);
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener(IGNITE_EVENT, onIgnite);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="ember-field" />;
}
