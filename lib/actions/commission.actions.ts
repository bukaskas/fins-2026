"use server";

import { prisma } from "@/db/prisma";
import {
  CommissionStatus,
  CommissionType,
  LessonBookingStatus,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  calculateCommissionCents,
  commissionTypeFromLessonType,
  rateFieldForCommissionType,
} from "@/lib/commission";
import { commissionUpdateSchema } from "@/lib/validators";

type Db = Prisma.TransactionClient | typeof prisma;

const QUALIFYING_STATUSES: LessonBookingStatus[] = [
  LessonBookingStatus.CONFIRMED,
  LessonBookingStatus.COMPLETED,
];

function durationMinutesBetween(startsAt: Date, endsAt: Date): number {
  return Math.max(0, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000));
}

function revalidateCommissionPaths(instructorId?: string | null) {
  revalidatePath("/instructors");
  if (instructorId) revalidatePath(`/instructors/${instructorId}`);
  revalidatePath("/lessons");
  revalidatePath("/bookings/schedule");
}

/**
 * Idempotent: creates, updates, or removes the commission row for a session
 * based on the session's current state.
 *
 * - PAID commissions are never touched.
 * - No qualifying booking → delete any PENDING commission (no-op if none).
 * - No instructor or no InstructorProfile → silent skip.
 * - Otherwise upsert. On update, re-snapshots rate/type/duration when PENDING
 *   and preserves any existing overrideAmountCents.
 */
export async function ensureCommissionForSession(
  sessionId: string,
  txClient?: Prisma.TransactionClient
) {
  const db: Db = txClient ?? prisma;

  const session = await db.lessonSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      instructorId: true,
      lessonType: true,
      startsAt: true,
      endsAt: true,
      bookings: { select: { status: true } },
      commission: {
        select: {
          id: true,
          status: true,
          overrideAmountCents: true,
        },
      },
    },
  });

  if (!session) return { skipped: "no-session" as const };

  const existing = session.commission;

  if (existing?.status === CommissionStatus.PAID) {
    return { skipped: "paid" as const };
  }

  const hasQualifying = session.bookings.some((b) =>
    QUALIFYING_STATUSES.includes(b.status)
  );

  if (!hasQualifying) {
    if (existing) {
      await db.instructorCommission.delete({ where: { sessionId } });
    }
    return { skipped: "no-qualifying-booking" as const };
  }

  if (!session.instructorId) return { skipped: "no-instructor" as const };

  const profile = await db.instructorProfile.findUnique({
    where: { userId: session.instructorId },
  });
  if (!profile) return { skipped: "no-profile" as const };

  const commissionType = commissionTypeFromLessonType(session.lessonType);
  const rateField = rateFieldForCommissionType(commissionType);
  const rateCents = profile[rateField];
  const durationMinutes = durationMinutesBetween(session.startsAt, session.endsAt);
  const calculatedAmountCents = calculateCommissionCents(durationMinutes, rateCents);
  const overrideAmountCents = existing?.overrideAmountCents ?? null;
  const finalAmountCents = overrideAmountCents ?? calculatedAmountCents;

  await db.instructorCommission.upsert({
    where: { sessionId },
    create: {
      sessionId,
      instructorId: session.instructorId,
      commissionType,
      durationMinutes,
      rateAtCreationCents: rateCents,
      calculatedAmountCents,
      finalAmountCents,
      status: CommissionStatus.PENDING,
    },
    update: {
      commissionType,
      durationMinutes,
      rateAtCreationCents: rateCents,
      calculatedAmountCents,
      finalAmountCents,
    },
  });

  return { ok: true as const };
}

export async function updateCommission(
  id: string,
  input: { overrideAmountCents?: number | null; commissionType?: CommissionType }
) {
  const parsed = commissionUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.message };
  }

  try {
    const existing = await prisma.instructorCommission.findUniqueOrThrow({
      where: { id },
    });

    if (existing.status === CommissionStatus.PAID) {
      return {
        success: false,
        message: "Commission is paid and immutable.",
      };
    }

    const commissionType = parsed.data.commissionType ?? existing.commissionType;
    const overrideAmountCents =
      parsed.data.overrideAmountCents === undefined
        ? existing.overrideAmountCents
        : parsed.data.overrideAmountCents;

    const calculatedAmountCents = calculateCommissionCents(
      existing.durationMinutes,
      existing.rateAtCreationCents
    );

    const finalAmountCents = overrideAmountCents ?? calculatedAmountCents;

    await prisma.instructorCommission.update({
      where: { id },
      data: {
        commissionType,
        overrideAmountCents,
        calculatedAmountCents,
        finalAmountCents,
      },
    });

    revalidateCommissionPaths(existing.instructorId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: `Failed to update commission. ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

export async function markCommissionPaid(id: string, paymentId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const commission = await tx.instructorCommission.findUniqueOrThrow({
        where: { id },
      });

      if (commission.status === CommissionStatus.PAID) {
        if (commission.paymentId === paymentId) {
          return { success: true, idempotent: true as const };
        }
        return {
          success: false,
          message: "Commission is already paid under a different payment.",
        };
      }

      const payment = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!payment) {
        return { success: false, message: "Payment not found." };
      }

      const result = await tx.instructorCommission.updateMany({
        where: { id, status: CommissionStatus.PENDING },
        data: {
          status: CommissionStatus.PAID,
          paymentId,
          paidAt: new Date(),
        },
      });

      if (result.count === 0) {
        return {
          success: false,
          message: "Commission state changed while saving. Reload and try again.",
        };
      }

      revalidateCommissionPaths(commission.instructorId);
      return { success: true };
    });
  } catch (error) {
    return {
      success: false,
      message: `Failed to mark commission paid. ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

export type CommissionListFilters = {
  status?: CommissionStatus;
  from?: Date;
  to?: Date;
};

export async function getInstructorCommissions(
  instructorId: string,
  filters: CommissionListFilters = {}
) {
  const sessionWhere: Prisma.LessonSessionWhereInput = {};
  if (filters.from || filters.to) {
    sessionWhere.startsAt = {
      ...(filters.from && { gte: filters.from }),
      ...(filters.to && { lte: filters.to }),
    };
  }

  const where: Prisma.InstructorCommissionWhereInput = {
    instructorId,
    ...(filters.status && { status: filters.status }),
    ...(Object.keys(sessionWhere).length > 0 && { session: sessionWhere }),
  };

  const [rows, grouped] = await Promise.all([
    prisma.instructorCommission.findMany({
      where,
      orderBy: { session: { startsAt: "desc" } },
      include: {
        session: {
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            lessonType: true,
            capacity: true,
            notes: true,
            instructor: { select: { id: true, name: true, email: true } },
            bookings: {
              select: {
                id: true,
                status: true,
                guest: { select: { id: true, name: true, email: true, phone: true } },
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            method: true,
            reference: true,
            receivedAt: true,
            amountCents: true,
          },
        },
      },
    }),
    prisma.instructorCommission.groupBy({
      by: ["status"],
      where,
      _sum: { finalAmountCents: true },
      _count: { _all: true },
    }),
  ]);

  const totals = {
    pending: { count: 0, cents: 0 },
    paid: { count: 0, cents: 0 },
  };
  for (const g of grouped) {
    const bucket = g.status === CommissionStatus.PAID ? totals.paid : totals.pending;
    bucket.count = g._count._all;
    bucket.cents = g._sum.finalAmountCents ?? 0;
  }

  return { rows, totals };
}

export async function listPayoutPaymentsForInstructor(instructorId: string) {
  return prisma.payment.findMany({
    where: { userId: instructorId },
    orderBy: { receivedAt: "desc" },
    take: 100,
    select: {
      id: true,
      amountCents: true,
      method: true,
      reference: true,
      receivedAt: true,
    },
  });
}
