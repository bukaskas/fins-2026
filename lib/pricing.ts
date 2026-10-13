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

/**
 * Pharaoh Airstyle spectator pass: bean-bag seating, one flat price for adults
 * and children alike. Stored on the booking as `dayUseRateType` so a later
 * change to these figures cannot reprice a pass already sold, and so the rest
 * of the system can tell a spectator pass (paid in full online) from ordinary
 * day use (50% deposit).
 */
export const SPECTATOR_UNIT_PRICE_CENTS = 150000; // 1,500 EGP
export const SPECTATOR_RATE_TYPE = "spectator";

/** True for a booking sold at the spectator rate. */
export function isSpectatorRate(row: { dayUseRateType: string | null }): boolean {
  return row.dayUseRateType === SPECTATOR_RATE_TYPE;
}

/** The spectator rate as a day-use quote; `rateType` is only a display fallback. */
export function spectatorRate(dateKey: DateKey): DayUseRate {
  return {
    dateKey,
    adultUnitCents: SPECTATOR_UNIT_PRICE_CENTS,
    kidsUnitCents: SPECTATOR_UNIT_PRICE_CENTS,
    rateType: "regular",
    groupDiscount: null,
  };
}

/** The Booking columns for a spectator pass (the frozen rates plus the marker). */
export function spectatorSnapshot(): DayUseRateSnapshot {
  return {
    adultUnitPriceCents: SPECTATOR_UNIT_PRICE_CENTS,
    kidsUnitPriceCents: SPECTATOR_UNIT_PRICE_CENTS,
    dayUseRateType: SPECTATOR_RATE_TYPE,
    groupDiscountPerAdultCents: null,
    groupDiscountMinAdults: null,
  };
}

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

/**
 * Group discount terms: once a party has `minAdults` or more adults, every
 * adult pays `perAdultCents` less. Kids are never discounted.
 */
export interface GroupDiscount {
  perAdultCents: number;
  minAdults: number;
}

export interface DayUseRate {
  dateKey: DateKey;
  adultUnitCents: number;
  kidsUnitCents: number;
  rateType: RateType;
  /** The terms on offer for this date, whether or not a given party qualifies. */
  groupDiscount: GroupDiscount | null;
}

/** Everything that decides a party's price: a fresh quote or a booking's snapshot. */
export type UnitRates = Pick<
  DayUseRate,
  "adultUnitCents" | "kidsUnitCents" | "rateType" | "groupDiscount"
>;

/** The group discount the config offers on a date of this rate type, if any. */
export function groupDiscountFor(
  rateType: RateType,
  config: PricingConfig = pricingConfig,
): GroupDiscount | null {
  const discount = config.groupDiscount;
  const perAdultCents = discount?.perAdultCents[rateType] ?? 0;
  if (!discount || perAdultCents === 0) return null;
  return { perAdultCents, minAdults: discount.minAdults };
}

/**
 * The group discount across all rate types, for advertising it ("groups of
 * 5+ save 100–200 EGP per adult"). Null when no rate type offers one.
 */
export function getGroupDiscountSummary(config: PricingConfig = pricingConfig): {
  minAdults: number;
  minPerAdultCents: number;
  maxPerAdultCents: number;
} | null {
  const amounts = RATE_TYPES.map((t) => groupDiscountFor(t, config)?.perAdultCents ?? 0).filter(
    (cents) => cents > 0,
  );
  if (!config.groupDiscount || amounts.length === 0) return null;
  return {
    minAdults: config.groupDiscount.minAdults,
    minPerAdultCents: Math.min(...amounts),
    maxPerAdultCents: Math.max(...amounts),
  };
}

/** Whether a date falls on the configured weekend (Fri + Sat in Egypt). */
export function isWeekendDateKey(
  dateKey: DateKey,
  config: PricingConfig = pricingConfig,
): boolean {
  return config.weekendDays.includes(utcMidnightFromKey(dateKey).getUTCDay());
}

/**
 * The one Day Use price rule: an exact date override wins; otherwise a weekend
 * date takes the weekend adult price and label, any other date the weekday
 * price and label. Children pay `kidsRateMultiplier` of that same
 * date's adult price, rounded to whole EGP. The group discount on offer
 * follows the date's rate type.
 */
export function resolveDayUseRate(
  dateKey: DateKey,
  config: PricingConfig = pricingConfig,
): DayUseRate {
  const override = config.dateOverrides[dateKey];
  const weekend = isWeekendDateKey(dateKey, config);
  const baseCents = weekend ? config.weekendAdultPriceCents : config.adultPriceCents;
  const adultUnitCents = override?.adultPriceCents ?? baseCents;
  const rateType =
    override?.rateType ?? (weekend ? config.weekendRateType : config.weekdayRateType);
  return {
    dateKey,
    adultUnitCents,
    kidsUnitCents: toWholeEgp(adultUnitCents * config.kidsRateMultiplier),
    rateType,
    groupDiscount: groupDiscountFor(rateType, config),
  };
}

export interface PriceBreakdown {
  adultUnitCents: number;
  kidsUnitCents: number;
  /** Adults at the full unit price, before any group discount. */
  adultTotalCents: number;
  kidsTotalCents: number;
  /** The terms on offer, carried so a snapshot keeps them even when this
   *  party doesn't qualify yet. */
  groupDiscount: GroupDiscount | null;
  /** Amount actually taken off this party: 0 unless it qualifies. */
  groupDiscountCents: number;
  totalCents: number;
  rateType: RateType;
}

/** Whether a party of this many adults gets the group discount. */
export function qualifiesForGroupDiscount(
  discount: GroupDiscount | null | undefined,
  adults: number,
): discount is GroupDiscount {
  return !!discount && adults >= discount.minAdults;
}

/** Party arithmetic on already-decided unit rates — a fresh quote or a
 *  booking's snapshot, never a second place prices are worked out. */
export function priceFromUnitRates(
  rates: UnitRates,
  adults: number,
  kids: number,
): PriceBreakdown {
  const adultTotalCents = rates.adultUnitCents * adults;
  const kidsTotalCents = rates.kidsUnitCents * kids;
  const groupDiscountCents = qualifiesForGroupDiscount(rates.groupDiscount, adults)
    ? rates.groupDiscount.perAdultCents * adults
    : 0;
  return {
    adultUnitCents: rates.adultUnitCents,
    kidsUnitCents: rates.kidsUnitCents,
    adultTotalCents,
    kidsTotalCents,
    groupDiscount: rates.groupDiscount,
    groupDiscountCents,
    totalCents: adultTotalCents + kidsTotalCents - groupDiscountCents,
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
  /** Group discount terms at booking time, null when none was on offer.
   *  Stored even if the party didn't qualify, so a later party edit that
   *  crosses the threshold gets the terms the guest was offered. */
  groupDiscountPerAdultCents: number | null;
  groupDiscountMinAdults: number | null;
}

export function snapshotFromRate(rate: UnitRates): DayUseRateSnapshot {
  return {
    adultUnitPriceCents: rate.adultUnitCents,
    kidsUnitPriceCents: rate.kidsUnitCents,
    dayUseRateType: rate.rateType,
    groupDiscountPerAdultCents: rate.groupDiscount?.perAdultCents ?? null,
    groupDiscountMinAdults: rate.groupDiscount?.minAdults ?? null,
  };
}

/** The unit rates a booking was sold at, or null for an unsnapshotted legacy row. */
export function ratesFromSnapshot(row: DayUseRateSnapshot): UnitRates | null {
  if (row.adultUnitPriceCents === null || row.kidsUnitPriceCents === null) return null;
  const rateType = (RATE_TYPES as readonly string[]).includes(row.dayUseRateType ?? "")
    ? (row.dayUseRateType as RateType)
    : "regular";
  const groupDiscount =
    row.groupDiscountPerAdultCents && row.groupDiscountMinAdults
      ? { perAdultCents: row.groupDiscountPerAdultCents, minAdults: row.groupDiscountMinAdults }
      : null;
  return {
    adultUnitCents: row.adultUnitPriceCents,
    kidsUnitCents: row.kidsUnitPriceCents,
    rateType,
    groupDiscount,
  };
}

/** What the guest reviewed before pressing Request — checked against the server. */
export interface QuotedDayUseRates {
  adultUnitCents: number;
  kidsUnitCents: number;
  /** Absent from a bundle that predates group discounts: read as none. */
  groupDiscount?: GroupDiscount | null;
}

/** Whether two sets of group discount terms are the same offer. */
export function sameGroupDiscount(
  a: GroupDiscount | null | undefined,
  b: GroupDiscount | null | undefined,
): boolean {
  return (
    (a?.perAdultCents ?? 0) === (b?.perAdultCents ?? 0) &&
    (a?.minAdults ?? 0) === (b?.minAdults ?? 0)
  );
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
export function getDayUseRates(date: Date): UnitRates {
  const { adultUnitCents, kidsUnitCents, rateType, groupDiscount } = resolveDayUseRate(
    dateKeyFromUtcMidnight(date),
  );
  return { adultUnitCents, kidsUnitCents, rateType, groupDiscount };
}

/** The standing weekday and weekend rates, before any date override. */
export function getStandardDayUseRates(config: PricingConfig = pricingConfig): {
  weekday: { adultUnitCents: number; kidsUnitCents: number };
  weekend: { adultUnitCents: number; kidsUnitCents: number };
} {
  const rate = (adultUnitCents: number) => ({
    adultUnitCents,
    kidsUnitCents: toWholeEgp(adultUnitCents * config.kidsRateMultiplier),
  });
  return {
    weekday: rate(config.adultPriceCents),
    weekend: rate(config.weekendAdultPriceCents),
  };
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
