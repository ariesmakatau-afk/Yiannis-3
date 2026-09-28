import type { Metadata } from "next";
import { business, fullAddress } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-prose py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-cobalt-dark sm:text-4xl">
        Privacy Policy
      </h1>
      <div className="key-divider-ember mt-4 w-24 opacity-80" aria-hidden="true" />

      <div className="mt-8 space-y-8 text-ink/75">
        <p>
          Last updated: {new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}.
          This policy explains what information Yianni&rsquo;s on Hindley Street ({fullAddress})
          collects through this website, why, and what you can do about it.
        </p>

        <section>
          <h2 className="font-display text-xl font-semibold text-cobalt-dark">
            Information we collect
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Pickup orders.</strong> If you place a pickup order through the{" "}
              <code>/order</code> page, we collect your name, phone number, requested pickup
              time, and the items you order (including any order notes). This is sent directly
              to the shop so your order can be prepared — we don&rsquo;t process any payment
              online; you pay in-store when you collect your order.
            </li>
            <li>
              <strong>Contact details you send us.</strong> If you call, email, or message the
              shop (including via the phone number or email address on our{" "}
              <a href="/contact" className="text-cobalt underline underline-offset-4">
                Contact
              </a>{" "}
              page), we&rsquo;ll have whatever information you choose to share with us in that
              conversation or message.
            </li>
            <li>
              <strong>Website usage data.</strong> Like most websites, we may use Google
              Analytics (GA4) to understand how visitors use the site — pages viewed, general
              location (city-level, not precise), device type, and interactions such as clicking
              &ldquo;Order Online&rdquo; or &ldquo;Get Directions.&rdquo; This is aggregated,
              cookie-based analytics data; it is not used to personally identify you.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-cobalt-dark">
            How we use it
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>To prepare and fulfil the pickup order you placed.</li>
            <li>To contact you about an order if there&rsquo;s a problem (e.g. an item is unavailable).</li>
            <li>To respond to enquiries sent by phone, email, or social media.</li>
            <li>To understand how the website is used, so we can improve it.</li>
          </ul>
          <p className="mt-3">
            We do not sell your information, and we don&rsquo;t use it for marketing or
            advertising without your separate consent.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-cobalt-dark">
            Who we share it with
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Order notifications.</strong> Pickup order details are sent to a
              notification channel used internally by the shop (for example, a messaging or SMS
              service) so staff can see and prepare your order. That service only receives what&rsquo;s
              needed to fulfil the order.
            </li>
            <li>
              <strong>Uber Eats.</strong> If you order through Uber Eats instead of this
              website&rsquo;s pickup form, that order — and any information you provide for
              it — is handled under Uber Eats&rsquo; own privacy policy, not this one.
            </li>
            <li>
              <strong>Analytics providers.</strong> If Google Analytics is enabled, Google
              processes website usage data under its own privacy policy.
            </li>
            <li>We don&rsquo;t share your information with anyone else for their own marketing purposes.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-cobalt-dark">
            Cookies
          </h2>
          <p className="mt-3">
            This site may use cookies set by Google Analytics to distinguish visitors and
            measure site usage. You can block or delete these cookies through your browser
            settings at any time; the site will still work without them.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-cobalt-dark">
            Your rights &amp; contact
          </h2>
          <p className="mt-3">
            You can ask what information we hold about you, ask us to correct it, or ask us to
            delete it (for example, after an order is complete) by contacting us:
          </p>
          <ul className="mt-3 space-y-1">
            <li>
              Email:{" "}
              <a href={`mailto:${business.email}`} className="text-cobalt underline underline-offset-4">
                {business.email}
              </a>
            </li>
            <li>Phone: {business.phone}</li>
            <li>Post: {fullAddress}</li>
          </ul>
        </section>

        <p className="border-t border-ink/10 pt-6 text-xs text-ink/45">
          This policy is written in plain language to reflect what this website actually does.
          It has not been reviewed by a solicitor — we&rsquo;d recommend a quick legal review
          before relying on it, particularly if the shop&rsquo;s data-handling practices change
          (e.g. a new online payment provider or loyalty program is added).
        </p>
      </div>
    </div>
  );
}
