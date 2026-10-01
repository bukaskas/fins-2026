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

const pricingConfigSchema = z
  .object({
    adultPriceCents: wholeEgpCents,
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
  })
  .strict();

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
