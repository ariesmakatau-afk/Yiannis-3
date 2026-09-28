import Image from "next/image";
import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";
import StatsBand from "@/components/StatsBand";
import TrackedLink from "@/components/TrackedLink";
import TrackedAnchor from "@/components/TrackedAnchor";
import { business, whyYiannis } from "@/lib/content";
import { promo } from "@/lib/parea";

const featuredFood = [
  {
    label: "Yiros",
    blurb: "Off the spit, into warm pita. Lamb, chicken, pork.",
    image: "/images/food-yiros.jpg",
  },
  {
    label: "Packs & Platters",
    blurb: "Same meat, more of it, room to share.",
    image: "/images/food-platters.jpg",
  },
  {
    label: "AB Packs",
    blurb: "Chips underneath. Sauce over everything.",
    image: "/images/food-chips.jpg",
  },
  {
    label: "Greek Coffee",
    blurb: "Short, black, one sugar. As it should be.",
    image: "/images/food-drinks.jpg",
  },
];

const featuredReviews = [
  {
    quote:
      "An institution for a long time. Charcoal-roasted spit meat — best yiros in town. Highly recommend the pork and lamb, no lettuce, extra garlic sauce and onion.",
    author: "brianhissy",
    date: "April 2022",
  },
  {
    quote:
      "Lamb yiros were sensational and fully loaded with so much meat. Super delicious — the only ones as nice were when travelling around Greece.",
    author: "David Maddison",
    date: "February 2025",
  },
  {
    quote:
      "Awesome yiros, flavoured over the charcoal grill. Best I've had without a doubt. Got the lot and so worth it — good value even for the mini. Service was pretty quick considering the crowd.",
    author: "Andrew Jones",
    date: "January 2025",
  },
];

export default function HomePage() {
  return (
    <>
      {/* HERO — a full-bleed platter photo under an olive wash, copy set
          left: small spaced kicker, big serif name, one line, two buttons. */}
      <section className="hero-photo">
        <Image
          src="/images/food-platters.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="hero-photo__img"
        />
        <div aria-hidden="true" className="hero-photo__wash" />

        <div className="container-page flex min-h-[70svh] items-center py-20 sm:min-h-[560px] sm:py-24">
          <div className="max-w-md">
            <p
              className="hero-rise text-[11px] font-medium uppercase tracking-[0.3em] text-white/75"
              style={{ "--rise-delay": "0ms" } as React.CSSProperties}
            >
              Hindley Street, Adelaide
            </p>
            <h1
              className="hero-rise hero-title mt-5 font-display text-5xl font-normal leading-[1.05] text-white sm:text-6xl"
              style={{ "--rise-delay": "120ms" } as React.CSSProperties}
            >
              Yianni&rsquo;s Hellenic Yiros
            </h1>
            <p
              className="hero-rise mt-6 text-sm leading-relaxed text-white/85 sm:text-[15px]"
              style={{ "--rise-delay": "240ms" } as React.CSSProperties}
            >
              Charcoal yiros made fresh every day. Order online for pickup, or come in
              and eat with us on Hindley Street.
            </p>
            <div
              className="hero-rise mt-8 flex flex-wrap gap-3"
              style={{ "--rise-delay": "360ms" } as React.CSSProperties}
            >
              <TrackedLink
                href="/order"
                event={{ name: "order_online_click", path: "pickup" }}
                className="btn-coal"
              >
                Order Online
              </TrackedLink>
              <Link href="/location" className="btn-glass">
                Find Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PROMO STRIP — slim, high-contrast, one line */}
      {promo.active && (
        <Link
          href="/parea"
          className="group block border-y border-cobalt/15 bg-porcelain transition-colors hover:bg-porcelain-deep"
        >
          <div className="container-page flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 py-2.5 text-center">
            <span className="text-sm font-bold uppercase tracking-wide text-cobalt-dark">
              {promo.title}
            </span>
            <span className="text-sm text-ink/70">{promo.strip}</span>
            <span
              aria-hidden="true"
              className="text-sm text-cobalt transition-transform group-hover:translate-x-0.5"
            >
              &rarr;
            </span>
          </div>
        </Link>
      )}

      {/* FEATURED FOOD */}
      <section id="featured" className="veil-white scroll-mt-16 py-16 sm:py-24">
        <div className="container-page">
          <div data-reveal className="text-center">
            <p className="eyebrow-spark">What we serve</p>
            <h2 className="mt-3 font-display text-4xl text-cobalt-dark sm:text-5xl">
              Lamb, Chicken, Pork
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-7 lg:grid-cols-4">
            {featuredFood.map((item, i) => (
              <div
                key={item.label}
                data-reveal
                style={{ "--reveal-delay": `${i * 110}ms` } as React.CSSProperties}
                className="food-card group"
              >
                <div className="grill-ledge">
                  <div className="food-card__frame">
                    <Image
                      src={item.image}
                      alt={item.label}
                      width={600}
                      height={600}
                      className="food-card__img aspect-square w-full object-cover"
                    />
                  </div>
                </div>
                <p className="mt-4 font-display text-lg font-semibold text-cobalt-dark">
                  {item.label}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink/60">{item.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOUSE NUMBERS — over the coals, skewers between the stats */}
      <section className="coal-bed relative bg-char py-16 sm:py-24">
        <div className="container-page relative">
          <div data-reveal className="text-center">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ember-light">
              The house numbers
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-5xl">
              Four Decades, Briefly Summarised
            </h2>
          </div>
          <div className="mt-12">
            <StatsBand />
          </div>
        </div>
      </section>

      {/* WHY — porcelain wash, ember accents */}
      <section className="veil-porcelain border-y border-cobalt/10 py-16 sm:py-24">
        <div className="container-page">
          <div data-reveal>
            <p className="eyebrow-spark">Why it&rsquo;s lasted</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-cobalt-dark sm:text-5xl">
              The Short Version
            </h2>
          </div>
          <ul className="mt-9 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {whyYiannis.map((reason, i) => (
              <li
                key={reason.title}
                data-reveal
                style={{ "--reveal-delay": `${(i % 3) * 110}ms` } as React.CSSProperties}
                className="why-item border-t border-ember/40 pt-4"
              >
                <p className="font-display text-base font-semibold text-cobalt-dark">
                  {reason.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink/60">{reason.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* MENU PREVIEW */}
      <section className="veil-white py-16 sm:py-20">
        <div
          data-reveal
          className="container-page flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="eyebrow-spark">The whole list</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-cobalt-dark sm:text-4xl">
              The Whole Menu, Three Meats Deep
            </h2>
            <p className="mt-2 max-w-md text-ink/60">
              Pick your meat, pick how it&rsquo;s served, add what you want. That&rsquo;s it.
            </p>
          </div>
          <Link href="/menu" className="btn-porcelain shrink-0">
            View Full Menu
          </Link>
        </div>
      </section>

      {/* REVIEWS + SOCIAL — one compact band instead of two tall ones */}
      <section className="veil-porcelain border-y border-cobalt/10 py-14 sm:py-20">
        <div className="container-page">
          <div data-reveal className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div>
              <p className="eyebrow-spark">In their words</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-cobalt-dark sm:text-4xl">
                What Adelaide Says
              </h2>
            </div>
            <a
              href={business.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-cobalt underline underline-offset-4 hover:text-cobalt-dark"
            >
              Read more reviews
            </a>
          </div>

          {/* Quotes as bas-relief lines, not cards — far less vertical room */}
          <ul className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-3">
            {featuredReviews.map((review, i) => (
              <li
                key={review.author}
                data-reveal
                style={{ "--reveal-delay": `${i * 120}ms` } as React.CSSProperties}
                className="review-quote border-t border-ember/40 pt-3.5"
              >
                <p className="text-sm leading-relaxed text-ink/70 sm:text-base">
                  &ldquo;{review.quote}&rdquo;
                </p>
                <p className="mt-2 text-xs font-semibold text-cobalt-dark">
                  <span className="mr-1.5 tracking-wide text-ember" aria-label="5 out of 5">
                    &#9733;&#9733;&#9733;&#9733;&#9733;
                  </span>
                  {review.author}
                  <span className="ml-1.5 font-normal text-ink/45">{review.date}</span>
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t border-cobalt/10 pt-6">
            <SocialLinks />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="coal-bed relative overflow-hidden bg-cobalt py-20 text-center text-white sm:py-28">
        <div data-reveal className="container-page relative">
          <p className="font-script text-3xl italic text-ember-light">Yamas!</p>
          <h2 className="hero-title mt-1 font-display text-3xl font-semibold sm:text-6xl">
            The Spit&rsquo;s Already Turning
          </h2>
          <div className="key-divider-ember mx-auto mt-6 w-28 opacity-70" aria-hidden="true" />
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <TrackedLink
              href="/order"
              event={{ name: "order_online_click", path: "pickup" }}
              className="btn-coal"
            >
              Order Online
            </TrackedLink>
            <TrackedAnchor
              href={business.phoneHref}
              event={{ name: "phone_click" }}
              className="btn-glass"
            >
              Call {business.phone}
            </TrackedAnchor>
          </div>
        </div>
      </section>
    </>
  );
}
