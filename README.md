# Yianni's on Hindley Street — Website

Next.js + Tailwind build, per the project spec (`PROJECT_SPEC.md`, `BRAND_GUIDELINES.md`,
`SITE_STRUCTURE.md`, `CONTENT.md`, `TECHNICAL_REQUIREMENTS.md` — not included in this folder,
see the original spec package).

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in real values as they become available
npm run dev
```

Open `http://localhost:3000`.

With no `.env.local` values set, the `/order` pickup flow still works end to end — orders are
logged to the terminal instead of sent to Telegram/SMS (see `lib/notifyOrder.ts`).

## What's built

- Home, Menu, Order (Uber Eats link + pickup order builder), About, Location, Contact
- Shared header/footer, mobile bottom nav, location-disambiguation component
- Pickup order API route (`app/api/order/route.ts`) with a swappable notification module
- `Restaurant` JSON-LD structured data, per-page metadata, GA4 event tracking helper
- Accessible: skip link, visible focus states, semantic landmarks, alt text on all placeholders

## Outstanding before launch

These are flagged as `[PLACEHOLDER]` in the code (search for that string) and mostly live in
`lib/content.ts`:

- [x] **Telegram bot token** — supplied, set in `.env.local`
- [x] **Telegram chat ID** — supplied, set in `.env.local`
- [ ] **Domain name** — currently unset; update `PLACEHOLDER.domain` in `lib/content.ts` once
      registered, and add it to `StructuredData.tsx`'s `menu` field and `public/robots.txt`
- [ ] **Logo files** — header currently renders as text ("Yianni's / on Hindley Street")
- [ ] **Food & interior photography** — every photo is a labelled grey placeholder
      (`components/PlaceholderImage.tsx`)
- [ ] **Full drinks menu** — only Greek Coffee is confirmed
- [ ] **Full extra-sauces list** — one or two names cut off in the source photo
- [ ] **Confirm street address** — 270 Hindley Street, Adelaide SA 5000 (not re-confirmed)
- [ ] **Google Business Profile link** — for reviews widget accuracy and structured data
- [ ] **Featured reviews** — homepage review cards are placeholders
- [ ] **Privacy Policy / Terms copy** — placeholder pages only, no real legal text supplied
- [ ] **Real embedded map** — currently a labelled placeholder box on Home/Location/Contact
- [ ] **GA4 property ID** — set `NEXT_PUBLIC_GA_ID` once created

## Notes on the ordering system

Two genuinely separate paths, per spec — do not merge them:

- **Uber Eats** — plain external link, no backend, no site-side menu duplication.
- **Pickup** — built from the site's own menu, pay-in-store only. No payment processing exists
  or should be added to this path.
