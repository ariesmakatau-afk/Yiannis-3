import type { Metadata } from "next";
import Link from "next/link";
import CentaurMedallion from "@/components/ornament/Centaur";
import ArchFrame from "@/components/ornament/ArchFrame";
import { pareaIntro, pareaPhotos, promo, teamPhoto } from "@/lib/parea";
import { getContent } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Parea Mas",
  description:
    "Our people and our regulars — four decades of Adelaide on Hindley Street at Yianni's Hellenic Yiros.",
};

// Re-check the uploaded photo every 60s so a new upload appears without a
// redeploy, while still letting the page be cached in between.
export const revalidate = 60;

export default async function PareaPage() {
  // Uploaded photo wins; the file in lib/parea.ts is the fallback for
  // anyone running without a database configured.
  const uploaded = await getContent("team_photo_url");
  const teamSrc = uploaded ?? teamPhoto.src;

  // Uploaded wall photos win; the list in lib/parea.ts is the fallback for
  // anyone running without a database configured. Both sources are
  // normalised to one shape here so the render below has a single type.
  type WallPhoto = { key: string; src: string; caption: string; name?: string };

  let wall: WallPhoto[] = [];
  try {
    const parsed: unknown = JSON.parse((await getContent("parea_photos")) ?? "[]");
    if (Array.isArray(parsed)) {
      wall = parsed
        .filter(
          (p): p is { id: string; url: string; caption: string; name?: string } =>
            Boolean(p) && typeof p.url === "string" && typeof p.caption === "string"
        )
        .map((p) => ({ key: p.id, src: p.url, caption: p.caption, name: p.name }));
    }
  } catch {
    wall = [];
  }

  const photos: WallPhoto[] =
    wall.length > 0
      ? wall
      : pareaPhotos.map((p) => ({
          key: p.src,
          src: p.src,
          caption: p.caption,
          name: p.name,
        }));

  return (
    <>
      {/* INTRO — the word, then what it means */}
      <section className="hero-wall relative overflow-hidden">
        <CentaurMedallion className="pointer-events-none absolute left-1/2 top-0 h-[380px] w-[380px] -translate-x-1/2 text-cobalt opacity-[0.07] sm:h-[480px] sm:w-[480px]" />

        <div className="container-page relative py-14 sm:py-20">
          <ArchFrame tone="dark">
            <div className="text-center">
              <p className="eyebrow-spark">Greek, untranslatable</p>
              <h1 className="mt-4 font-display text-[2.4rem] font-semibold leading-none text-cobalt-dark sm:text-6xl">
                {pareaIntro.word} Mas
              </h1>
              <p className="mt-2.5 font-body text-sm uppercase tracking-[0.2em] text-cobalt/60">
                {pareaIntro.pronunciation} &middot; our parea
              </p>
              <div
                className="key-divider-ember mx-auto mt-6 w-28 opacity-80"
                aria-hidden="true"
              />
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink/70 sm:text-lg">
                {pareaIntro.meaning}
              </p>
              <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ink/60">
                {pareaIntro.body}
              </p>
            </div>
          </ArchFrame>
        </div>
      </section>


      {/* THE WALL — customers */}
      <section className="veil-white py-16 sm:py-20">
        <div className="container-page">
          <p className="eyebrow-spark">The wall</p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-cobalt-dark sm:text-3xl">
            What Keeps Yianni&rsquo;s Going
          </h2>

          {photos.length > 0 ? (
            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo) => (
                <figure key={photo.key} className="grill-ledge overflow-hidden rounded-sm bg-white">
                  {/* Plain <img>: uploaded photos live on a Supabase URL
                      chosen at runtime, so next/image would need remote-host
                      config for no real gain here. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt={photo.name ? `${photo.name} at Yianni's` : "A regular at Yianni's"}
                    className="aspect-square w-full object-cover"
                  />
                  <figcaption className="px-4 py-3.5">
                    <p className="text-sm leading-relaxed text-ink/70">{photo.caption}</p>
                    {photo.name && (
                      <p className="mt-1.5 font-display text-sm font-semibold text-cobalt-dark">
                        {photo.name}
                      </p>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="tile-card mt-8 p-8 text-center sm:p-12">
              <p className="mx-auto max-w-md leading-relaxed text-ink/70">
                This wall is going up soon. If you&rsquo;ve been coming here long enough that we
                know your order before you say it, expect to be asked.
              </p>
              <p className="mt-3 text-sm text-ink/50">
                Photos go up with permission, never without.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* THE TEAM — one photo, swapped whenever */}
      {teamSrc && (
        <section className="veil-porcelain border-y border-cobalt/10 py-16 sm:py-20">
          <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
            <ArchFrame tone="dark">
              <div className="grill-ledge overflow-hidden rounded-sm">
                {/* Plain <img>: the source may be a Supabase URL chosen at
                    runtime, so next/image would need remote-host config. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={teamSrc}
                  alt="The team at Yianni's on Hindley Street"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </ArchFrame>

            <div>
              <p className="eyebrow-spark">Behind the counter</p>
              <h2 className="mt-3 font-display text-2xl font-semibold text-cobalt-dark sm:text-3xl">
                The Ones Turning the Spit
              </h2>
              <p className="mt-4 max-w-prose leading-relaxed text-ink/70">
                {teamPhoto.caption}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* THE OFFER */}
      {promo.active && (
        <section className="coal-bed relative overflow-hidden bg-char pb-32 pt-16 text-white sm:pb-36 sm:pt-20">
          <CentaurMedallion className="pointer-events-none absolute right-0 top-1/2 h-[320px] w-[320px] -translate-y-1/2 translate-x-1/3 text-ember-light opacity-[0.12]" />
          <div className="container-page relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ember-light">
                {promo.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                {promo.title}
              </h2>
              <div
                className="key-divider-ember mt-5 w-24 opacity-70"
                aria-hidden="true"
              />
              <p className="mt-5 max-w-xl leading-relaxed text-white/75">{promo.body}</p>
              <p className="mt-4 text-sm text-white/45">{promo.finePrint}</p>
            </div>
            <Link href="/order" className="btn-coal shrink-0">
              Order Now
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
