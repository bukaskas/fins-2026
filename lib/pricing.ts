import pricingConfig from "@/lib/config/pricing.json";

const ADULT_PRICE_CENTS = 150000;      // 1,500 EGP
const HOLIDAY_SURCHARGE_CENTS = 10000; // +100 EGP flat on holiday → 1,600 EGP total
const DISCOUNT_MULTIPLIER = 0.75;      // -25%

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

  let adultUnitCents: number;
  let kidsUnitCents: number;

  if (rateType === "holiday") {
    adultUnitCents = ADULT_PRICE_CENTS + HOLIDAY_SURCHARGE_CENTS;
  } else if (rateType === "discounted") {
    adultUnitCents = Math.round(ADULT_PRICE_CENTS * DISCOUNT_MULTIPLIER);
  } else {
    adultUnitCents = ADULT_PRICE_CENTS;
  }
  kidsUnitCents = Math.round(adultUnitCents * 0.5);
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

import { LessonType } from "@prisma/client";

export const LESSON_PRICES_EGP: Record<LessonType, number> = {
  PRIVATE: 22000,
  GROUP: 17000,
  FOIL: 15000,
  KIDS: 12000,
  EXTRA_PRIVATE: 10000,
  EXTRA_GROUP: 10000,
};

export const COMMISSION_RATE = 0.25;
