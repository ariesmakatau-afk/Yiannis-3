import Skewer from "@/components/ornament/Skewer";
import CountUp from "@/components/CountUp";
import { shopStats } from "@/lib/content";

/**
 * The house stats. Deadpan rather than boastful — the joke is that a shop
 * this old has stopped counting most things and is proud of the numbers
 * that haven't moved. Skewers stand between the figures so the band reads
 * as a row of spits over the coals rather than four boxes.
 */
export default function StatsBand() {
  return (
    <div className="grid grid-cols-2 gap-y-10 lg:grid-cols-4">
      {shopStats.map((stat, i) => (
        <div
          key={stat.label}
          data-reveal
          style={{ "--reveal-delay": `${i * 120}ms` } as React.CSSProperties}
          className="relative px-4 text-center sm:px-6"
        >
          {/* Dividing skewer — not before the first item, and not at the
              start of a new row on the 2-up mobile grid. */}
          {i > 0 && (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-[-8px] left-0 w-[18px] -translate-x-1/2 text-ember-light ${
                i % 2 === 0 ? "hidden lg:block" : "block"
              }`}
            >
              <Skewer className="h-full w-full" />
            </div>
          )}

          <p className="stat-figure font-display text-4xl font-semibold leading-none text-white sm:text-6xl">
            <CountUp figure={stat.figure} />
          </p>
          <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-white/85">
            {stat.label}
          </p>
          <p className="mx-auto mt-1.5 max-w-[22ch] text-sm leading-snug text-white/55">
            {stat.aside}
          </p>
        </div>
      ))}
    </div>
  );
}
