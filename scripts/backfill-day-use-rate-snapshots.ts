import { prisma } from "@/db/prisma";
import { BookingStatus } from "@prisma/client";
import { pricingConfig, type RateType } from "@/lib/pricing-config";
import { reconstructDayUseUnitRates, resolveDayUseRate } from "@/lib/pricing";
import { dateKeyFromUtcMidnight, dateKeyInCairo, utcMidnightFromKey } from "@/lib/date-keys";

/**
 * Give active upcoming Day Use bookings the unit-price snapshot new bookings
 * get at creation (PLAN.md decision 17). Rates are recovered from the stored
 * total only when exactly one whole-EGP adult price produces it; anything else
 * stays unsnapshotted, and party edits on it are blocked for staff review
 * instead of being repriced at today's rate.
 *
 * Dry run by default. Pass --apply to write.
 */
const ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.REQUEST_SENT,
  BookingStatus.UNDER_REVIEW,
  BookingStatus.WAITING_PAYMENT,
  BookingStatus.CONFIRMED,
];

/** A recovered price that no longer matches the config still needs a label. */
function rateTypeFor(dateKey: string, adultUnitCents: number): RateType {
  const current = resolveDayUseRate(dateKey);
  if (current.adultUnitCents === adultUnitCents) return current.rateType;
  if (adultUnitCents > pricingConfig.adultPriceCents) return "peak";
  if (adultUnitCents < pricingConfig.adultPriceCents) return "best-value";
  return "regular";
}

async function main() {
  const apply = process.argv.includes("--apply");
  const today = utcMidnightFromKey(dateKeyInCairo());

  const bookings = await prisma.booking.findMany({
    where: {
      service: "day-use",
      date: { gte: today },
      bookingStatus: { in: ACTIVE_STATUSES },
      adultUnitPriceCents: null,
    },
    select: {
      id: true,
      date: true,
      numberOfPeople: true,
      numberOfKids: true,
      totalPriceCents: true,
    },
    orderBy: { date: "asc" },
  });

  let snapshotted = 0;
  const unresolved: string[] = [];

  for (const b of bookings) {
    const dateKey = dateKeyFromUtcMidnight(b.date);
    const rates =
      b.totalPriceCents === null
        ? null
        : reconstructDayUseUnitRates(b.totalPriceCents, b.numberOfPeople, b.numberOfKids);
    if (!rates) {
      unresolved.push(
        `${b.id}  ${dateKey}  ${b.numberOfPeople}A/${b.numberOfKids}K  total=${b.totalPriceCents ?? "none"}`,
      );
      continue;
    }
    if (apply) {
      await prisma.booking.update({
        where: { id: b.id },
        data: {
          adultUnitPriceCents: rates.adultUnitCents,
          kidsUnitPriceCents: rates.kidsUnitCents,
          dayUseRateType: rateTypeFor(dateKey, rates.adultUnitCents),
        },
      });
    }
    snapshotted += 1;
  }

  console.log(
    [
      apply ? "APPLIED" : "DRY RUN (pass --apply to write)",
      `Active upcoming Day Use bookings without a snapshot: ${bookings.length}`,
      `${apply ? "Snapshotted" : "Would snapshot"}:                                ${snapshotted}`,
      `Left for staff review (rates not recoverable):       ${unresolved.length}`,
      ...unresolved.map((line) => `  ${line}`),
    ].join("\n"),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
