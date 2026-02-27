"use server";

import { prisma } from "@/db/prisma";
import {
  Prisma,
  WalletLedgerReason,
  WalletType,
  WalletUnit,
} from "@prisma/client";
import { LessonType, LessonBookingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type DecimalLike = Prisma.Decimal | number | string;

type PostWalletLedgerInput = {
  walletId: string;
  userId: string;
  actorId?: string | null;
  delta: DecimalLike; // signed (+ credit, - consumption)
  reason: WalletLedgerReason;
  note?: string | null;
  idempotencyKey?: string | null;

  orderId?: string | null;
  orderLineId?: string | null;
  paymentId?: string | null;
  lessonBookingId?: string | null;
  beachVisitId?: string | null;
  rentalId?: string | null;
};

function toDecimal(value: DecimalLike) {
  return new Prisma.Decimal(value);
}

export async function getOrCreateWallet(
  userId: string,
  type: WalletType,
  unit: WalletUnit
) {
  const wallet = await prisma.userWallet.upsert({
    where: { userId_type: { userId, type } },
    update: {},
    create: {
      userId,
      type,
      unit,
      balance: new Prisma.Decimal(0),
    },
  });

  if (wallet.unit !== unit) {
    throw new Error(
      `Wallet unit mismatch for ${type}. Expected ${unit}, found ${wallet.unit}.`
    );
  }

  return wallet;
}

export async function postWalletLedger(input: PostWalletLedgerInput) {
  const delta = toDecimal(input.delta);

  if (delta.equals(0)) {
    throw new Error("Ledger delta must not be 0.");
  }

  // Fast idempotency return
  if (input.idempotencyKey) {
    const existing = await prisma.walletLedger.findUnique({
      where: {
        walletId_idempotencyKey: {
          walletId: input.walletId,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });

    if (existing) return existing;
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Atomic wallet balance update
      const updatedWallet = await tx.userWallet.update({
        where: { id: input.walletId, userId: input.userId },
        data: { balance: { increment: delta } },
        select: { id: true, userId: true, balance: true },
      });

      if (updatedWallet.userId !== input.userId) {
        throw new Error("walletId does not belong to userId.");
      }



      // Create immutable ledger row
      const entry = await tx.walletLedger.create({
        data: {
          walletId: input.walletId,
          userId: input.userId,
          actorId: input.actorId ?? null,
          delta,
          balanceAfter: updatedWallet.balance,
          reason: input.reason,
          note: input.note ?? null,
          idempotencyKey: input.idempotencyKey ?? null,

          orderId: input.orderId ?? null,
          orderLineId: input.orderLineId ?? null,
          paymentId: input.paymentId ?? null,
          lessonBookingId: input.lessonBookingId ?? null,
          beachVisitId: input.beachVisitId ?? null,
          rentalId: input.rentalId ?? null,
        },
      });

      return entry;
    });
  } catch (err: any) {
    // Race-safe idempotency: if duplicate key was inserted in parallel, return it
    if (
      input.idempotencyKey &&
      err?.code === "P2002" &&
      String(err?.meta?.target ?? "").includes("walletId") &&
      String(err?.meta?.target ?? "").includes("idempotencyKey")
    ) {
      const existing = await prisma.walletLedger.findUnique({
        where: {
          walletId_idempotencyKey: {
            walletId: input.walletId,
            idempotencyKey: input.idempotencyKey,
          },
        },
      });
      if (existing) return existing;
    }
    throw err;
  }
}

export async function getLessonFormUsers() {
  const [students, instructors] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true }, // changed
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "INSTRUCTOR" },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { students, instructors };
}

export async function createLessonSessionFromForm(formData: FormData) {
  const studentId = String(formData.get("studentId") ?? "").trim();
  const instructorId = String(formData.get("instructorId") ?? "").trim();
  const startsAtRaw = String(formData.get("startsAt") ?? "").trim();
  const durationHours = Number(formData.get("durationHours") ?? 0);
  const durationMinutesPart = Number(formData.get("durationMinutesPart") ?? 0);
  const durationMinutes = durationHours * 60 + durationMinutesPart;
  const lessonTypeRaw = String(formData.get("lessonType") ?? "PRIVATE").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!studentId) throw new Error("Student is required.");
  if (!instructorId) throw new Error("Instructor is required.");
  if (!startsAtRaw) throw new Error("Start date/time is required.");


  if (
    !Number.isFinite(durationHours) ||
    durationHours < 0 ||
    ![0, 15, 30, 45].includes(durationMinutesPart) ||
    durationMinutes <= 0 ||
    durationMinutes % 15 !== 0
  ) {
    throw new Error("Duration must be in 15-minute intervals and greater than 0.");
  }

  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) throw new Error("Invalid start date/time.");

  const lessonType = lessonTypeRaw as LessonType;
  if (!Object.values(LessonType).includes(lessonType)) {
    throw new Error("Invalid lesson type.");
  }

  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    const session = await tx.lessonSession.create({
      data: {
        startsAt,
        endsAt,
        lessonType,
        capacity: 1,
        instructorId,
        notes,
      },
      select: { id: true },
    });

    await tx.lessonBooking.create({
      data: {
        sessionId: session.id,
        guestId: studentId,
        status: LessonBookingStatus.CONFIRMED,
      },
    });
  });

  revalidatePath("/lessons");
  redirect("/lessons");
}

export async function getAllLessons() {
  return prisma.lessonSession.findMany({
    orderBy: { startsAt: "desc" },
    include: {
      instructor: {
        select: { id: true, name: true, email: true },
      },
      bookings: {
        include: {
          guest: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}