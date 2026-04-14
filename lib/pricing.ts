import pricingConfig from "@/lib/config/pricing.json";

const ADULT_PRICE_CENTS = 120000; // 1,200 EGP
const KIDS_PRICE_CENTS = 60000;   // 600 EGP
const HOLIDAY_MULTIPLIER = 1.25;  // +25%
const DISCOUNT_MULTIPLIER = 0.75; // -25%

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
  const multiplier =
    rateType === "holiday"
      ? HOLIDAY_MULTIPLIER
      : rateType === "discounted"
      ? DISCOUNT_MULTIPLIER
      : 1;

  const adultUnitCents = Math.round(ADULT_PRICE_CENTS * multiplier);
  const kidsUnitCents = Math.round(KIDS_PRICE_CENTS * multiplier);
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
