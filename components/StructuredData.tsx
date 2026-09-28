import { business, fullAddress, openingHoursSpecification, PLACEHOLDER } from "@/lib/content";

// TECHNICAL_REQUIREMENTS.md §4: Restaurant schema (JSON-LD).
// Site URL and geo coordinates are left out (not marked as confirmed) rather
// than guessed — add them once the domain and Google Business Profile are
// finalized.
export default function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: business.shortName,
    servesCuisine: "Greek",
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.street,
      addressLocality: business.address.suburb,
      addressRegion: business.address.state,
      postalCode: business.address.postcode,
      addressCountry: business.address.country,
    },
    telephone: business.phone,
    email: business.email,
    menu: PLACEHOLDER.domain ? `${PLACEHOLDER.domain}/menu` : "/menu",
    openingHoursSpecification: openingHoursSpecification.map((row) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: row.dayOfWeek,
      opens: row.opens,
      closes: row.closes,
    })),
    sameAs: [business.facebookUrl, business.instagramUrl],
    priceRange: "$$",
    description: `${business.shortName} — Greek yiros, plates and chips at ${fullAddress}.`,
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
