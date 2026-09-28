"use client";

import { useMemo, useRef, useState } from "react";
import { business } from "@/lib/content";
import { formatMoney, orderableGroups, type Product } from "@/lib/menu";
import { trackEvent } from "@/lib/analytics";
import { igniteEmbers } from "@/lib/embers";
import ProductCustomiser, { type ConfiguredLine } from "@/components/ProductCustomiser";

type Step = "choose" | "build" | "details" | "sent";

export default function OrderFlow() {
  const [path, setPath] = useState<"none" | "pickup">("none");
  const [step, setStep] = useState<Step>("choose");
  const [cart, setCart] = useState<ConfiguredLine[]>([]);
  const [customising, setCustomising] = useState<Product | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [cartPulse, setCartPulse] = useState(0);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [email, setEmail] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const [justSent, setJustSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  /**
   * Each step swaps the whole panel for a shorter one, so the browser keeps
   * the old scroll position and drops the customer at the footer. Move them
   * back to the top whenever the step changes.
   */
  function goToStep(next: Step) {
    setStep(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const totalItems = useMemo(() => cart.reduce((s, l) => s + l.quantity, 0), [cart]);
  const estimatedTotal = useMemo(
    () => cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    [cart]
  );

  function handleAdd(line: ConfiguredLine) {
    setCart((prev) => {
      const existing = prev.find((l) => l.key === line.key);
      if (existing) {
        return prev.map((l) =>
          l.key === line.key ? { ...l, quantity: l.quantity + line.quantity } : l
        );
      }
      return [...prev, line];
    });
    setCustomising(null);
    setJustAdded(line.productId);
    setCartPulse((n) => n + 1);
    window.setTimeout(() => setJustAdded((cur) => (cur === line.productId ? null : cur)), 1600);
  }

  function changeQty(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  async function submitOrder() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          pickupTime,
          orderNotes,
          email,
          items: cart.map((l) => ({
            name: l.detail ? `${l.name} — ${l.detail}` : l.name,
            quantity: l.quantity,
            notes: formatMoney(l.unitPrice) + " ea",
          })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Something went wrong sending your order.");
      }
      setOrderId(body.orderId ?? null);
      trackEvent({ name: "pickup_order_submitted" });
      // The order is in: sparks fly off the button that sent it. Hold the
      // form for a beat so the customer sees it before the confirmation.
      setJustSent(true);
      igniteEmbers(sendButtonRef.current);
      await new Promise((resolve) => setTimeout(resolve, 1300));
      setJustSent(false);
      goToStep("sent");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please call us instead."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Step 1: pickup or Uber Eats ---------------------------------------
  if (path === "none") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href={business.uberEatsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent({ name: "order_online_click", path: "uber_eats" })}
          className="flex flex-col justify-between border border-cobalt/15 bg-white p-6 transition-colors hover:border-cobalt"
        >
          <div>
            <p className="font-display text-xl font-semibold">Order via Uber Eats</p>
            <p className="mt-2 text-sm text-ink/60">
              Delivery, handled entirely by Uber Eats — menu, pricing and payment all happen
              over there.
            </p>
          </div>
          <span className="mt-6 text-sm font-semibold text-cobalt">Opens Uber Eats ↗</span>
        </a>

        <button
          type="button"
          onClick={() => {
            setPath("pickup");
            goToStep("build");
            trackEvent({ name: "order_online_click", path: "pickup" });
          }}
          className="flex flex-col justify-between border border-cobalt/15 bg-white p-6 text-left transition-colors hover:border-cobalt"
        >
          <div>
            <p className="font-display text-xl font-semibold">Order for Pickup</p>
            <p className="mt-2 text-sm text-ink/60">
              Build your order here, tell us when you&rsquo;ll swing by, and pay in-store when
              you collect it. No online payment.
            </p>
          </div>
          <span className="mt-6 text-sm font-semibold text-cobalt">Start your order →</span>
        </button>
      </div>
    );
  }

  // ---- Step 4: confirmation ----------------------------------------------
  if (step === "sent") {
    return (
      <div className="border border-cobalt/15 bg-white p-8 text-center">
        <p className="font-display text-2xl font-semibold">Order sent!</p>
        <p className="mt-3 text-ink/70">
          We&rsquo;ve got your order — pay in-store when you pick it up.
        </p>
        {orderId && (
          <>
            <a href={`/order/status/${orderId}`} className="btn-coal mt-6 inline-block">
              Check your wait time
            </a>
            <p className="mt-3 text-sm text-ink/55">
              Give the kitchen a moment to confirm, then this shows your wait
              time. It updates on its own — no need to refresh.
            </p>
          </>
        )}
        <p className="mt-6 text-sm text-ink/50">
          Running early or late? Call us on{" "}
          <a href={business.phoneHref} className="font-semibold text-cobalt">
            {business.phone}
          </a>
          .
        </p>
      </div>
    );
  }

  // ---- Step 3: customer details ------------------------------------------
  if (step === "details") {
    return (
      <div className="border border-cobalt/15 bg-white p-6 sm:p-8">
        <button
          type="button"
          onClick={() => goToStep("build")}
          className="text-sm font-semibold text-cobalt"
        >
          ← Back to your order
        </button>
        <p className="mt-3 font-display text-xl font-semibold">Your details</p>
        <p className="mt-1 text-sm text-ink/60">
          Pay in-store on pickup — no payment happens here.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submitOrder();
          }}
        >
          <div>
            <label htmlFor="customerName" className="block text-sm font-semibold">
              Name
            </label>
            <input
              id="customerName"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 w-full border border-ink/20 px-3 py-2.5 text-base"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full border border-ink/20 px-3 py-2.5 text-base"
            />
          </div>
          <div>
            <label htmlFor="pickupTime" className="block text-sm font-semibold">
              Pickup time
            </label>
            <input
              id="pickupTime"
              required
              placeholder="e.g. Tonight, 8:30pm"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="mt-1 w-full border border-ink/20 px-3 py-2.5 text-base"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold">
              Email <span className="font-normal text-ink/50">(optional)</span>
            </label>
            <p className="mt-1 text-sm text-ink/55">
              Only for the occasional offer. Nothing else, and never often.
            </p>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 w-full border border-ink/20 px-3 py-2.5 text-base"
            />
          </div>

          <div>
            <label htmlFor="orderNotes" className="block text-sm font-semibold">
              Notes <span className="font-normal text-ink/50">(optional)</span>
            </label>
            <textarea
              id="orderNotes"
              rows={3}
              placeholder="Sauces, no salad, anything else we should know"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="mt-1 w-full border border-ink/20 px-3 py-2.5 text-base"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <button
            ref={sendButtonRef}
            type="submit"
            disabled={submitting || justSent}
            className={`btn-coal w-full ${justSent ? "" : "disabled:opacity-60"}`}
          >
            {justSent ? "Order sent ✓" : submitting ? "Sending order…" : "Send Order"}
          </button>
        </form>
      </div>
    );
  }

  // ---- Step 2: build the order -------------------------------------------
  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          {orderableGroups.map((group) => (
            <section key={group.id}>
              <h2 className="font-display text-lg font-semibold text-cobalt-dark">
                {group.title}
              </h2>
              {group.blurb && <p className="mt-1 text-sm text-ink/55">{group.blurb}</p>}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {group.products.map((product) => {
                  const added = justAdded === product.id;
                  const from =
                    product.sizes.length > 1
                      ? `From ${formatMoney(Math.min(...product.sizes.map((s) => s.price)))}`
                      : formatMoney(product.sizes[0].price);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setCustomising(product)}
                      className={`flex flex-col items-start rounded-sm border bg-white p-4 text-left transition-all duration-200 ${
                        added
                          ? "added-flash border-cobalt ring-2 ring-cobalt/25"
                          : "border-cobalt/15 hover:border-cobalt hover:shadow-md"
                      }`}
                    >
                      <div className="flex w-full items-start justify-between gap-3">
                        <p className="font-display text-base font-semibold text-cobalt-dark">
                          {product.name}
                        </p>
                        <p className="shrink-0 text-sm font-semibold text-cobalt">{from}</p>
                      </div>
                      {product.description && (
                        <p className="mt-1 text-sm text-ink/55">{product.description}</p>
                      )}
                      <span
                        className={`mt-3 text-sm font-semibold transition-colors ${
                          added ? "text-cobalt" : "text-ink/45"
                        }`}
                      >
                        {added ? "✓ Added to your order" : "Choose options →"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Order summary */}
        <aside className="h-fit border border-cobalt/15 bg-white p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-lg font-semibold">Your Order</p>
            {totalItems > 0 && (
              <span
                key={cartPulse}
                className="cart-bump flex h-7 min-w-7 items-center justify-center rounded-full bg-cobalt px-2 text-sm font-semibold text-white"
              >
                {totalItems}
              </span>
            )}
          </div>

          {cart.length === 0 ? (
            <p className="mt-3 text-sm text-ink/50">
              Nothing yet — pick something above and choose your options.
            </p>
          ) : (
            <>
              <ul className="mt-4 space-y-4">
                {cart.map((line) => (
                  <li key={line.key} className="border-b border-cobalt/10 pb-4 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">{line.name}</p>
                      <p className="shrink-0 text-sm font-semibold text-cobalt">
                        {formatMoney(line.unitPrice * line.quantity)}
                      </p>
                    </div>
                    {line.detail && (
                      <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{line.detail}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Remove one ${line.name}`}
                        onClick={() => changeQty(line.key, -1)}
                        className="h-7 w-7 rounded-full border border-ink/20 text-sm transition-transform active:scale-90"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm font-medium">{line.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Add one more ${line.name}`}
                        onClick={() => changeQty(line.key, 1)}
                        className="h-7 w-7 rounded-full border border-ink/20 text-sm transition-transform active:scale-90"
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between border-t border-cobalt/15 pt-4">
                <span className="text-sm font-semibold">Estimated total</span>
                <span className="font-display text-lg font-semibold text-cobalt-dark">
                  {formatMoney(estimatedTotal)}
                </span>
              </div>
            </>
          )}

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => goToStep("details")}
            className="btn-coal mt-5 w-full disabled:opacity-40"
          >
            Continue
          </button>
          <p className="mt-3 text-xs text-ink/50">
            Estimate only — your final total is confirmed in-store when you pay.
          </p>
        </aside>
      </div>

      {customising && (
        <ProductCustomiser
          product={customising}
          onClose={() => setCustomising(null)}
          onAdd={handleAdd}
        />
      )}
    </>
  );
}
