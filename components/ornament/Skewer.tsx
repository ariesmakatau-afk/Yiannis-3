type SkewerProps = {
  className?: string;
};

/**
 * A vertical spit: pointed tip, a turned handle, and a coal glowing at the
 * foot. Used as the divider between the house numbers, so the stats band
 * reads as a row of skewers over the fire. Rod colour from `currentColor`;
 * the coal is always ember.
 */
export default function Skewer({ className = "" }: SkewerProps) {
  return (
    <svg
      viewBox="0 0 24 400"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="skewer-rod" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
          <stop offset="30%" stopColor="currentColor" stopOpacity="0.45" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.25" />
        </linearGradient>
        <radialGradient id="skewer-coal" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffd08a" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#e8783f" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#a43d24" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Tip */}
      <path d="M12 6 L14 30 H10 Z" fill="currentColor" opacity="0.5" />
      {/* Rod */}
      <rect x="11" y="28" width="2" height="330" fill="url(#skewer-rod)" />
      {/* Handle */}
      <rect x="8" y="356" width="8" height="4" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="9.5" y="360" width="5" height="14" rx="2" fill="currentColor" opacity="0.3" />
      {/* The coal under it */}
      <ellipse cx="12" cy="388" rx="12" ry="12" fill="url(#skewer-coal)" />
    </svg>
  );
}
