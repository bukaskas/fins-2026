/* eslint-disable no-console */
import { prisma } from "@/db/prisma";
import {
  CommissionStatus,
  LessonBookingStatus,
  LessonType,
  Prisma,
  RevenueSource,
  WalletLedgerReason,
} from "@prisma/client";
import { LESSON_TYPE_SKU } from "@/lib/lesson-products";

const CHUNK = 500;
const QUALIFYING: LessonBookingStatus[] = [
  LessonBookingStatus.CONFIRMED,
  LessonBookingStatus.COMPLETED,
];

type Counts = { BUNDLE: number; ORDER: number; FREE: number; SKIPPED_PAID: number; NO_BOOKING: number };

const sessionSelect = {
  id: true,
  lessonType: true,
  startsAt: true,
  commission: { select: { status: true } },
  bookings: {
    select: { id: true, guestId: true, status: true },
  },
} satisfies Prisma.LessonSessionSelect;

type BatchSession = Prisma.LessonSessionGetPayload<{ select: typeof sessionSelect }>;

async function classifyBooking(
  bookingId: string,
  guestId: string,
  productId: string | null,
  sessionStartsAt: Date
): Promise<{ cents: number; source: RevenueSource } | null> {
  const consumption = await prisma.walletLedger.findFirst({
    where: {
      lessonBookingId: bookingId,
      reason: WalletLedgerReason.CONSUMPTION,
      orderLineId: { not: null },
    },
    select: { orderLineId: true },
  });

  if (consumption?.orderLineId) {
    const line = await prisma.orderLine.findUnique({
      where: { id: consumption.orderLineId },
      select: { unitPriceCents: true, creditUnitsEach: true },
    });
    if (line && line.creditUnitsEach && line.creditUnitsEach > 0) {
      return {
        cents: Math.round(line.unitPriceCents / line.creditUnitsEach),
        source: RevenueSource.BUNDLE,
      };
    }
  }

  if (productId) {
    const dayMs = 24 * 60 * 60 * 1000;
    const windowStart = new Date(sessionStartsAt.getTime() - dayMs);
    const windowEnd = new Date(sessionStartsAt.getTime() + dayMs);

    const orderLine = await prisma.orderLine.findFirst({
      where: {
        productId,
        order: {
          userId: guestId,
          createdAt: { gte: windowStart, lte: windowEnd },
        },
      },
      select: { unitPriceCents: true },
      orderBy: { order: { createdAt: "desc" } },
    });

    if (orderLine) {
      return { cents: orderLine.unitPriceCents, source: RevenueSource.ORDER };
    }
  }

  return { cents: 0, source: RevenueSource.FREE };
}

async function main() {
  console.log("Loading product lookup…");
  const products = await prisma.product.findMany({
    where: { sku: { in: Object.values(LESSON_TYPE_SKU) } },
    select: { id: true, sku: true },
  });
  const productBySku = new Map(products.map((p) => [p.sku, p.id]));

  console.log("Counting candidate sessions…");
  const totalCandidates = await prisma.lessonSession.count({
    where: {
      deliveredRevenueCents: null,
      OR: [{ commission: null }, { commission: { status: { not: CommissionStatus.PAID } } }],
    },
  });
  console.log(`Sessions to backfill: ${totalCandidates}`);

  const counts: Counts = { BUNDLE: 0, ORDER: 0, FREE: 0, SKIPPED_PAID: 0, NO_BOOKING: 0 };
  let processed = 0;
  let cursor: string | null = null;

  while (true) {
    const where: Prisma.LessonSessionWhereInput = {
      deliveredRevenueCents: null,
      ...(cursor ? { id: { gt: cursor } } : {}),
    };
    const batch: BatchSession[] = await prisma.lessonSession.findMany({
      where,
      orderBy: { id: "asc" },
      take: CHUNK,
      select: sessionSelect,
    });

    if (batch.length === 0) break;

    for (const session of batch) {
      if (session.commission?.status === CommissionStatus.PAID) {
        counts.SKIPPED_PAID += 1;
        continue;
      }

      const qualifying = session.bookings.filter((b) => QUALIFYING.includes(b.status));
      if (qualifying.length === 0) {
        counts.NO_BOOKING += 1;
        continue;
      }

      const productId =
        productBySku.get(LESSON_TYPE_SKU[session.lessonType as LessonType]) ?? null;

      let totalCents = 0;
      let anyBundle = false;
      let anyOrder = false;

      for (const b of qualifying) {
        const c = await classifyBooking(b.id, b.guestId, productId, session.startsAt);
        if (!c) continue;
        totalCents += c.cents;
        if (c.source === RevenueSource.BUNDLE) anyBundle = true;
        if (c.source === RevenueSource.ORDER) anyOrder = true;
      }

      const source: RevenueSource = anyBundle
        ? RevenueSource.BUNDLE
        : anyOrder
          ? RevenueSource.ORDER
          : RevenueSource.FREE;

      await prisma.lessonSession.update({
        where: { id: session.id },
        data: { deliveredRevenueCents: totalCents, revenueSource: source },
      });

      counts[source] += 1;
    }

    processed += batch.length;
    cursor = batch[batch.length - 1].id;
    console.log(`  …processed ${processed}/${totalCandidates}`);
  }

  console.log("\nDone.");
  console.log(`  BUNDLE       : ${counts.BUNDLE}`);
  console.log(`  ORDER        : ${counts.ORDER}`);
  console.log(`  FREE         : ${counts.FREE}`);
  console.log(`  SKIPPED_PAID : ${counts.SKIPPED_PAID}`);
  console.log(`  NO_BOOKING   : ${counts.NO_BOOKING}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
