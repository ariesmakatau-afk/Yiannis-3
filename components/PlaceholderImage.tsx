type PlaceholderImageProps = {
  label: string;
  className?: string;
  aspect?: "square" | "video" | "portrait" | "wide";
};

const aspectClass: Record<NonNullable<PlaceholderImageProps["aspect"]>, string> = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  wide: "aspect-[21/9]",
};

// Clearly-labelled placeholder used everywhere a real photo is expected.
// Per BRAND_GUIDELINES.md / CLAUDE.md: never substitute stock or
// AI-generated imagery — this stays visible until real assets ship.
export default function PlaceholderImage({
  label,
  className = "",
  aspect = "square",
}: PlaceholderImageProps) {
  return (
    <div
      role="img"
      aria-label={`Placeholder: ${label} — photo pending`}
      className={`veil-porcelain flex items-center justify-center rounded-sm border border-dashed border-cobalt/25 ${aspectClass[aspect]} ${className}`}
    >
      <span className="px-4 text-center text-xs font-medium uppercase tracking-[0.12em] text-cobalt-dark/45">
        Photo: {label} — pending
      </span>
    </div>
  );
}
