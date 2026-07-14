/**
 * The 10 Agent FERPA tracks (real, canonical names) plus Track 0 (the free
 * on-ramp). Section trailers do NOT exist yet — every entry renders as a
 * "trailer coming" placeholder card. `trailerUrl` is null now; drop a URL in
 * later and the card upgrades to a player with zero other changes.
 *
 * CANON: THE FOG IS NOT A CHARACTER. The only rogue that may be referenced is
 * THE BROKER (silhouette only). No invented villains, no invented lore.
 */
export type Track = {
  /** Display number. Track 0 is the "start here" on-ramp. */
  no: number;
  code: string;
  title: string;
  /** Plain-language, honest one-liner. No lore fabrication. */
  blurb: string;
  /** null until a real trailer video is produced. */
  trailerUrl: string | null;
};

export const TRACK_ZERO: Track = {
  no: 0,
  code: 'DPA-101',
  title: 'DPA 101',
  blurb: 'Start here. The free on-ramp: what a data privacy agreement is, and why it matters before anyone presses play.',
  trailerUrl: null,
};

export const TRACKS: Track[] = [
  {
    no: 1,
    code: 'T1',
    title: 'FERPA Fundamentals',
    blurb: 'The base layer. What FERPA actually covers, what an education record is, and where the lines sit.',
    trailerUrl: null,
  },
  {
    no: 2,
    code: 'T2',
    title: 'Special Education, Dual Enrollment & Vulnerable Populations',
    blurb: 'The records that carry the most weight and the least room for error.',
    trailerUrl: null,
  },
  {
    no: 3,
    code: 'T3',
    title: 'AI and EdTech Risk',
    blurb: 'Where student data goes when a "free" tool gets loose in the building.',
    trailerUrl: null,
  },
  {
    no: 4,
    code: 'T4',
    title: 'Vendor and Procurement',
    blurb: 'The paperwork trail: agreements, exhibits, and the questions to ask before you sign.',
    trailerUrl: null,
  },
  {
    no: 5,
    code: 'T5',
    title: 'Security and NIST',
    blurb: 'The controls behind the promises. What "secure" is supposed to mean.',
    trailerUrl: null,
  },
  {
    no: 6,
    code: 'T6',
    title: 'People in the Building',
    blurb: 'The human decisions that make or break a privacy program day to day.',
    trailerUrl: null,
  },
  {
    no: 7,
    code: 'T7',
    title: 'District Communications',
    blurb: 'Saying the true thing clearly, to parents, boards, and staff.',
    trailerUrl: null,
  },
  {
    no: 8,
    code: 'T8',
    title: 'Laws and Compliance',
    blurb: 'The wider statute landscape around FERPA, and how the pieces fit.',
    trailerUrl: null,
  },
  {
    no: 9,
    code: 'T9',
    title: 'Seasonal',
    blurb: 'The privacy moments that arrive on the calendar, every year.',
    trailerUrl: null,
  },
  {
    no: 10,
    code: 'T10',
    title: 'The Human Layer',
    blurb: 'The through-line: privacy is a set of choices people make, not a checkbox.',
    trailerUrl: null,
  },
];

/**
 * The only three produced pieces, ever — Hub Intro, Ep-F1, Ep-F2.
 * Gated episodes are CARDS, NOT players. Clicking navigates to the Agency apex.
 * Truth only: "3 produced, more coming." No inflated counts.
 */
export type GatedEpisode = {
  code: string;
  title: string;
  track: string;
  /** Short, honest teaser. No fabricated plot. */
  teaser: string;
};

export const GATED_EPISODES: GatedEpisode[] = [
  {
    code: 'EP-F1',
    title: 'Case File F1',
    track: 'FERPA Fundamentals',
    teaser: 'The first declassified case. Watch it inside the Agency.',
  },
  {
    code: 'EP-F2',
    title: 'Case File F2',
    track: 'FERPA Fundamentals',
    teaser: 'A silhouette moves through the record room. Watch it inside the Agency.',
  },
];

/** Honest production status line. Do NOT inflate. */
export const PRODUCTION_STATUS = {
  produced: 3, // Hub Intro + Ep-F1 + Ep-F2
  label: '3 produced, more coming',
};
