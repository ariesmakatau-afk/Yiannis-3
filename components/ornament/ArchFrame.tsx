type ArchFrameProps = {
  children: React.ReactNode;
  className?: string;
  /** Tone of the arch line. "light" for dark sections, "dark" for pale ones. */
  tone?: "light" | "dark";
};

/**
 * A blue-and-white Cycladic arch with content standing in the opening,
 * like the doorways painted on the shop. The crown carries an ember
 * keystone; the base sits on a threshold step. The opening is washed
 * white so the centaur wallpaper behind never fights the content.
 *
 * The arch scales with its content (the crown is a percentage of the
 * height, capped), so it works around a hero headline or a single photo.
 * The side gutters only open up from `sm`, so on a phone the arch is drawn
 * without stealing width from what it frames.
 */
export default function ArchFrame({ children, className = "", tone = "dark" }: ArchFrameProps) {
  const line = tone === "light" ? "text-white" : "text-cobalt-dark";

  return (
    <div className={`relative ${className}`}>
      <div aria-hidden="true" className={`arch-frame__opening pointer-events-none ${line}`} />

      <div className="relative px-3 pb-8 pt-14 sm:px-[64px] sm:pt-16 lg:px-[84px]">
        {children}
      </div>

      <div aria-hidden="true" className={`arch-frame__step pointer-events-none ${line}`} />
    </div>
  );
}
