import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calculateDayUsePrice,
  getUpcomingPeakDates,
  priceFromUnitRates,
  reconstructDayUseUnitRates,
  resolveDayUseRate,
} from "@/lib/pricing";
import { parsePricingConfig, type PricingConfig } from "@/lib/pricing-config";
import {
  dateKeyFromLocalCalendar,
  dateKeyFromUtcMidnight,
  dateKeyInCairo,
  getDayUseBookingWindow,
  isDateKey,
  isWithinDayUseBookingWindow,
  localCalendarDateFromKey,
  utcMidnightFromKey,
} from "@/lib/date-keys";

const config: PricingConfig = parsePricingConfig({
  adultPriceCents: 150000,
  kidsRateMultiplier: 0.5,
  dateOverrides: {
    "2026-10-11": { adultPriceCents: 170000, rateType: "peak" },
    "2026-10-18": { adultPriceCents: 125000, rateType: "best-value" },
    "2026-10-25": { adultPriceCents: 150000, rateType: "regular" },
    "2026-11-01": { adultPriceCents: 100100, rateType: "best-value" },
  },
});

describe("resolveDayUseRate", () => {
  it("falls back to the regular adult price on an unlisted date", () => {
    expect(resolveDayUseRate("2026-10-12", config)).toEqual({
      dateKey: "2026-10-12",
      adultUnitCents: 150000,
      kidsUnitCents: 75000,
      rateType: "regular",
    });
  });

  it("uses an exact peak override as the price, not as a surcharge", () => {
    const rate = resolveDayUseRate("2026-10-11", config);
    expect(rate.adultUnitCents).toBe(170000);
    expect(rate.kidsUnitCents).toBe(85000);
    expect(rate.rateType).toBe("peak");
  });

  it("uses an exact best-value override as the price, not as a multiplier", () => {
    const rate = resolveDayUseRate("2026-10-18", config);
    expect(rate.adultUnitCents).toBe(125000);
    expect(rate.kidsUnitCents).toBe(62500);
    expect(rate.rateType).toBe("best-value");
  });

  it("carries explicit regular metadata on an override", () => {
    expect(resolveDayUseRate("2026-10-25", config).rateType).toBe("regular");
  });

  it("rounds the derived child price to whole EGP", () => {
    // 1,001 EGP adult → 500.5 EGP child → 501 EGP (Math.round, half up).
    const rate = resolveDayUseRate("2026-11-01", config);
    expect(rate.adultUnitCents).toBe(100100);
    expect(rate.kidsUnitCents).toBe(50100);
    expect(rate.kidsUnitCents % 100).toBe(0);
  });
});

describe("party pricing", () => {
  it("multiplies unit rates by the party", () => {
    const p = priceFromUnitRates(
      { adultUnitCents: 170000, kidsUnitCents: 85000, rateType: "peak" },
      2,
      1,
    );
    expect(p).toEqual({
      adultUnitCents: 170000,
      kidsUnitCents: 85000,
      adultTotalCents: 340000,
      kidsTotalCents: 85000,
      totalCents: 425000,
      rateType: "peak",
    });
  });

  it("prices a stored UTC-midnight date and its key identically", () => {
    const byDate = calculateDayUsePrice(utcMidnightFromKey("2026-10-12"), 2, 1);
    const byKey = calculateDayUsePrice("2026-10-12", 2, 1);
    expect(byDate).toEqual(byKey);
    expect(byKey.totalCents).toBe(375000);
  });
});

describe("pricing config validation", () => {
  const base = { adultPriceCents: 150000, kidsRateMultiplier: 0.5 };

  it("rejects a date that does not exist", () => {
    expect(() =>
      parsePricingConfig({
        ...base,
        dateOverrides: { "2026-02-30": { adultPriceCents: 150000, rateType: "peak" } },
      }),
    ).toThrow(/YYYY-MM-DD/);
  });

  it("rejects a badly written date", () => {
    expect(() =>
      parsePricingConfig({
        ...base,
        dateOverrides: { "11/10/2026": { adultPriceCents: 150000, rateType: "peak" } },
      }),
    ).toThrow(/YYYY-MM-DD/);
  });

  it("rejects negative, fractional and part-EGP prices", () => {
    for (const adultPriceCents of [-100, 1500.5, 150050]) {
      expect(() =>
        parsePricingConfig({
          ...base,
          dateOverrides: { "2026-10-11": { adultPriceCents, rateType: "peak" } },
        }),
      ).toThrow(/pricing\.json is invalid/);
    }
  });

  it("rejects an unknown rate type", () => {
    expect(() =>
      parsePricingConfig({
        ...base,
        dateOverrides: { "2026-10-11": { adultPriceCents: 150000, rateType: "holiday" } },
      }),
    ).toThrow(/rateType/);
  });

  it("rejects leftover legacy fields instead of ignoring them", () => {
    expect(() =>
      parsePricingConfig({ ...base, dateOverrides: {}, holidayDates: ["2026-10-11"] }),
    ).toThrow(/pricing\.json is invalid/);
  });

  it("accepts the committed config", async () => {
    const { pricingConfig } = await import("@/lib/pricing-config");
    expect(pricingConfig.adultPriceCents).toBeGreaterThan(0);
  });
});

describe("date keys", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("validates real calendar days only", () => {
    expect(isDateKey("2028-02-29")).toBe(true);
    expect(isDateKey("2026-02-29")).toBe(false);
    expect(isDateKey("2026-1-01")).toBe(false);
  });

  it("round-trips stored UTC midnights", () => {
    expect(dateKeyFromUtcMidnight(utcMidnightFromKey("2026-10-11"))).toBe("2026-10-11");
  });

  it("reads a DayPicker local midnight as the day the guest saw", () => {
    // In Cairo (UTC+3) local midnight on 11 Oct is 21:00 UTC on 10 Oct; the
    // UTC reading would silently price the previous day.
    const cell = localCalendarDateFromKey("2026-10-11");
    expect(dateKeyFromLocalCalendar(cell)).toBe("2026-10-11");
  });

  it("keeps the displayed day in a browser east of UTC (Cairo)", () => {
    const cairoMidnight = new Date("2026-10-10T21:00:00.000Z"); // 00:00 11 Oct in Cairo (EEST)
    expect(dateKeyFromUtcMidnight(cairoMidnight)).toBe("2026-10-10"); // the bug
    expect(dateKeyInCairo(cairoMidnight)).toBe("2026-10-11");
  });

  it("keeps the displayed day in a browser west of UTC", () => {
    // Local midnight on 11 Oct in New York is 04:00 UTC on 11 Oct, and a late
    // evening there is already tomorrow in UTC.
    const lateEveningNewYork = new Date("2026-10-11T03:30:00.000Z"); // 23:30 10 Oct EDT
    expect(dateKeyInCairo(lateEveningNewYork)).toBe("2026-10-11");
    expect(dateKeyFromUtcMidnight(lateEveningNewYork)).toBe("2026-10-11");
  });

  it("uses Cairo's day around Cairo midnight", () => {
    expect(dateKeyInCairo(new Date("2026-10-10T20:59:59.000Z"))).toBe("2026-10-10");
    expect(dateKeyInCairo(new Date("2026-10-10T21:00:00.000Z"))).toBe("2026-10-11");
    // Winter time (EET, UTC+2).
    expect(dateKeyInCairo(new Date("2026-12-31T21:59:59.000Z"))).toBe("2026-12-31");
    expect(dateKeyInCairo(new Date("2026-12-31T22:00:00.000Z"))).toBe("2027-01-01");
  });
});

describe("booking window", () => {
  const now = new Date("2026-09-30T10:00:00.000Z");

  it("runs from Cairo today to the same day six months later", () => {
    expect(getDayUseBookingWindow(now)).toEqual({
      firstKey: "2026-09-30",
      lastKey: "2027-03-30",
    });
  });

  it("clamps a month-end start to the shorter month", () => {
    expect(getDayUseBookingWindow(new Date("2026-08-31T10:00:00.000Z")).lastKey).toBe(
      "2027-02-28",
    );
  });

  it("includes both ends and nothing outside them", () => {
    expect(isWithinDayUseBookingWindow("2026-09-29", now)).toBe(false);
    expect(isWithinDayUseBookingWindow("2026-09-30", now)).toBe(true);
    expect(isWithinDayUseBookingWindow("2027-03-30", now)).toBe(true);
    expect(isWithinDayUseBookingWindow("2027-03-31", now)).toBe(false);
  });
});

describe("upcoming peak dates", () => {
  it("lists only future peak overrides in date order", () => {
    const dates = getUpcomingPeakDates(utcMidnightFromKey("2026-10-01"), 3, config);
    expect(dates.map(dateKeyFromUtcMidnight)).toEqual(["2026-10-11"]);
  });
});

describe("reconstructDayUseUnitRates", () => {
  it("recovers adult-only totals", () => {
    expect(reconstructDayUseUnitRates(300000, 2, 0)).toEqual({
      adultUnitCents: 150000,
      kidsUnitCents: 75000,
    });
  });

  it("recovers mixed-party totals, including the old holiday rate", () => {
    expect(reconstructDayUseUnitRates(400000, 2, 1)).toEqual({
      adultUnitCents: 160000,
      kidsUnitCents: 80000,
    });
  });

  it("refuses a total no whole-EGP rate produces", () => {
    expect(reconstructDayUseUnitRates(300050, 2, 0)).toBeNull();
    expect(reconstructDayUseUnitRates(100, 3, 0)).toBeNull();
  });

  it("agrees with the resolver for every configured rate", () => {
    for (const key of Object.keys(config.dateOverrides)) {
      const quote = priceFromUnitRates(resolveDayUseRate(key, config), 3, 2);
      expect(reconstructDayUseUnitRates(quote.totalCents, 3, 2)).toEqual({
        adultUnitCents: quote.adultUnitCents,
        kidsUnitCents: quote.kidsUnitCents,
      });
    }
  });
});
