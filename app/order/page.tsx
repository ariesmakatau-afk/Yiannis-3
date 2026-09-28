import type { Metadata } from "next";
import LocationIdentifier from "@/components/LocationIdentifier";
import OrderFlow from "@/components/OrderFlow";

export const metadata: Metadata = {
  title: "Order Online",
  description:
    "Order Yianni's on Hindley Street via Uber Eats delivery, or build a pickup order and pay in-store.",
};

export default function OrderPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-cobalt-dark sm:text-4xl">Order Online</h1>
      <div className="key-divider-ember mt-4 w-24 opacity-80" aria-hidden="true" />
      <p className="mt-2 max-w-prose text-ink/60">
        Two ways to order: delivery via Uber Eats, or build a pickup order here and pay when you
        collect it.
      </p>
      <LocationIdentifier className="mt-6" />
      <div className="mt-10">
        <OrderFlow />
      </div>
    </div>
  );
}
