import type { Metadata } from "next";
import SocialLinks from "@/components/SocialLinks";
import { fullAddress } from "@/lib/content";
import { isConfigured } from "@/lib/supabase";
import { listEvents, websitePosts } from "@/lib/social/store";
import type { ShopEvent, SocialPost } from "@/lib/social/types";

export const metadata: Metadata = {
  title: "What's On",
  description:
    "Events, specials and news from Yianni's on Hindley Street, Adelaide CBD.",
};

// Posts and events change through the admin, not deploys — re-check each minute.
export const revalidate = 60;

const TZ = "Australia/Adelaide";

function when(e: ShopEvent): string {
  const start = new Date(e.starts_at);
  const day = start.toLocaleDateString("en-AU", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
  const time = (d: Date) => d.toLocaleTimeString("en-AU", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
  return `${day} · ${time(start)}${e.ends_at ? ` – ${time(new Date(e.ends_at))}` : ""}`;
}

/** Captions end with a line of hashtags — fine on Instagram, noise on a web page. */
function withoutHashtags(caption: string): string {
  return caption
    .split("\n")
    .filter((line) => !/^\s*(#\S+\s*)+$/.test(line))
    .join("\n")
    .trim();
}

export default async function WhatsOnPage() {
  let events: ShopEvent[] = [];
  let posts: SocialPost[] = [];
  if (isConfigured()) {
    // A database hiccup should leave an empty page, not an error page.
    [events, posts] = await Promise.all([
      listEvents({ fromIso: new Date().toISOString(), publicOnly: true }).catch(() => []),
      websitePosts().catch(() => []),
    ]);
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-cobalt-dark sm:text-4xl">What&rsquo;s On</h1>
      <div className="key-divider-ember mt-4 w-24 opacity-80" aria-hidden="true" />

      <section aria-labelledby="events-heading" className="mt-10">
        <h2 id="events-heading" className="font-display text-2xl font-semibold text-cobalt-dark">
          Coming up
        </h2>
        {events.length === 0 ? (
          <p className="mt-3 max-w-prose text-ink/65">
            Nothing special on the calendar right now — just the charcoal, same as always.
            Follow along for the next one.
          </p>
        ) : (
          <ul className="mt-5 grid gap-5 sm:grid-cols-2">
            {events.map((e) => (
              <li key={e.id} className="tile-card overflow-hidden bg-white">
                {e.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.image_url} alt="" className="aspect-[16/9] w-full object-cover" />
                )}
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ember-deep">{when(e)}</p>
                  <h3 className="mt-1.5 font-display text-xl font-semibold text-cobalt-dark">{e.title}</h3>
                  {e.description && (
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/75">{e.description}</p>
                  )}
                  <p className="mt-3 text-xs text-ink/50">{e.location ?? fullAddress}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="news-heading" className="mt-14">
        <h2 id="news-heading" className="font-display text-2xl font-semibold text-cobalt-dark">
          From the shop
        </h2>
        {posts.length === 0 ? (
          <p className="mt-3 max-w-prose text-ink/65">News from the grill will show up here.</p>
        ) : (
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li key={p.id} className="tile-card overflow-hidden bg-white">
                {p.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt="" className="aspect-square w-full object-cover" />
                )}
                <div className="p-5">
                  <p className="text-xs text-ink/50">
                    {new Date(p.scheduled_for).toLocaleDateString("en-AU", {
                      timeZone: TZ,
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-semibold text-cobalt-dark">{p.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/75">
                    {withoutHashtags(p.caption)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-14">
        <p className="text-sm font-semibold text-cobalt-dark">Follow us for the day-to-day</p>
        <SocialLinks className="mt-3" />
      </div>
    </div>
  );
}
