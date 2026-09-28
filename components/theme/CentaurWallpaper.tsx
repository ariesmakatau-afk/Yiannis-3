import { CentaurFigure } from "@/components/ornament/Centaur";

type CentaurWallpaperProps = {
  /** Unique pattern id — each wallpaper on a page needs its own. */
  id: string;
  className?: string;
};

/**
 * The shop's centaur wallpaper as a repeating SVG fill: archers in
 * alternating rows, one row facing each way, between thin ruled bands.
 * Colour comes from `currentColor`, opacity from the parent, so the same
 * paper prints blue-on-white behind the page and white-on-night in the hero.
 */
export default function CentaurWallpaper({ id, className = "" }: CentaurWallpaperProps) {
  return (
    <svg aria-hidden="true" className={className} width="100%" height="100%">
      <defs>
        <pattern id={id} width="220" height="200" patternUnits="userSpaceOnUse">
          <g transform="translate(20 12) scale(0.62)">
            <CentaurFigure />
          </g>
          <g transform="translate(200 112) scale(-0.62 0.62)">
            <CentaurFigure />
          </g>
          {/* Ruled bands under each row, with a small key between */}
          <path d="M0 88 H220 M0 92 H220" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <path d="M0 188 H220 M0 192 H220" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <path
            d="M150 40 h8 v8 h-4 v-4 M40 140 h8 v8 h-4 v-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
