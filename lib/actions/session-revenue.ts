"use server";

import { prisma } from "@/db/prisma";
import {
  CommissionStatus,
  LessonBookingStatus,
  Prisma,
  RevenueSource,
  WalletLedgerReason,
} from "@prisma/client";
import { LESSON_TYPE_SKU } from "@/lib/lesson-products";
import { requireCapability } from "@/lib/auth-guard";

type Db = Prisma.TransactionClient | typeof prisma;

const QUALIFYING_STATUSES: LessonBookingStatus[] = [
  LessonBookingStatus.CONFIRMED,
  LessonBookingStatus.COMPLETED,
];

/**
 * Idempotent: snapshots deliveredRevenueCents + revenueSource on the session
 * based on how each qualifying booking was paid.
 *
 * - If session's commission is PAID → skip (historical P&L stable).
 * - No qualifying booking → clear both fields.
 * - For each qualifying booking: classify and sum:
 *     BUNDLE  — CONSUMPTION ledger row links to an OrderLine; unit = unitPriceCents / creditUnitsEach
 *     ORDER   — OrderLine exists for the lesson-type SKU against this guest near session start
 *     FREE    — no charge found
 *   If any contributing booking is BUNDLE, source = BUNDLE; else ORDER (mixed leans BUNDLE);
 *   if every contributing booking is FREE, source = FREE.
 */
export async function ensureSessionRevenue(
  sessionId: string,
  txClient?: Prisma.TransactionClient
) {
  await requireCapability("lessons:book");
  const db: Db = txClient ?? prisma;

  const session = await db.lessonSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      lessonType: true,
      startsAt: true,
      deliveredRevenueCents: true,
      revenueSource: true,
      commission: { select: { status: true } },
      bookings: {
        select: {
          id: true,
          guestId: true,
          status: true,
          orderId: true,
        },
      },
    },
  });

  if (!session) return { skipped: "no-session" as const };

  if (session.commission?.status === CommissionStatus.PAID) {
    return { skipped: "paid" as const };
  }

  const qualifying = session.bookings.filter((b) =>
    QUALIFYING_STATUSES.includes(b.status)
  );

  if (qualifying.length === 0) {
    if (
      session.deliveredRevenueCents !== null ||
      session.revenueSource !== null
    ) {
      await db.lessonSession.update({
        where: { id: sessionId },
        data: { deliveredRevenueCents: null, revenueSource: null },
      });
    }
    return { skipped: "no-qualifying-booking" as const };
  }

  const sku = LESSON_TYPE_SKU[session.lessonType];
  const product = await db.product.findUnique({
    where: { sku },
    select: { id: true },
  });
  const productId = product?.id ?? null;

  let totalCents = 0;
  let anyBundle = false;
  let anyOrder = false;

  for (const booking of qualifying) {
    const contribution = await classifyBooking(db, {
      bookingId: booking.id,
      guestId: booking.guestId,
      orderId: booking.orderId,
      productId,
      sessionStartsAt: session.startsAt,
    });
    totalCents += contribution.cents;
    if (contribution.source === RevenueSource.BUNDLE) anyBundle = true;
    if (contribution.source === RevenueSource.ORDER) anyOrder = true;
  }

  const revenueSource: RevenueSource = anyBundle
    ? RevenueSource.BUNDLE
    : anyOrder
      ? RevenueSource.ORDER
      : RevenueSource.FREE;

  await db.lessonSession.update({
    where: { id: sessionId },
    data: {
      deliveredRevenueCents: totalCents,
      revenueSource,
    },
  });

  return { ok: true as const, deliveredRevenueCents: totalCents, revenueSource };
}

type ClassifyArgs = {
  bookingId: string;
  guestId: string;
  /** Order explicitly linked when the booking was charged (null for legacy rows). */
  orderId: string | null;
  productId: string | null;
  sessionStartsAt: Date;
};

type Contribution = {
  cents: number;
  source: RevenueSource;
};

async function classifyBooking(db: Db, args: ClassifyArgs): Promise<Contribution> {
  // 1. Bundle consumption → look up originating OrderLine and unit price.
  const consumption = await db.walletLedger.findFirst({
    where: {
      lessonBookingId: args.bookingId,
      reason: WalletLedgerReason.CONSUMPTION,
      orderLineId: { not: null },
    },
    select: { orderLineId: true },
  });

  if (consumption?.orderLineId) {
    const line = await db.orderLine.findUnique({
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

  // 2. Explicit link: the order created when this booking was charged.
  if (args.orderId) {
    const linkedLine = await db.orderLine.findFirst({
      where: { orderId: args.orderId },
      select: { lineTotalCents: true },
    });
    if (linkedLine) {
      return { cents: linkedLine.lineTotalCents, source: RevenueSource.ORDER };
    }
  }

  // 3. Legacy fallback (no link): OrderLine for this lesson's default product
  //    against this guest near session start.
  if (args.productId) {
    const dayMs = 24 * 60 * 60 * 1000;
    const windowStart = new Date(args.sessionStartsAt.getTime() - dayMs);
    const windowEnd = new Date(args.sessionStartsAt.getTime() + dayMs);

    const orderLine = await db.orderLine.findFirst({
      where: {
        productId: args.productId,
        order: {
          userId: args.guestId,
          createdAt: { gte: windowStart, lte: windowEnd },
        },
      },
      select: { lineTotalCents: true },
      orderBy: { order: { createdAt: "desc" } },
    });

    if (orderLine) {
      return { cents: orderLine.lineTotalCents, source: RevenueSource.ORDER };
    }
  }

  // 4. No charge attributable.
  return { cents: 0, source: RevenueSource.FREE };
}
