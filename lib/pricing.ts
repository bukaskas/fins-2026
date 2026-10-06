import {
  RATE_TYPES,
  pricingConfig,
  type PricingConfig,
  type RateType,
} from "@/lib/pricing-config";
import {
  type DateKey,
  dateKeyFromUtcMidnight,
  utcMidnightFromKey,
} from "@/lib/date-keys";

export type { RateType } from "@/lib/pricing-config";

// Every day-use rate lives in lib/config/pricing.json and is resolved here, by
// both the advertised figures on /day-use, the booking calendar and the
// checkout calculation. Nothing on the guest path may hardcode a price:
// deriving or restating one produced a 750-vs-600 EGP contradiction between
// the ad and the checkout, and later a 1,600-vs-1,500 one on holiday dates.

export const PHARAOH_ADULT_PRICE_CENTS = 120000; // 1,200 EGP
export const PHARAOH_KIDS_PRICE_CENTS = 60000;   // 600 EGP
/** Kite community registrations: flat rate per person, paid on arrival. */
export const KITE_COMMUNITY_PRICE_CENTS = 80000;  // 800 EGP

/** Guest-facing names. Every Day Use surface uses these and only these. */
export const RATE_LABELS: Record<RateType, string> = {
  regular: "Regular",
  peak: "Peak",
  "best-value": "Best value",
};

/** Prices are quoted in whole EGP, so a half rate never lands on a stray piastre. */
function toWholeEgp(cents: number): number {
  return Math.round(cents / 100) * 100;
}

export interface DayUseRate {
  dateKey: DateKey;
  adultUnitCents: number;
  kidsUnitCents: number;
  rateType: RateType;
}

/**
 * The one Day Use price rule: an exact date override wins; any other date is
 * the regular adult price. Children pay `kidsRateMultiplier` of that same
 * date's adult price, rounded to whole EGP.
 */
export function resolveDayUseRate(
  dateKey: DateKey,
  config: PricingConfig = pricingConfig,
): DayUseRate {
  const override = config.dateOverrides[dateKey];
  const adultUnitCents = override?.adultPriceCents ?? config.adultPriceCents;
  return {
    dateKey,
    adultUnitCents,
    kidsUnitCents: toWholeEgp(adultUnitCents * config.kidsRateMultiplier),
    rateType: override?.rateType ?? "regular",
  };
}

export interface PriceBreakdown {
  adultUnitCents: number;
  kidsUnitCents: number;
  adultTotalCents: number;
  kidsTotalCents: number;
  totalCents: number;
  rateType: RateType;
}

/** Party arithmetic on already-decided unit rates — a fresh quote or a
 *  booking's snapshot, never a second place prices are worked out. */
export function priceFromUnitRates(
  rates: Pick<DayUseRate, "adultUnitCents" | "kidsUnitCents" | "rateType">,
  adults: number,
  kids: number,
): PriceBreakdown {
  const adultTotalCents = rates.adultUnitCents * adults;
  const kidsTotalCents = rates.kidsUnitCents * kids;
  return {
    adultUnitCents: rates.adultUnitCents,
    kidsUnitCents: rates.kidsUnitCents,
    adultTotalCents,
    kidsTotalCents,
    totalCents: adultTotalCents + kidsTotalCents,
    rateType: rates.rateType,
  };
}

/**
 * Current price for a party on a date. A `Date` here is a stored booking date
 * (UTC midnight); anything else must be converted with lib/date-keys first.
 */
export function calculateDayUsePrice(
  date: Date | DateKey,
  adults: number,
  kids: number,
): PriceBreakdown {
  const key = typeof date === "string" ? date : dateKeyFromUtcMidnight(date);
  return priceFromUnitRates(resolveDayUseRate(key), adults, kids);
}

/** The Booking columns that freeze a Day Use quote (see prisma/schema.prisma). */
export interface DayUseRateSnapshot {
  adultUnitPriceCents: number | null;
  kidsUnitPriceCents: number | null;
  dayUseRateType: string | null;
}

export function snapshotFromRate(
  rate: Pick<DayUseRate, "adultUnitCents" | "kidsUnitCents" | "rateType">,
): DayUseRateSnapshot {
  return {
    adultUnitPriceCents: rate.adultUnitCents,
    kidsUnitPriceCents: rate.kidsUnitCents,
    dayUseRateType: rate.rateType,
  };
}

/** The unit rates a booking was sold at, or null for an unsnapshotted legacy row. */
export function ratesFromSnapshot(
  row: DayUseRateSnapshot,
): Pick<DayUseRate, "adultUnitCents" | "kidsUnitCents" | "rateType"> | null {
  if (row.adultUnitPriceCents === null || row.kidsUnitPriceCents === null) return null;
  const rateType = (RATE_TYPES as readonly string[]).includes(row.dayUseRateType ?? "")
    ? (row.dayUseRateType as RateType)
    : "regular";
  return {
    adultUnitCents: row.adultUnitPriceCents,
    kidsUnitCents: row.kidsUnitPriceCents,
    rateType,
  };
}

/** What the guest reviewed before pressing Request — checked against the server. */
export interface QuotedDayUseRates {
  adultUnitCents: number;
  kidsUnitCents: number;
}

export function formatEGP(cents: number): string {
  return `${(cents / 100).toLocaleString("en-EG")} EGP`;
}

/** `1,500` — the compact figure a calendar cell has room for. */
export function formatEGPAmount(cents: number): string {
  return (cents / 100).toLocaleString("en-EG");
}

/**
 * Per-person day-use rates for one date. This is what /day-use advertises, so
 * the page never restates a number — a peak date shows the peak rate rather
 * than the regular one the guest would otherwise be quoted at checkout.
 */
export function getDayUseRates(date: Date): {
  adultUnitCents: number;
  kidsUnitCents: number;
  rateType: RateType;
} {
  const { adultUnitCents, kidsUnitCents, rateType } = resolveDayUseRate(
    dateKeyFromUtcMidnight(date),
  );
  return { adultUnitCents, kidsUnitCents, rateType };
}

/** Upcoming peak dates, so the page can name them instead of surprising the guest. */
export function getUpcomingPeakDates(
  from: Date,
  limit = 3,
  config: PricingConfig = pricingConfig,
): Date[] {
  const today = dateKeyFromUtcMidnight(from);
  return Object.entries(config.dateOverrides)
    .filter(([key, o]) => o.rateType === "peak" && key >= today)
    .map(([key]) => key)
    .sort()
    .slice(0, limit)
    .map(utcMidnightFromKey);
}

export function computeBookingTotalCents(
  service: string,
  date: Date,
  adults: number,
  kids: number,
): number | null {
  if (service === "day-use") {
    return calculateDayUsePrice(date, adults, kids).totalCents;
  }
  if (service === "pharaoh-airstyle") {
    return adults * PHARAOH_ADULT_PRICE_CENTS + kids * PHARAOH_KIDS_PRICE_CENTS;
  }
  return null;
}

/**
 * Recover the unit rates a legacy Day Use booking was charged from its stored
 * total, for the snapshot backfill. The party total strictly increases with
 * the adult price, so at most one whole-EGP adult price fits. Returns null
 * when none does — the row then stays unsnapshotted for staff review rather
 * than being given today's price.
 */
export function reconstructDayUseUnitRates(
  totalCents: number,
  adults: number,
  kids: number,
  kidsRateMultiplier: number = pricingConfig.kidsRateMultiplier,
): { adultUnitCents: number; kidsUnitCents: number } | null {
  if (!Number.isInteger(totalCents) || totalCents < 0 || adults < 1 || kids < 0) {
    return null;
  }
  const partyTotal = (adultUnitCents: number) =>
    adults * adultUnitCents + kids * toWholeEgp(adultUnitCents * kidsRateMultiplier);

  // Binary search over whole-EGP adult prices (steps of 100 cents).
  let lo = 0;
  let hi = Math.ceil(totalCents / adults / 100);
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const total = partyTotal(mid * 100);
    if (total === totalCents) {
      const adultUnitCents = mid * 100;
      return {
        adultUnitCents,
        kidsUnitCents: toWholeEgp(adultUnitCents * kidsRateMultiplier),
      };
    }
    if (total < totalCents) lo = mid + 1;
    else hi = mid - 1;
  }
  return null;
}
