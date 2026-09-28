type MapEmbedProps = {
  address: string;
  label: string;
  className?: string;
  minHeight?: string;
};

// Uses Google's keyless "output=embed" map — no Maps API key or billing
// required. If the client later gets a Google Maps API key and wants the
// richer JS API (custom markers, styling), swap the <iframe> src for a
// proper Maps Embed API URL (https://www.google.com/maps/embed/v1/place)
// with `key=${NEXT_PUBLIC_GOOGLE_MAPS_KEY}`.
export default function MapEmbed({
  address,
  label,
  className = "",
  minHeight = "280px",
}: MapEmbedProps) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <div
      className={`tile-card overflow-hidden ${className}`}
      style={{ minHeight }}
    >
      <iframe
        title={label}
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0, minHeight, display: "block" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
