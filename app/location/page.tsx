import type { Metadata } from "next";
import Link from "next/link";
import LocationIdentifier from "@/components/LocationIdentifier";
import MapEmbed from "@/components/MapEmbed";
import TrackedAnchor from "@/components/TrackedAnchor";
import { business, fullAddress, openingHours } from "@/lib/content";

export const metadata: Metadata = {
  title: "Location",
  description: "Find Yianni's on Hindley Street at 270 Hindley Street, Adelaide CBD.",
};

const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  fullAddress
)}`;

export default function LocationPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-cobalt-dark sm:text-4xl">Location</h1>
      <div className="key-divider-ember mt-4 w-24 opacity-80" aria-hidden="true" />
      <LocationIdentifier className="mt-6" />

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <MapEmbed
          address={fullAddress}
          label="Map of Yianni's on Hindley Street, 270 Hindley Street, Adelaide SA 5000"
          minHeight="320px"
        />

        <div>
          <h2 className="font-display text-xl font-semibold">Opening Hours</h2>
          <dl className="mt-3 max-w-sm space-y-1 text-sm">
            {openingHours.map((row) => (
              <div key={row.day} className="flex justify-between gap-4 border-b border-ink/10 py-1.5">
                <dt className="text-ink/60">{row.day}</dt>
                <dd>{row.hours}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <TrackedAnchor
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              event={{ name: "get_directions_click" }}
              className="btn-coal"
            >
              Get Directions
            </TrackedAnchor>
            <TrackedAnchor
              href={business.phoneHref}
              event={{ name: "phone_click" }}
              className="btn-porcelain"
            >
              Call {business.phone}
            </TrackedAnchor>
            <Link href="/order" className="btn-porcelain">
              Order Online
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
