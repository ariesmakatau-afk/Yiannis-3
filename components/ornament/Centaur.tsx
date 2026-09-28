/**
 * The centaur from the shop's wallpaper, drawn as a black-figure silhouette
 * (as on a Greek vase): an archer, facing right, drawing a bow. It is drawn
 * in a 120 × 100 box and uses `currentColor`, so the wallpaper, the roundels
 * and anything else can tint it.
 */
export function CentaurFigure() {
  return (
    <g fill="currentColor">
      {/* Tail */}
      <path d="M24 48 C12 45 7 56 5 71 C11 63 16 57 24 55Z" />
      {/* Horse body */}
      <path d="M22 51 C22 43 33 40 48 41 L71 42 C78 42 81 48 81 54 C81 62 75 66 67 66 L31 66 C25 66 22 60 22 51Z" />
      {/* Hind legs */}
      <path d="M27 60 L19 78 L22 95 L27 95 L24 79 L32 63Z" />
      <path d="M35 63 L29 80 L33 96 L38 96 L34 80 L41 64Z" />
      {/* Fore legs, one raised mid-stride */}
      <path d="M62 63 L65 81 L60 96 L65 96 L70 81 L68 63Z" />
      <path d="M71 62 L80 74 L78 86 L82 86 L85 73 L76 60Z" />
      {/* Human torso rising from the withers */}
      <path d="M69 46 C68 36 70 28 75 22 L84 22 C87 29 85 37 80 46Z" />
      {/* Head, with a knot of hair */}
      <circle cx="80.5" cy="15" r="5.8" />
      <circle cx="76" cy="11" r="2.4" />
      {/* Bow arm, reaching forward */}
      <path d="M80 26 L99 22 L99 25.5 L81 30.5Z" />
      {/* Drawing arm, pulled back to the chest */}
      <path d="M78 27 L67 30 L67 32.5 L79 31.5Z" />
      {/* The bow and its string */}
      <path d="M97 8 Q108 23 97 38" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M97 8 L67 31 L97 38" fill="none" stroke="currentColor" strokeWidth="0.8" />
    </g>
  );
}

type CentaurMedallionProps = {
  className?: string;
};

/**
 * A roundel with a meander ring and the wallpaper's centaur in the centre,
 * for large, faint (5–12%) background watermarks.
 */
export default function CentaurMedallion({ className = "" }: CentaurMedallionProps) {
  const keys = 24;

  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={className} fill="none">
      <circle cx="100" cy="100" r="96" stroke="currentColor" strokeWidth="3" />
      <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1.5" />
      {/* A ring of meander steps between the two mouldings */}
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="square">
        {Array.from({ length: keys }).map((_, i) => (
          <path
            key={i}
            d="M97 7 h6 v6 h-3 v-3"
            transform={`rotate(${(i / keys) * 360} 100 100)`}
          />
        ))}
      </g>
      <g transform="translate(40 50)">
        <CentaurFigure />
      </g>
    </svg>
  );
}
