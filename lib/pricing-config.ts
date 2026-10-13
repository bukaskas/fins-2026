import { z } from "zod";
import rawPricingConfig from "@/lib/config/pricing.json";
import { isDateKey } from "@/lib/date-keys";

/** Guest-facing rate categories. Metadata for label and colour only — an
 *  override's price is the price; the type never adjusts it. */
export const RATE_TYPES = ["regular", "peak", "best-value"] as const;
export type RateType = (typeof RATE_TYPES)[number];

const wholeEgpCents = z
  .number()
  .int("must be integer cents")
  .nonnegative("must not be negative")
  .refine((cents) => cents % 100 === 0, "must be a whole EGP amount (a multiple of 100 cents)");

const groupDiscountSchema = z
  .object({
    /** Smallest party that qualifies, in adults ("groups of 5+"). Kids don't count. */
    minAdults: z.number().int().min(2, "must be at least 2"),
    /** Fixed amount off each adult once the party qualifies, per rate type.
     *  0 turns the discount off for that rate type. */
    perAdultCents: z
      .object({
        regular: wholeEgpCents,
        peak: wholeEgpCents,
        "best-value": wholeEgpCents,
      })
      .strict(),
  })
  .strict();

const pricingConfigSchema = z
  .object({
    /** Weekday adult price. */
    adultPriceCents: wholeEgpCents,
    /** Adult price on `weekendDays`. */
    weekendAdultPriceCents: wholeEgpCents,
    /** UTC day-of-week numbers (0 = Sunday … 6 = Saturday). Egypt: Fri + Sat. */
    weekendDays: z.array(z.number().int().min(0).max(6)),
    /** Rate labels for weekday and weekend dates (label only — never changes the price). */
    weekdayRateType: z.enum(RATE_TYPES),
    weekendRateType: z.enum(RATE_TYPES),
    kidsRateMultiplier: z.number().min(0).max(1),
    dateOverrides: z
      .record(
        z.string(),
        z
          .object({
            adultPriceCents: wholeEgpCents,
            rateType: z.enum(RATE_TYPES),
          })
          .strict(),
      )
      .superRefine((overrides, ctx) => {
        for (const key of Object.keys(overrides)) {
          if (!isDateKey(key)) {
            ctx.addIssue({
              code: "custom",
              path: [key],
              message: "date override keys must be real YYYY-MM-DD dates",
            });
          }
        }
      }),
    /** Optional: absent means no group discount anywhere. */
    groupDiscount: groupDiscountSchema.optional(),
  })
  .strict()
  .superRefine((config, ctx) => {
    const discount = config.groupDiscount;
    if (!discount) return;
    // Every adult price each rate type is ever sold at, so no date can be
    // made free, or reward a party for adding one more adult.
    const pricesByType: Record<RateType, number[]> = {
      regular: [],
      peak: [],
      "best-value": [],
    };
    pricesByType[config.weekdayRateType].push(config.adultPriceCents);
    pricesByType[config.weekendRateType].push(config.weekendAdultPriceCents);
    for (const override of Object.values(config.dateOverrides)) {
      pricesByType[override.rateType].push(override.adultPriceCents);
    }
    for (const rateType of RATE_TYPES) {
      const off = discount.perAdultCents[rateType];
      if (off === 0) continue;
      for (const price of pricesByType[rateType]) {
        // minAdults at (price - off) must not undercut minAdults - 1 at full
        // price, i.e. off <= price / minAdults. This also keeps off < price.
        if (discount.minAdults * off > price) {
          ctx.addIssue({
            code: "custom",
            path: ["groupDiscount", "perAdultCents", rateType],
            message:
              `${off / 100} EGP off at ${discount.minAdults}+ adults would let a group of ` +
              `${discount.minAdults} pay less than ${discount.minAdults - 1} adults at ` +
              `${price / 100} EGP; it can be at most ${Math.floor(price / discount.minAdults / 100)} EGP`,
          });
          break;
        }
      }
    }
  });

export type GroupDiscountConfig = z.infer<typeof groupDiscountSchema>;
export type PricingConfig = z.infer<typeof pricingConfigSchema>;

/**
 * Parse a pricing config, throwing with every problem listed. A malformed
 * override must stop the build, not quietly fall back to the regular price.
 */
export function parsePricingConfig(input: unknown): PricingConfig {
  const result = pricingConfigSchema.safeParse(input);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`lib/config/pricing.json is invalid:\n${problems}`);
  }
  return result.data;
}

export const pricingConfig = parsePricingConfig(rawPricingConfig);
