import type { Metadata } from "next";
import Image from "next/image";
import LocationIdentifier from "@/components/LocationIdentifier";
import ArchFrame from "@/components/ornament/ArchFrame";
import { aboutCopy, fullAddress } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "30 years of Greek yiros on Hindley Street, Adelaide CBD — the story behind Yianni's.",
};

export default function AboutPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <p className="eyebrow-spark">Hindley Street, Adelaide</p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-cobalt-dark sm:text-4xl">
        Our Story
      </h1>
      <div className="key-divider-ember mt-4 w-24 opacity-80" aria-hidden="true" />
      <LocationIdentifier className="mt-6" />

      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-center">
        <ArchFrame tone="dark">
          <div className="grill-ledge overflow-hidden rounded-sm">
            <Image
              src="/images/storefront-wide.jpg"
              alt="Yianni's Hellenic Yiros storefront on Hindley Street, Adelaide"
              width={2048}
              height={877}
              className="aspect-[4/3] w-full object-cover sm:aspect-[21/9]"
            />
          </div>
        </ArchFrame>
        <div>
          <Image
            src="/images/medallion-512.png"
            alt="Yianni's Hellenic Yiros"
            width={512}
            height={512}
            className="h-28 w-28 drop-shadow-[0_14px_24px_rgba(15,39,71,0.25)]"
          />
          <h2 className="mt-6 font-display text-2xl font-semibold">{aboutCopy.eyebrow}</h2>
          <p className="mt-4 max-w-prose leading-relaxed text-ink/70">{aboutCopy.body}</p>
        </div>
      </div>

      <div className="mt-14 max-w-prose">
        <h2 className="font-display text-xl font-semibold text-cobalt-dark">
          Only on Hindley Street
        </h2>
        <p className="mt-3 leading-relaxed text-ink/70">
          This shop stands on its own. One kitchen, one spit, one set of recipes that have
          never left this address — and no plans to move them. What comes off the charcoal here
          is the work of the people who run this place, and nowhere else.
        </p>
        <p className="mt-4 leading-relaxed text-ink/70">
          It is why regulars still drive in from across town rather than settle for closer. The
          fire, the marinade and the hands doing the carving are not something you can post
          elsewhere and expect to taste the same. If you want this yiros, there is one place to
          find it: {fullAddress}.
        </p>
      </div>
    </div>
  );
}
