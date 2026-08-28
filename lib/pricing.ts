import pricingConfig from "@/lib/config/pricing.json";

const ADULT_PRICE_CENTS = 150000;      // 1,500 EGP
const HOLIDAY_SURCHARGE_CENTS = 10000; // +100 EGP flat on holiday → 1,600 EGP total
const DISCOUNT_MULTIPLIER = 0.75;      // -25%

// Kids (5–8) are a configured base rate, not a percentage of the adult rate.
// The 5–8 price is advertised as a flat number on /day-use, so it has to be the
// same number in both places — deriving it from the adult rate produced
// 750 EGP against an advertised 600 EGP.
const KIDS_PRICE_CENTS = pricingConfig.kidsPriceCents;

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
