"use client";

import { useCallback, useEffect, useState } from "react";
import { business } from "@/lib/content";

type Order = {
  customer_name: string;
  pickup_time: string;
  status: "new" | "accepted" | "rejected" | "collected";
  wait_minutes: number | null;
  created_at: string;
};

const POLL_MS = 20000;

export default function OrderStatus({ id }: { id: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/order/status?id=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not check that order.");
      setOrder(body.order);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check that order.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const t = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(t);
  }, [load]);

  if (loading) {
    return <p className="py-16 text-center text-ink/50">Checking…</p>;
  }

  if (error || !order) {
    return (
      <div className="tile-card p-8 text-center">
        <p className="font-display text-xl font-semibold text-cobalt-dark">
          We couldn&rsquo;t find that order
        </p>
        <p className="mt-2 text-sm text-ink/60">
          Check the link, or give us a call on{" "}
          <a href={business.phoneHref} className="font-semibold text-cobalt">
            {business.phone}
          </a>
          .
        </p>
      </div>
    );
  }

  const { headline, detail, tone } = describe(order);

  return (
    <div className="tile-card p-7 text-center sm:p-9">
      <p className="eyebrow-spark justify-center">Your order</p>

      <p
        className={`mt-5 font-display text-3xl font-semibold leading-tight sm:text-4xl ${
          tone === "bad" ? "text-red-700" : "text-cobalt-dark"
        }`}
      >
        {headline}
      </p>
      <p className="mt-3 leading-relaxed text-ink/65">{detail}</p>

      <dl className="mt-7 space-y-2 border-t border-cobalt/10 pt-5 text-left text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink/50">Name</dt>
          <dd className="font-semibold">{order.customer_name}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink/50">Pickup</dt>
          <dd className="font-semibold">{order.pickup_time}</dd>
        </div>
      </dl>

      <p className="mt-6 text-xs text-ink/45">
        This page updates on its own — leave it open.
      </p>

      <a href={business.phoneHref} className="btn-porcelain mt-6 w-full">
        Call the shop
      </a>
    </div>
  );
}

function describe(order: Order): {
  headline: string;
  detail: string;
  tone: "good" | "bad";
} {
  switch (order.status) {
    case "new":
      return {
        headline: "Order received",
        detail:
          "Give the kitchen a few seconds to confirm — your wait time will appear here as soon as they do.",
        tone: "good",
      };
    case "accepted":
      return {
        headline:
          order.wait_minutes != null
            ? `About ${order.wait_minutes} minutes`
            : "Being made now",
        detail:
          order.wait_minutes != null
            ? "The kitchen is on it. Head over when you're ready — we'll have it waiting."
            : "The kitchen has started your order.",
        tone: "good",
      };
    case "collected":
      return {
        headline: "Picked up",
        detail: "Thanks — see you next time.",
        tone: "good",
      };
    case "rejected":
      return {
        headline: "Couldn't take this one",
        detail:
          "Something went wrong with this order and the shop couldn't take it. Give us a ring and we'll sort it out.",
        tone: "bad",
      };
  }
}
