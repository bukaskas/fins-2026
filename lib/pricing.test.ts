import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calculateDayUsePrice,
  getGroupDiscountSummary,
  getUpcomingPeakDates,
  priceFromUnitRates,
  ratesFromSnapshot,
  reconstructDayUseUnitRates,
  resolveDayUseRate,
  snapshotFromRate,
  spectatorRate,
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
  weekendAdultPriceCents: 150000,
  weekendDays: [5, 6],
  weekdayRateType: "regular",
  weekendRateType: "regular",
  kidsRateMultiplier: 0.5,
  dateOverrides: {
    "2026-10-11": { adultPriceCents: 170000, rateType: "peak" },
    "2026-10-18": { adultPriceCents: 125000, rateType: "best-value" },
    "2026-10-25": { adultPriceCents: 150000, rateType: "regular" },
    "2026-11-01": { adultPriceCents: 100100, rateType: "best-value" },
  },
});

describe("resolveDayUseRate", () => {
  it("charges the weekend price on Friday and Saturday", () => {
    const split: PricingConfig = {
      ...config,
      adultPriceCents: 110000,
      weekendAdultPriceCents: 150000,
      weekdayRateType: "best-value",
      weekendRateType: "regular",
    };
    expect(resolveDayUseRate("2026-10-15", split).adultUnitCents).toBe(110000); // Thu
    expect(resolveDayUseRate("2026-10-15", split).rateType).toBe("best-value");
    expect(resolveDayUseRate("2026-10-16", split).rateType).toBe("regular");
    expect(resolveDayUseRate("2026-10-16", split).adultUnitCents).toBe(150000); // Fri
    expect(resolveDayUseRate("2026-10-17", split).adultUnitCents).toBe(150000); // Sat
    expect(resolveDayUseRate("2026-10-17", split).kidsUnitCents).toBe(75000);
    expect(resolveDayUseRate("2026-10-18", split).adultUnitCents).toBe(125000); // override wins
  });

  it("falls back to the regular adult price on an unlisted date", () => {
    expect(resolveDayUseRate("2026-10-12", config)).toEqual({
      dateKey: "2026-10-12",
      adultUnitCents: 150000,
      kidsUnitCents: 75000,
      rateType: "regular",
      groupDiscount: null,
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
      { adultUnitCents: 170000, kidsUnitCents: 85000, rateType: "peak", groupDiscount: null },
      2,
      1,
    );
    expect(p).toEqual({
      adultUnitCents: 170000,
      kidsUnitCents: 85000,
      adultTotalCents: 340000,
      kidsTotalCents: 85000,
      groupDiscount: null,
      groupDiscountCents: 0,
      totalCents: 425000,
      rateType: "peak",
    });
  });

  it("prices a stored UTC-midnight date and its key identically", () => {
    const byDate = calculateDayUsePrice(utcMidnightFromKey("2026-10-12"), 2, 1);
    const byKey = calculateDayUsePrice("2026-10-12", 2, 1);
    expect(byDate).toEqual(byKey);
    expect(byKey.totalCents).toBe(275000); // Mon: 2 × 1,100 + 550
  });
});

describe("pricing config validation", () => {
  const base = {
    adultPriceCents: 150000,
    weekendAdultPriceCents: 150000,
    weekendDays: [5, 6],
    weekdayRateType: "regular" as const,
    weekendRateType: "regular" as const,
    kidsRateMultiplier: 0.5,
  };

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

describe("group discount", () => {
  const withDiscount: PricingConfig = parsePricingConfig({
    adultPriceCents: 110000,
    weekendAdultPriceCents: 150000,
    weekendDays: [5, 6],
    weekdayRateType: "best-value",
    weekendRateType: "regular",
    kidsRateMultiplier: 0.5,
    dateOverrides: {
      "2026-10-22": { adultPriceCents: 160000, rateType: "peak" }, // Thu
    },
    groupDiscount: {
      minAdults: 5,
      perAdultCents: { regular: 20000, peak: 10000, "best-value": 15000 },
    },
  });

  it("offers the discount for the date's rate type, overrides included", () => {
    expect(resolveDayUseRate("2026-10-15", withDiscount).groupDiscount).toEqual({
      perAdultCents: 15000,
      minAdults: 5,
    }); // Thu, best value
    expect(resolveDayUseRate("2026-10-16", withDiscount).groupDiscount?.perAdultCents).toBe(
      20000,
    ); // Fri, regular
    expect(resolveDayUseRate("2026-10-22", withDiscount).groupDiscount?.perAdultCents).toBe(
      10000,
    ); // peak override
  });

  it("takes the amount off every adult from minAdults, never off kids", () => {
    const rate = resolveDayUseRate("2026-10-16", withDiscount); // 1,500 regular
    const four = priceFromUnitRates(rate, 4, 2);
    expect(four.groupDiscountCents).toBe(0);
    expect(four.totalCents).toBe(4 * 150000 + 2 * 75000);

    const five = priceFromUnitRates(rate, 5, 2);
    expect(five.groupDiscountCents).toBe(5 * 20000);
    expect(five.adultTotalCents).toBe(5 * 150000);
    expect(five.totalCents).toBe(5 * 130000 + 2 * 75000);
  });

  it("never lets one more adult lower the total", () => {
    for (const key of ["2026-10-15", "2026-10-16", "2026-10-22"]) {
      const rate = resolveDayUseRate(key, withDiscount);
      for (let adults = 1; adults < 12; adults++) {
        expect(priceFromUnitRates(rate, adults + 1, 0).totalCents).toBeGreaterThanOrEqual(
          priceFromUnitRates(rate, adults, 0).totalCents,
        );
      }
    }
  });

  it("is off for a rate type set to 0, and everywhere when absent", () => {
    const peakOff = parsePricingConfig({
      ...withDiscount,
      groupDiscount: { minAdults: 5, perAdultCents: { regular: 20000, peak: 0, "best-value": 0 } },
    });
    expect(resolveDayUseRate("2026-10-22", peakOff).groupDiscount).toBeNull();
    expect(resolveDayUseRate("2026-10-15", config).groupDiscount).toBeNull();
    expect(getGroupDiscountSummary(config)).toBeNull();
  });

  it("summarises the advertised range", () => {
    expect(getGroupDiscountSummary(withDiscount)).toEqual({
      minAdults: 5,
      minPerAdultCents: 10000,
      maxPerAdultCents: 20000,
    });
  });

  it("is never offered on a spectator pass", () => {
    expect(priceFromUnitRates(spectatorRate("2026-10-09"), 8, 0).groupDiscountCents).toBe(0);
  });

  it("party edits recheck the threshold against the terms the booking was sold at", () => {
    // Booked as 6 adults on a regular day.
    const snapshot = snapshotFromRate(
      priceFromUnitRates(resolveDayUseRate("2026-10-16", withDiscount), 6, 0),
    );
    expect(snapshot.groupDiscountPerAdultCents).toBe(20000);
    expect(snapshot.groupDiscountMinAdults).toBe(5);
    const soldAt = ratesFromSnapshot(snapshot)!;
    expect(priceFromUnitRates(soldAt, 3, 0).totalCents).toBe(3 * 150000); // dropped below
    expect(priceFromUnitRates(soldAt, 6, 0).totalCents).toBe(6 * 130000); // back over
  });

  it("keeps the terms on a booking that didn't qualify when it was made", () => {
    const snapshot = snapshotFromRate(
      priceFromUnitRates(resolveDayUseRate("2026-10-16", withDiscount), 2, 0),
    );
    const soldAt = ratesFromSnapshot(snapshot)!;
    expect(priceFromUnitRates(soldAt, 5, 0).groupDiscountCents).toBe(5 * 20000);
  });

  it("reads a pre-discount snapshot as no discount", () => {
    const soldAt = ratesFromSnapshot({
      adultUnitPriceCents: 150000,
      kidsUnitPriceCents: 75000,
      dayUseRateType: "regular",
      groupDiscountPerAdultCents: null,
      groupDiscountMinAdults: null,
    })!;
    expect(priceFromUnitRates(soldAt, 10, 0).totalCents).toBe(10 * 150000);
  });

  it("rejects a discount that would let a bigger group pay less", () => {
    // 5 × (1,100 − 230) = 4,350 < 4 × 1,100 = 4,400.
    expect(() =>
      parsePricingConfig({
        ...withDiscount,
        groupDiscount: {
          minAdults: 5,
          perAdultCents: { regular: 20000, peak: 10000, "best-value": 23000 },
        },
      }),
    ).toThrow(/best-value.*at most 220 EGP/s);
  });

  it("checks the discount against every price a rate type is sold at", () => {
    // A cheap peak override caps the peak discount: 5 × 200 > 900.
    expect(() =>
      parsePricingConfig({
        ...withDiscount,
        dateOverrides: { "2026-10-22": { adultPriceCents: 90000, rateType: "peak" } },
        groupDiscount: {
          minAdults: 5,
          perAdultCents: { regular: 20000, peak: 20000, "best-value": 15000 },
        },
      }),
    ).toThrow(/peak/);
  });

  it("rejects part-EGP amounts, a missing rate type and a threshold below 2", () => {
    const bad = [
      { minAdults: 5, perAdultCents: { regular: 20050, peak: 0, "best-value": 0 } },
      { minAdults: 5, perAdultCents: { regular: 20000, peak: 0 } },
      { minAdults: 1, perAdultCents: { regular: 20000, peak: 0, "best-value": 0 } },
    ];
    for (const groupDiscount of bad) {
      expect(() => parsePricingConfig({ ...withDiscount, groupDiscount })).toThrow(
        /pricing\.json is invalid/,
      );
    }
  });
});
