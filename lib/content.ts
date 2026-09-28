// lib/content.ts
//
// Single source of truth for all real business data + copy.
// Everything here comes directly from CONTENT.md in the project spec.
// Anything not yet confirmed by the client is marked PLACEHOLDER and
// rendered as a visible placeholder in the UI — never guessed.

export const PLACEHOLDER = {
  domain: null as string | null, // e.g. "yiannisonhindley.com.au" — leading candidate, not locked in
  domainCandidate: "yiannisonhindley.com.au",
  googleBusinessProfileUrl: null as string | null,
  notifyChannel: null as "telegram" | "sms" | null,
};

export const business = {
  legalDisplayName: "Yianni's Yiros on Hindley Street",
  shortName: "Yianni's on Hindley Street",
  locality: "Adelaide CBD",
  history:
    "A yiros shop on this site for roughly 40 years. Yianni took it over and rebranded it as Yianni's Hellenic Yiros around 2002 — exact dates aren't documented.",
  address: {
    street: "270 Hindley Street",
    suburb: "Adelaide",
    state: "SA",
    postcode: "5000",
    country: "AU",
    confirmed: true,
  },
  phone: "+61 8 8212 5552",
  phoneHref: "tel:+61882125552",
  email: "yiannisyiros2020@gmail.com",
  facebookUrl: "https://www.facebook.com/share/19LY4HbBXJ/?mibextid=wwXIfr",
  instagramUrl: "https://www.instagram.com/yiannisyiroshindley",
  uberEatsUrl:
    "https://www.ubereats.com/au/store/yiannis-on-hindley/_NoeJbsUQAyXKfiOujUcfw",
};

export const fullAddress = `${business.address.street}, ${business.address.suburb} ${business.address.state} ${business.address.postcode}`;

export type HoursRow = { day: string; hours: string };

export const openingHours: HoursRow[] = [
  { day: "Monday", hours: "9:00 AM – 3:30 PM" },
  { day: "Tuesday", hours: "9:00 AM – 8:00 PM" },
  { day: "Wednesday", hours: "9:00 AM – 8:00 PM" },
  { day: "Thursday", hours: "9:00 AM – 8:00 PM" },
  { day: "Friday", hours: "9:00 AM – 10:30 PM" },
  { day: "Saturday", hours: "9:00 AM – 10:30 PM" },
  { day: "Sunday", hours: "9:00 AM – 8:00 PM" },
];

// Schema.org day codes + 24h times, for Restaurant structured data.
export const openingHoursSpecification = [
  { dayOfWeek: "Monday", opens: "09:00", closes: "15:30" },
  { dayOfWeek: "Tuesday", opens: "09:00", closes: "20:00" },
  { dayOfWeek: "Wednesday", opens: "09:00", closes: "20:00" },
  { dayOfWeek: "Thursday", opens: "09:00", closes: "20:00" },
  { dayOfWeek: "Friday", opens: "09:00", closes: "22:30" },
  { dayOfWeek: "Saturday", opens: "09:00", closes: "22:30" },
  { dayOfWeek: "Sunday", opens: "09:00", closes: "20:00" },
];

export const heroCopy = {
  headline: "The Charcoal Has Never Gone Out",
  subheading:
    "Lamb, chicken and pork, turning over real charcoal and carved straight into warm pita. Three meats, one fire, one corner of Hindley Street — and four decades of Adelaide who know exactly where to find it.",
};

export const locationIdentifier = {
  line1: "Yianni's on Hindley Street — you're in the right place.",
  line2: `${fullAddress} — Adelaide CBD`,
};

export const aboutCopy = {
  eyebrow: "Three meats. One fire. No shortcuts.",
  body: "There has been a yiros shop on this corner for roughly forty years. It wasn't always ours. Yianni took it on around 2002, stripped it back, and rebuilt it around one conviction: charcoal or nothing. Everything since has been an exercise in refusing to change. The menu is three meats — lamb, chicken, pork — because a fourth would be showing off. The spit turns over real charcoal, because gas is faster and worse. The garlic sauce is made the way it has always been made, and no, we won't tell you. Hindley Street has reinvented itself a dozen times around us. We have moved the furniture twice. What we serve is not complicated, and that is the entire point: simple food is far harder to hide behind. Four decades of Adelaide have eaten here and come back, which we take as the only review that counts.",
};

export const whyYiannis = [
  { title: "Real charcoal", detail: "Gas is quicker. Charcoal is better." },
  { title: "Three meats", detail: "Lamb, chicken, pork. Have one or mix them." },
  { title: "Carved to order", detail: "Off the spit and into your hands." },
  { title: "Generous by default", detail: "Nobody has ever left here still hungry." },
  { title: "Four decades on Hindley", detail: "Same corner. Same fire. Same method." },
];

// Deadpan house numbers. The joke is that the figures worth quoting are
// the ones that haven't changed — kept dry rather than zany.
export const shopStats = [
  {
    figure: "3",
    label: "Meats, total",
    aside: "Lamb, chicken, pork. There is no fourth. People ask.",
  },
  {
    figure: "0",
    label: "Recipe changes",
    aside: "It was right the first time.",
  },
  {
    figure: "40-ish",
    label: "Years on this corner",
    aside: "Nobody kept the paperwork. The fire kept going.",
  },
  {
    figure: "0%",
    label: "Garlic restraint",
    aside: "You will know. Tomorrow, your colleagues will know.",
  },
];

// ---------------------------------------------------------------------------
// Menu — SUPERSEDED
// ---------------------------------------------------------------------------
// The flat category/item menu below has been replaced by the structured,
// option-driven model in `lib/menu.ts`, which both /menu and /order now use.
// It is kept here only as a record of the client's original confirmed price
// list (including the per-product Lamb surcharges of +$2/+$3/+$4 and the
// full drinks list) in case anything needs to be cross-checked. Nothing in
// the app imports it — delete it once the new menu is signed off.

export type MenuItem = {
  id: string;
  name: string;
  price: string;
  description?: string;
};

export type MenuCategory = {
  id: string;
  title: string;
  note?: string;
  items: MenuItem[];
};

export const menu: MenuCategory[] = [
  {
    id: "yiros",
    title: "Yiros",
    note: '"The Lot" (standard build): lettuce, tomato, onion, garlic sauce & lemon juice.',
    items: [
      {
        id: "yiros-full",
        name: "Yiros",
        price: "$20.00",
        description: "Choice of Lamb, Chicken, Pork, or Combo (Lamb +$2)",
      },
      {
        id: "yiros-mini",
        name: "Mini Yiros",
        price: "$15.00",
        description: "Same choices as above",
      },
      {
        id: "veggie-roll",
        name: "Veggie Roll",
        price: "$8.00",
        description: "Lettuce, cheese, tomato, onion, garlic sauce, lemon juice, salt & pepper",
      },
      {
        id: "falafel-yiros",
        name: "Falafel Yiros",
        price: "$15.00",
        description:
          "Crispy falafels, lettuce, cheese, tomato, onion, garlic sauce, lemon juice, salt & pepper",
      },
    ],
  },
  {
    id: "ab-pack",
    title: "AB Pack",
    note: "Chips, meat of choice & up to 3 sauces.",
    items: [
      { id: "ab-small", name: "Small", price: "$23", description: "Lamb +$2" },
      { id: "ab-large", name: "Large", price: "$28", description: "Lamb +$2" },
    ],
  },
  {
    id: "chips",
    title: "Chips",
    items: [
      { id: "chips-small", name: "Small", price: "$9" },
      { id: "chips-large", name: "Large", price: "$12" },
      { id: "chips-family", name: "Family", price: "$20" },
    ],
  },
  {
    id: "platters",
    title: "Dine-In Platters",
    note: "Meat of choice, salad, pita bread, garlic sauce & lemon.",
    items: [
      { id: "platter-1", name: "Platter for 1", price: "$35", description: "Lamb +$3" },
      { id: "platter-2", name: "Platter for 2", price: "$58", description: "Lamb +$4" },
    ],
  },
  {
    id: "takeaway-packs",
    title: "Takeaway Packs",
    items: [
      {
        id: "yiros-pack",
        name: "Yiros Pack",
        price: "$18",
        description: "Half meat, half salad & sauce. Lamb +$2. Add pita bread +$2",
      },
      {
        id: "small-meat-pack",
        name: "Small Meat Pack",
        price: "$28",
        description:
          "Lamb / Chicken / Pork / Combo. Lamb +$2. Served with garlic sauce & lemon juice",
      },
      {
        id: "meat-pack",
        name: "Meat Pack",
        price: "$35",
        description:
          "Lamb / Chicken / Pork / Combo. Lamb +$3. Served with garlic sauce & lemon juice",
      },
      {
        id: "salad-pack",
        name: "Salad Pack",
        price: "$5",
        description: "Lettuce, onion & tomato, lemon & olive oil dressing",
      },
    ],
  },
  {
    id: "garlic-sauce",
    title: "Garlic Sauce Tubs",
    items: [
      { id: "garlic-xs", name: "X-Small", price: "$1" },
      { id: "garlic-s", name: "Small", price: "$2" },
      { id: "garlic-m", name: "Medium", price: "$3.50" },
      { id: "garlic-l", name: "Large", price: "$5" },
    ],
  },
  {
    id: "extras",
    title: "Extras",
    items: [
      { id: "extra-meat", name: "Extra Meat", price: "$6.00" },
      { id: "extra-cheese", name: "Cheese", price: "$1.50" },
      { id: "extra-chips-in-yiros", name: "Chips in Yiros", price: "$1.50" },
      { id: "extra-cooked-onion", name: "Cooked Onion", price: "$1.00" },
      { id: "extra-pita", name: "Pita Bread", price: "$2.00" },
      { id: "extra-falafel", name: "Falafel", price: "$2.00" },
      { id: "extra-salad-ab", name: "Salad on AB Pack", price: "$3.00" },
    ],
  },
  {
    id: "sauces",
    title: "Extra Sauces",
    note: "+$0.50 each.",
    items: [
      { id: "sauce-garlic", name: "Garlic", price: "+$0.50" },
      { id: "sauce-mustard", name: "Mustard", price: "+$0.50" },
      { id: "sauce-peri-peri", name: "Peri Peri", price: "+$0.50" },
      { id: "sauce-nandos-peri", name: "Nando's Peri-Peri", price: "+$0.50" },
      { id: "sauce-aioli", name: "Aioli", price: "+$0.50" },
      { id: "sauce-mayo", name: "Mayonnaise", price: "+$0.50" },
      { id: "sauce-hot-chilli", name: "Hot Chilli", price: "+$0.50" },
      { id: "sauce-sweet-chilli", name: "Sweet Chilli", price: "+$0.50" },
      { id: "sauce-tomato", name: "Tomato", price: "+$0.50" },
      { id: "sauce-bbq", name: "BBQ", price: "+$0.50" },
      { id: "sauce-tabasco", name: "Tabasco", price: "+$0.50" },
    ],
  },
  {
    id: "drinks",
    title: "Drinks",
    items: [
      {
        id: "greek-coffee",
        name: "Greek Coffee",
        price: "$3.00",
        description: "Short black coffee, with 1 sugar",
      },
    ],
  },
  {
    id: "drinks-soft",
    title: "Soft Drinks — 600ml",
    items: [
      { id: "sd-coke", name: "Coke", price: "$5.00" },
      { id: "sd-coke-zero", name: "Coke Zero", price: "$5.00" },
      { id: "sd-coke-vanilla", name: "Coke Vanilla", price: "$5.00" },
      { id: "sd-coke-vanilla-zero", name: "Coke Vanilla Zero", price: "$5.00" },
      { id: "sd-fanta", name: "Fanta", price: "$5.00" },
      { id: "sd-fanta-raspberry", name: "Fanta Raspberry", price: "$5.00" },
      { id: "sd-passiona", name: "Passiona", price: "$5.00" },
      { id: "sd-sprite", name: "Sprite", price: "$5.00" },
      { id: "sd-sprite-zero", name: "Sprite Zero", price: "$5.00" },
    ],
  },
  {
    id: "drinks-powerade",
    title: "Powerade",
    items: [
      { id: "pw-mountain-berry", name: "Mountain Berry Blast", price: "$5.50" },
      { id: "pw-grape", name: "Grape", price: "$5.50" },
      { id: "pw-lemon-lime", name: "Lemon Lime", price: "$5.50" },
      { id: "pw-gold-rush", name: "Gold Rush", price: "$5.50" },
      { id: "pw-berry-ice", name: "Berry Ice", price: "$5.50" },
    ],
  },
  {
    id: "drinks-water",
    title: "Water",
    items: [
      { id: "w-mf-600", name: "Mount Franklin", price: "$4.00", description: "600ml" },
      {
        id: "w-mf-sparkling",
        name: "Mount Franklin Lightly Sparkling",
        price: "$4.00",
      },
      {
        id: "w-mf-sparkling-lime",
        name: "Mount Franklin Lightly Sparkling Lime",
        price: "$4.00",
      },
      { id: "w-pump", name: "Pump", price: "$5.50", description: "750ml" },
      { id: "w-pump-berry", name: "Pump Berry", price: "$5.50" },
    ],
  },
  {
    id: "drinks-juice-milk",
    title: "Juices, Milk & Iced Coffee",
    note: "Nippy's range.",
    items: [
      { id: "j-orange", name: "Orange Juice", price: "$5.00" },
      { id: "j-orange-unsweetened", name: "Unsweetened Orange Juice", price: "$5.00" },
      { id: "j-orange-mango", name: "Orange & Mango", price: "$5.00" },
      { id: "j-breakfast", name: "Breakfast Juice", price: "$5.00" },
      { id: "j-apple", name: "Apple Juice", price: "$5.00" },
      { id: "j-apple-blackcurrant", name: "Apple Blackcurrant", price: "$5.00" },
      { id: "j-choc-milk", name: "Chocolate Milk", price: "$5.00" },
      { id: "j-iced-coffee", name: "Iced Coffee", price: "$5.00" },
    ],
  },
  {
    id: "drinks-cans",
    title: "Cans — 330ml",
    items: [
      { id: "can-coke", name: "Coke", price: "$3.50" },
      { id: "can-coke-zero", name: "Coke Zero", price: "$3.50" },
      { id: "can-fanta", name: "Fanta", price: "$3.50" },
      { id: "can-fanta-lemon", name: "Fanta Lemon", price: "$3.50" },
      { id: "can-sprite", name: "Sprite", price: "$3.50" },
      { id: "can-kirks-ginger-beer", name: "Kirks Ginger Beer", price: "$3.50" },
      { id: "can-kirks-creaming-soda", name: "Kirks Creaming Soda", price: "$3.50" },
      { id: "can-pepsi-max", name: "Pepsi Max", price: "$3.50" },
    ],
  },
  {
    id: "drinks-energy",
    title: "Energy Drinks",
    items: [
      { id: "energy-monster-white-zero", name: "Monster Energy White Zero", price: "$5.50" },
      { id: "energy-monster-mango-loco", name: "Monster Energy Mango Loco", price: "$5.50" },
    ],
  },
];

// Categories offered in the on-site pickup order builder (/order).
// Deliberately excludes dine-in-only platters, since Path B is pickup.
export const orderableCategoryIds = [
  "yiros",
  "ab-pack",
  "chips",
  "takeaway-packs",
  "garlic-sauce",
  "extras",
  "sauces",
  "drinks",
  "drinks-soft",
  "drinks-powerade",
  "drinks-water",
  "drinks-juice-milk",
  "drinks-cans",
  "drinks-energy",
];

export const localSeoThemes = [
  "Adelaide CBD",
  "Hindley Street",
  "Greek food Adelaide",
  "yiros Adelaide",
  "Greek yiros Adelaide",
  "late-night food Adelaide",
  "Adelaide city food",
  "30 years Adelaide",
];

export const siteMeta = {
  titleDefault: "Yianni's on Hindley Street | Charcoal Greek Yiros, Adelaide",
  description:
    "Lamb, chicken and pork over real charcoal, carved to order on Hindley Street. Yiros, packs, platters and plates in Adelaide CBD — dine in, take away, or order for pickup.",
};
