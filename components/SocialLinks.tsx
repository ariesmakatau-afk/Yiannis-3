import { business } from "@/lib/content";

type SocialLinksProps = {
  /** "dark" for pale backgrounds, "light" for cobalt/footer backgrounds. */
  tone?: "dark" | "light";
  className?: string;
};

/**
 * Facebook and Instagram, with their actual marks. Previously these were
 * bare text that read as body copy rather than something clickable — a
 * pill, an icon and a hover state make the affordance obvious.
 */
export default function SocialLinks({ tone = "dark", className = "" }: SocialLinksProps) {
  const base =
    "group inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-150 active:scale-95";
  const skin =
    tone === "light"
      ? "border-white/30 text-white/90 hover:border-white/70 hover:bg-white/10"
      : "border-cobalt/25 text-cobalt-dark hover:border-cobalt hover:bg-cobalt/[0.06] hover:text-cobalt";

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <a
        href={business.facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} ${skin}`}
      >
        <IconFacebook />
        Facebook
        <ArrowOut />
      </a>
      <a
        href={business.instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} ${skin}`}
      >
        <IconInstagram />
        Instagram
        <ArrowOut />
      </a>
    </div>
  );
}

function ArrowOut() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="opacity-50 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:opacity-90"
    >
      <path
        d="M3 9L9 3M9 3H4.5M9 3v4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5.5"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle cx="12" cy="12" r="4.6" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="17.6" cy="6.4" r="1.35" fill="currentColor" />
    </svg>
  );
}
