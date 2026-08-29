import pricingConfig from "@/lib/config/pricing.json";

// Every day-use rate lives in lib/config/pricing.json and is read from there by
// both the advertised figures on /day-use and the checkout calculation. Nothing
// on the guest path may hardcode a price: deriving or restating one produced a
// 750-vs-600 EGP contradiction between the ad and the checkout, and later a
// 1,600-vs-1,500 one on holiday dates.
export const ADULT_PRICE_CENTS = pricingConfig.adultPriceCents;
export const KIDS_PRICE_CENTS = pricingConfig.kidsPriceCents;
const HOLIDAY_SURCHARGE_CENTS = pricingConfig.holidaySurchargeCents; // flat, on holiday dates
const DISCOUNT_MULTIPLIER = pricingConfig.discountMultiplier;

export const PHARAOH_ADULT_PRICE_CENTS = 120000; // 1,200 EGP
export const PHARAOH_KIDS_PRICE_CENTS = 60000;   // 600 EGP

export type RateType = "standard" | "holiday" | "discounted";

function toDateString(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function getDateRate(date: Date): RateType {
  const key = toDateString(date);
  const holidays = pricingConfig.holidayDates as string[];
  const discounted = pricingConfig.discountedDates as string[];
  const isHoliday = holidays.includes(key);
  const isDiscounted = discounted.includes(key);

  // Discount wins when a date appears in both lists
  if (isDiscounted) return "discounted";
  if (isHoliday) return "holiday";
  return "standard";
}

export interface PriceBreakdown {
  adultUnitCents: number;
  kidsUnitCents: number;
  adultTotalCents: number;
  kidsTotalCents: number;
  totalCents: number;
  rateType: RateType;
}

export function calculateDayUsePrice(
  date: Date,
  adults: number,
  kids: number
): PriceBreakdown {
  const rateType = getDateRate(date);

  // Both rates get the same treatment so a holiday or discounted day reads
  // consistently across the party.
  const applyRate = (baseCents: number) => {
    if (rateType === "holiday") return baseCents + HOLIDAY_SURCHARGE_CENTS;
    if (rateType === "discounted") return Math.round(baseCents * DISCOUNT_MULTIPLIER);
    return baseCents;
  };

  const adultUnitCents = applyRate(ADULT_PRICE_CENTS);
  const kidsUnitCents = applyRate(KIDS_PRICE_CENTS);
  const adultTotalCents = adultUnitCents * adults;
  const kidsTotalCents = kidsUnitCents * kids;

  return {
    adultUnitCents,
    kidsUnitCents,
    adultTotalCents,
    kidsTotalCents,
    totalCents: adultTotalCents + kidsTotalCents,
    rateType,
  };
}

export function formatEGP(cents: number): string {
  return `${(cents / 100).toLocaleString("en-EG")} EGP`;
}

/**
 * Per-person day-use rates for one date. This is what /day-use advertises, so
 * the page never restates a number — a holiday date shows the holiday rate
 * rather than the standard one the guest would otherwise be quoted at checkout.
 */
export function getDayUseRates(date: Date): {
  adultUnitCents: number;
  kidsUnitCents: number;
  rateType: RateType;
} {
  const { adultUnitCents, kidsUnitCents, rateType } = calculateDayUsePrice(date, 1, 1);
  return { adultUnitCents, kidsUnitCents, rateType };
}

/** Upcoming holiday dates, so the page can name them instead of surprising the guest. */
export function getUpcomingHolidayDates(from: Date, limit = 3): Date[] {
  const today = toDateString(from);
  return (pricingConfig.holidayDates as string[])
    .filter((d) => d >= today)
    .sort()
    .slice(0, limit)
    .map((d) => new Date(`${d}T00:00:00.000Z`));
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
