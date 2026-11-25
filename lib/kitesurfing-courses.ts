/**
 * Kitesurfing course facts, stated once.
 *
 * The hero, the course cards on /kitesurfing and the three course detail pages
 * all quote these figures. They used to be typed separately into each, which
 * is how a price drifts: lib/pricing.ts records the 750-vs-600 and
 * 1,600-vs-1,500 EGP contradictions that restated day-use prices produced.
 * Change a figure here and every page that shows it changes with it.
 *
 * These are advertised figures. Courses are booked and paid on the school app
 * (lib/booking-url.ts), which remains the authority on what a guest is charged.
 */

export type KiteCourseFacts = {
  name: string;
  /** How long the course takes, as a guest reads it ("2–3 days"). */
  length: string;
  groupPriceCents: number;
  privatePriceCents: number;
};

export const KITE_COURSES = {
  beginner: {
    name: "Beginner Course",
    length: "2–3 days",
    groupPriceCents: 2_200_000,
    privatePriceCents: 2_550_000,
  },
  intro: {
    name: "Intro Session",
    length: "2 hours",
    groupPriceCents: 550_000,
    privatePriceCents: 850_000,
  },
  refresher: {
    name: "Refresher Course",
    length: "2 hours",
    groupPriceCents: 550_000,
    privatePriceCents: 850_000,
  },
} as const satisfies Record<string, KiteCourseFacts>;

/** Beginner course water time, by format. */
export const BEGINNER_HOURS = { group: 8, private: 6 } as const;

/** Students per group lesson. */
export const GROUP_SIZE = { min: 2, max: 4 } as const;

export const GROUP_SIZE_LABEL = `${GROUP_SIZE.min}–${GROUP_SIZE.max} students`;

/**
 * The kite season, as months 1–12. Outside it the centre says winter "can be
 * good too" for guests already in Egypt (see GoodToKnow.tsx), so those months
 * are shown as possible rather than closed.
 */
export const KITE_SEASON = { firstMonth: 3, lastMonth: 12 } as const;

export function inKiteSeason(month: number): boolean {
  return month >= KITE_SEASON.firstMonth && month <= KITE_SEASON.lastMonth;
}

/** "22,000 EGP" */
export function formatCourseEGP(cents: number): string {
  return `${(cents / 100).toLocaleString("en-US")} EGP`;
}
