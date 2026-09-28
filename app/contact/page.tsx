import type { Metadata } from "next";
import LocationIdentifier from "@/components/LocationIdentifier";
import MapEmbed from "@/components/MapEmbed";
import TrackedAnchor from "@/components/TrackedAnchor";
import { business, fullAddress } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Yianni's on Hindley Street, Adelaide CBD.",
};

const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  fullAddress
)}`;

export default function ContactPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-cobalt-dark sm:text-4xl">Contact</h1>
      <div className="key-divider-ember mt-4 w-24 opacity-80" aria-hidden="true" />
      <LocationIdentifier className="mt-6" />

      <div className="mt-10 grid gap-10 sm:grid-cols-2">
        <div className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Address</h2>
            <p className="mt-1 text-ink/80">{fullAddress}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Phone</h2>
            <TrackedAnchor
              href={business.phoneHref}
              event={{ name: "phone_click" }}
              className="mt-1 block font-semibold text-cobalt"
            >
              {business.phone}
            </TrackedAnchor>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Email</h2>
            <a href={`mailto:${business.email}`} className="mt-1 block text-ink/80">
              {business.email}
            </a>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Follow</h2>
            <div className="mt-1 flex gap-4">
              <a
                href={business.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink/80 hover:text-ink"
              >
                Facebook
              </a>
              <a
                href={business.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink/80 hover:text-ink"
              >
                Instagram
              </a>
            </div>
          </div>
          <TrackedAnchor
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            event={{ name: "get_directions_click" }}
            className="btn-porcelain mt-2"
          >
            Get Directions
          </TrackedAnchor>
        </div>

        <MapEmbed
          address={fullAddress}
          label="Map of Yianni's on Hindley Street, 270 Hindley Street, Adelaide SA 5000"
          className="min-h-[280px]"
        />
      </div>
    </div>
  );
}
