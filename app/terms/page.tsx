import type { Metadata } from "next";
import { business, fullAddress } from "@/lib/content";

export const metadata: Metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <div className="container-page max-w-prose py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-cobalt-dark sm:text-4xl">
        Terms of Use
      </h1>
      <div className="key-divider-ember mt-4 w-24 opacity-80" aria-hidden="true" />

      <div className="mt-8 space-y-8 text-ink/75">
        <p>
          Last updated: {new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}.
          These terms cover use of this website and pickup orders placed through it. By using
          this site or placing a pickup order, you agree to the terms below.
        </p>

        <section>
          <h2 className="font-display text-xl font-semibold text-cobalt-dark">
            Pickup orders
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Orders placed through <code>/order</code> are <strong>pay-in-store only</strong> —
              no payment is taken or processed on this website. You pay when you collect your
              order at 270 Hindley Street.
            </li>
            <li>
              Submitting an order is a request, not a confirmed booking — the shop may contact
              you by phone if an item is unavailable, if the requested pickup time doesn&rsquo;t
              work during busy periods, or to confirm details.
            </li>
            <li>
              Menu items, prices, and availability shown on this site are set by the shop and
              may change without notice; the price you pay in-store is the current price on the
              day.
            </li>
            <li>
              To cancel or change an order after submitting it, please call the shop directly on{" "}
              {business.phone}.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-cobalt-dark">
            Uber Eats orders
          </h2>
          <p className="mt-3">
            The &ldquo;Order on Uber Eats&rdquo; link on this site takes you to Uber Eats&rsquo;
            own platform. Orders placed there — including payment, delivery, and any disputes —
            are governed entirely by Uber Eats&rsquo; own terms of service, not these terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-cobalt-dark">
            Website content
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              The Yianni&rsquo;s on Hindley Street name, logo, and photos on this site belong to
              the business and may not be reused without permission.
            </li>
            <li>
              We try to keep information on this site (hours, menu, prices, address) accurate
              and current, but we can&rsquo;t guarantee it&rsquo;s error-free at every moment —
              if in doubt, call the shop on {business.phone} to confirm before visiting.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-cobalt-dark">
            Liability
          </h2>
          <p className="mt-3">
            To the extent permitted by Australian law, Yianni&rsquo;s on Hindley Street is not
            liable for indirect or consequential loss arising from use of this website (for
            example, a delayed order notification due to a technical fault). Nothing in these
            terms limits any rights you have under the Australian Consumer Law that cannot be
            excluded.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-cobalt-dark">
            Governing law
          </h2>
          <p className="mt-3">
            These terms are governed by the laws of South Australia, Australia.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-cobalt-dark">
            Contact
          </h2>
          <ul className="mt-3 space-y-1">
            <li>
              Email:{" "}
              <a href={`mailto:${business.email}`} className="text-cobalt underline underline-offset-4">
                {business.email}
              </a>
            </li>
            <li>Phone: {business.phone}</li>
            <li>Address: {fullAddress}</li>
          </ul>
        </section>

        <p className="border-t border-ink/10 pt-6 text-xs text-ink/45">
          Written in plain language to reflect how this site and its pickup-order flow actually
          work. It has not been reviewed by a solicitor — worth a quick legal check before
          launch, especially if online payment is added later.
        </p>
      </div>
    </div>
  );
}
