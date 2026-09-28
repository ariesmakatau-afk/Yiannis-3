export const IGNITE_EVENT = "yiannis:ignite-embers";

export type IgniteDetail = { left: number; right: number; top: number };

/**
 * Pour a fountain of sparks up off an element — used when an order is sent.
 * <EmberField /> (components/theme) listens for this and draws it; if it
 * isn't running (reduced motion), this does nothing.
 */
export function igniteEmbers(el: Element | null) {
  if (!el || typeof window === "undefined") return;
  const r = el.getBoundingClientRect();
  window.dispatchEvent(
    new CustomEvent<IgniteDetail>(IGNITE_EVENT, {
      detail: { left: r.left, right: r.right, top: r.top },
    })
  );
}
