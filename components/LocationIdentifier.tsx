import { locationIdentifier } from "@/lib/content";

type Props = {
  variant?: "light" | "dark";
  className?: string;
};

// PROJECT_SPEC.md §2: this disambiguation is not optional. Multiple
// Yianni's locations exist in Adelaide — this block makes the Hindley
// Street CBD identity unmistakable wherever it appears.
export default function LocationIdentifier({ variant = "light", className = "" }: Props) {
  const isDark = variant === "dark";
  return (
    <div
      className={`border-l-2 border-cobalt py-3 pl-4 ${
        isDark ? "text-white" : "text-ink"
      } ${className}`}
    >
      <p className="font-display text-lg sm:text-xl">{locationIdentifier.line1}</p>
      <p
        className={`mt-1 text-sm ${isDark ? "text-white/70" : "text-ink/60"}`}
      >
        {locationIdentifier.line2}
      </p>
    </div>
  );
}
