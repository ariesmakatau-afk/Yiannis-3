// lib/analytics.ts
//
// Thin wrapper around GA4's gtag so event names stay consistent across the
// site. No-ops safely if GA hasn't loaded (e.g. NEXT_PUBLIC_GA_ID unset).

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export type AnalyticsEvent =
  | { name: "order_online_click"; path: "uber_eats" | "pickup" }
  | { name: "phone_click" }
  | { name: "get_directions_click" }
  | { name: "menu_page_view" }
  | { name: "contact_page_view" }
  | { name: "pickup_order_submitted" };

export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  const { name, ...params } = event;
  window.gtag("event", name, params);
}
