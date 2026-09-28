import type { Metadata } from "next";
import Link from "next/link";
import OrderStatus from "@/components/OrderStatus";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function OrderStatusPage({ params }: { params: { id: string } }) {
  return (
    <div className="container-page max-w-lg py-12 sm:py-16">
      <OrderStatus id={params.id} />
      <div className="mt-10 text-center">
        <Link href="/menu" className="text-sm font-medium text-cobalt underline underline-offset-4">
          Back to the menu
        </Link>
      </div>
    </div>
  );
}
