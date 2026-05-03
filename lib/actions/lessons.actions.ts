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
import bcryptjs from "bcryptjs";
import { sendBookingEmail } from "@/emails";
import {
  KitesurfingBookingFormData,
  kitesurfingBookingFormSchema,
} from "@/lib/validators";

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

// ---- schedule board actions ----

const sessionInclude = {
  instructor: { select: { id: true, name: true, email: true } },
  bookings: {
    include: {
      guest: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
};

export async function getLessonSessionsByDate(date: string) {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);

  return prisma.lessonSession.findMany({
    where: { startsAt: { gte: start, lte: end } },
    orderBy: { startsAt: "asc" },
    include: sessionInclude,
  });
}

export async function batchUpdateSessionSchedule(
  updates: { id: string; startsAt: string; endsAt: string; instructorId: string | null }[]
) {
  try {
    await prisma.$transaction(
      updates.map((u) =>
        prisma.lessonSession.update({
          where: { id: u.id },
          data: {
            startsAt: new Date(u.startsAt),
            endsAt: new Date(u.endsAt),
            instructorId: u.instructorId,
          },
        })
      )
    );
    return { success: true, message: "Schedule updated successfully." };
  } catch (error) {
    console.error("Batch session update error:", error);
    return {
      success: false,
      message: `Failed to update schedule. ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function createLessonSessionQuick(data: {
  startsAt: string;
  endsAt: string;
  lessonType: string;
  instructorId: string | null;
  notes: string | null;
  guestId: string | null;
}) {
  const lessonType = data.lessonType as LessonType;
  if (!Object.values(LessonType).includes(lessonType)) {
    return { success: false, message: "Invalid lesson type." };
  }

  try {
    const session = await prisma.$transaction(async (tx) => {
      const s = await tx.lessonSession.create({
        data: {
          startsAt: new Date(data.startsAt),
          endsAt: new Date(data.endsAt),
          lessonType,
          capacity: 1,
          instructorId: data.instructorId,
          notes: data.notes,
        },
      });

      if (data.guestId) {
        await tx.lessonBooking.create({
          data: {
            sessionId: s.id,
            guestId: data.guestId,
            status: LessonBookingStatus.CONFIRMED,
          },
        });
      }

      return s;
    });

    // re-fetch with includes for the board
    const full = await prisma.lessonSession.findUnique({
      where: { id: session.id },
      include: sessionInclude,
    });

    return { success: true, data: full };
  } catch (error) {
    console.error("Create session error:", error);
    return {
      success: false,
      message: `Failed to create session. ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

const LESSON_DURATION_MINUTES: Record<LessonType, number> = {
  PRIVATE: 120,
  GROUP: 150,
  EXTRA_PRIVATE: 60,
  EXTRA_GROUP: 60,
  FOIL: 90,
  KIDS: 90,
};

export async function createKitesurfingBookingFromPublic(
  data: KitesurfingBookingFormData
) {
  try {
    const validated = kitesurfingBookingFormSchema.parse(data);

    const [h, m] = validated.time.split(":").map(Number);
    const startsAt = new Date(validated.date);
    startsAt.setUTCHours(h, m, 0, 0);
    const endsAt = new Date(
      startsAt.getTime() +
      LESSON_DURATION_MINUTES[LessonType.PRIVATE] * 60 * 1000
    );

    let user = await prisma.user.findUnique({
      where: { email: validated.email },
      select: { id: true },
    });
    if (!user) {
      const hashedPassword = await bcryptjs.hash(crypto.randomUUID(), 10);
      user = await prisma.user.create({
        data: {
          email: validated.email,
          name: validated.name,
          phone: validated.phone,
          password: hashedPassword,
        },
        select: { id: true },
      });
    }

    const { session, booking } = await prisma.$transaction(async (tx) => {
      const session = await tx.lessonSession.create({
        data: {
          startsAt,
          endsAt,
          lessonType: LessonType.PRIVATE,
          capacity: 1,
          instructorId: null,
          notes: validated.notes,
        },
      });
      const booking = await tx.lessonBooking.create({
        data: {
          sessionId: session.id,
          guestId: user!.id,
          status: LessonBookingStatus.RESERVED,
        },
      });
      return { session, booking };
    });

    try {
      await sendBookingEmail(
        validated.email,
        validated.name,
        startsAt,
        "kitesurfing-course"
      );
    } catch (emailError) {
      console.error("Failed to send booking confirmation email:", emailError);
    }

    return {
      success: true,
      message: `Booking received for ${startsAt.toDateString()}`,
      bookingId: booking.id,
      date: startsAt,
      bookingType: "kitesurfing-course" as string,
    };
  } catch (error) {
    console.error("Kitesurfing booking error:", error);
    return {
      success: false,
      message: `Failed to create booking. ${error instanceof Error ? error.message : String(error)
        }`,
    };
  }
}

export async function updateLessonSession(
  id: string,
  data: {
    lessonType: LessonType;
    instructorId: string | null;
    startsAt: Date;
    endsAt: Date;
    notes: string | null;
    capacity: number;
  }
) {
  try {
    const session = await prisma.lessonSession.update({
      where: { id },
      data: {
        lessonType: data.lessonType,
        instructorId: data.instructorId,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        notes: data.notes,
        capacity: data.capacity,
      },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
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
    revalidatePath("/bookings/schedule");
    return { success: true, data: session };
  } catch (error) {
    return {
      success: false,
      message: `Failed to update session. ${error instanceof Error ? error.message : String(error)
        }`,
    };
  }
}

export async function updateLessonBooking(
  id: string,
  data: {
    status: LessonBookingStatus;
    attended: boolean;
    notes: string | null;
    instructorId: string | null;
    startsAt: Date;
    endsAt: Date;
    lessonType?: LessonType;
    capacity?: number;
  }
) {
  try {
    const existing = await prisma.lessonBooking.findUniqueOrThrow({
      where: { id },
      select: { sessionId: true },
    });

    await prisma.$transaction([
      prisma.lessonBooking.update({
        where: { id },
        data: {
          status: data.status,
          attended: data.attended,
          checkedInAt:
            data.attended && data.status === LessonBookingStatus.CONFIRMED
              ? new Date()
              : undefined,
          notes: data.notes,
        },
      }),
      prisma.lessonSession.update({
        where: { id: existing.sessionId },
        data: {
          instructorId: data.instructorId,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          ...(data.lessonType !== undefined && { lessonType: data.lessonType }),
          ...(data.capacity !== undefined && { capacity: data.capacity }),
        },
      }),
    ]);

    revalidatePath("/bookings/schedule");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: `Failed to update booking. ${error instanceof Error ? error.message : String(error)
        }`,
    };
  }
}

export async function deleteLessonSession(id: string) {
  try {
    await prisma.$transaction([
      prisma.lessonBooking.deleteMany({ where: { sessionId: id } }),
      prisma.lessonSession.delete({ where: { id } }),
    ]);
    revalidatePath("/bookings/schedule");
    return { success: true };
  } catch (error) {
    console.error("Delete session error:", error);
    return {
      success: false,
      message: `Failed to delete session. Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function getInstructorSessions(
  instructorId: string,
  from: string,
  to: string
) {
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T23:59:59.999Z`);

  return prisma.lessonSession.findMany({
    where: {
      instructorId,
      startsAt: { gte: start, lte: end },
    },
    orderBy: { startsAt: "asc" },
    include: sessionInclude,
  });
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