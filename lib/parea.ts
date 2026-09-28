// lib/parea.ts
//
// EVERYTHING ON THE /parea PAGE IS EDITED HERE, plus the promo strip that
// appears on the home page. You shouldn't need to open a page file to
// change a photo, a caption or this week's offer.
//
// To swap a photo: drop the new image into /public/images/parea/ and
// change the filename below. Same size and shape is easiest — square
// crops look tidiest in the grid.

export const pareaIntro = {
  word: "Parea",
  pronunciation: "pa-RE-a",
  meaning:
    "The table, not the food. Your people — the ones who know your order and hold a seat without being asked. English borrowed yiros and stopped there. It never took the word for who you eat it with.",
  body: "Ours has been turning up for four decades. Students at closing time, tradies at noon, families who drive past three other shops to get here. This page is for them.",
};

// ---------------------------------------------------------------------------
// The wall — customer photos
// ---------------------------------------------------------------------------
// Add or remove lines freely. An empty list is fine: the page shows an
// invitation instead of a broken grid.
//
// ALWAYS get the person's spoken permission before putting their face up.

export type PareaPhoto = {
  /** Path under /public — e.g. "/images/parea/kosta.jpg" */
  src: string;
  /** Shown under the photo. Keep it to a line or two. */
  caption: string;
  /** First name or nickname. Leave out if they'd rather not be named. */
  name?: string;
};

export const pareaPhotos: PareaPhoto[] = [
  // {
  //   src: "/images/parea/example.jpg",
  //   caption: "Every Friday since the nineties. Lamb, extra garlic.",
  //   name: "Kosta",
  // },
];

// ---------------------------------------------------------------------------
// The team — one photo, swapped whenever you like
// ---------------------------------------------------------------------------
// Set `src` to null to hide the section entirely until you have a photo.

export const teamPhoto: { src: string | null; caption: string } = {
  src: null,
  caption:
    "The same hands on the same spit, most days of the week. Say hello when you're in.",
};

// ---------------------------------------------------------------------------
// The current offer
// ---------------------------------------------------------------------------
// Shows as a full section on /parea AND as a one-line strip on the home
// page. Set `active: false` to pull it from both at once — no other edits
// needed.

export const promo = {
  active: true,
  /** Short version for the home page strip — keep it tight. */
  strip: "3 yiros on a Tue or Wed? Chips are on us.",
  eyebrow: "Tuesdays & Wednesdays",
  title: "Call Your Mate",
  body: "Order three yiros on a Tuesday or Wednesday and the chips are on us. Bring someone. Bring two. Nobody eats three yiros alone, and if you do, we won't ask.",
  finePrint: "Dine-in and takeaway. One per order. Tuesdays and Wednesdays.",
};
