"use server";

import { prisma } from "@/db/prisma";
import {
  Prisma,
  WalletLedgerReason,
  WalletType,
  WalletUnit,
} from "@prisma/client";
import { LessonType, LessonBookingStatus, OrderStatus, ProductType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcryptjs from "bcryptjs";
import { sendBookingEmail } from "@/emails";
import {
  KitesurfingBookingFormData,
  kitesurfingBookingFormSchema,
  newLessonFormSchema,
} from "@/lib/validators";
import { ensureCommissionForSession } from "@/lib/actions/commission.actions";
import { getDefaultProductForLessonType } from "@/lib/lesson-products";

type TxClient = Prisma.TransactionClient;

async function chargeGuestForSession(
  tx: TxClient,
  args: {
    guestId: string;
    lessonType: LessonType;
    productId: string | null;
  },
) {
  const product = args.productId
    ? await tx.product.findUnique({ where: { id: args.productId } })
    : await getDefaultProductForLessonType(tx, args.lessonType);

  if (!product) {
    throw new Error("Selected product not found.");
  }
  if (!product.isActive) {
    throw new Error(`Product "${product.sku}" is inactive — pick another or activate it in /products.`);
  }

  return tx.order.create({
    data: {
      userId: args.guestId,
      status: "OPEN",
      totalCents: product.priceCents,
      lines: {
        create: [
          {
            productId: product.id,
            qty: 1,
            unitPriceCents: product.priceCents,
            lineTotalCents: product.priceCents,
          },
        ],
      },
    },
  });
}

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
      where: { OR: [{ role: "INSTRUCTOR" }, { isInstructor: true }] },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { students, instructors };
}

export async function getUserLessonHoursBalance(userId: string): Promise<number> {
  if (!userId) return 0;
  const wallet = await prisma.userWallet.findUnique({
    where: { userId_type: { userId, type: WalletType.LESSON_HOURS } },
    select: { balance: true },
  });
  return wallet ? Number(wallet.balance) : 0;
}

export async function getActiveLessonBundleProducts() {
  const products = await prisma.product.findMany({
    where: {
      type: ProductType.BUNDLE_CREDIT,
      walletType: WalletType.LESSON_HOURS,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      priceCents: true,
      creditUnits: true,
    },
    orderBy: { creditUnits: "asc" },
  });
  return products
    .filter((p) => p.creditUnits != null && p.creditUnits > 0)
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      priceCents: p.priceCents,
      creditUnits: p.creditUnits as number,
    }));
}

function safeReturnTo(raw: unknown): string {
  const v = typeof raw === "string" ? raw.trim() : "";
  // must be a same-origin relative path; reject absolute URLs, protocol-relative URLs, and backslashes.
  if (!v.startsWith("/")) return "/lessons";
  if (v.startsWith("//") || v.startsWith("/\\")) return "/lessons";
  if (v.includes("\\")) return "/lessons";
  // avoid bouncing back to the form itself
  if (v === "/lessons/new" || v.startsWith("/lessons/new?") || v.startsWith("/lessons/new#")) {
    return "/lessons";
  }
  return v;
}

export async function createLessonSessionFromForm(formData: FormData) {
  const returnTo = safeReturnTo(formData.get("returnTo"));

  const parsed = newLessonFormSchema.safeParse({
    studentId: String(formData.get("studentId") ?? "").trim(),
    instructorId: String(formData.get("instructorId") ?? "").trim(),
    lessonType: String(formData.get("lessonType") ?? "PRIVATE").trim(),
    startsAt: String(formData.get("startsAt") ?? "").trim(),
    durationHours: formData.get("durationHours") ?? 0,
    durationMinutesPart: formData.get("durationMinutesPart") ?? 0,
    bundleProductId: String(formData.get("bundleProductId") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(first?.message ?? "Invalid form data.");
  }

  const {
    studentId,
    instructorId,
    lessonType,
    startsAt: startsAtRaw,
    durationHours,
    durationMinutesPart,
    bundleProductId,
    notes,
  } = parsed.data;

  const durationMinutes = durationHours * 60 + durationMinutesPart;
  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) throw new Error("Invalid start date/time.");
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
  const requiredHours = new Prisma.Decimal(durationMinutes).div(60);

  await prisma.$transaction(async (tx) => {
    // Ensure LESSON_HOURS wallet exists for the student.
    const wallet = await tx.userWallet.upsert({
      where: { userId_type: { userId: studentId, type: WalletType.LESSON_HOURS } },
      update: {},
      create: {
        userId: studentId,
        type: WalletType.LESSON_HOURS,
        unit: WalletUnit.HOUR,
        balance: new Prisma.Decimal(0),
      },
    });

    // Optionally top up the wallet via a BUNDLE_CREDIT product (mirrors createOrderForUser).
    if (bundleProductId) {
      const product = await tx.product.findUnique({ where: { id: bundleProductId } });
      if (!product) throw new Error("Selected product not found.");
      if (!product.isActive) throw new Error(`Product "${product.sku}" is inactive.`);
      if (product.type !== ProductType.BUNDLE_CREDIT) {
        throw new Error("Only bundle products can be added here.");
      }
      if (product.walletType !== WalletType.LESSON_HOURS || product.walletUnit !== WalletUnit.HOUR) {
        throw new Error(`Product "${product.sku}" does not credit LESSON_HOURS.`);
      }
      const creditUnits = product.creditUnits ?? 0;
      if (creditUnits <= 0) {
        throw new Error(`Product "${product.sku}" has no credit units configured.`);
      }
      if (new Prisma.Decimal(creditUnits).lt(requiredHours)) {
        throw new Error(
          `Selected bundle covers only ${creditUnits}h — pick one with at least ${requiredHours.toString()}h.`,
        );
      }

      const order = await tx.order.create({
        data: {
          userId: studentId,
          status: OrderStatus.OPEN,
          totalCents: product.priceCents,
          lines: {
            create: [
              {
                productId: product.id,
                qty: 1,
                unitPriceCents: product.priceCents,
                lineTotalCents: product.priceCents,
                creditUnitsEach: creditUnits,
              },
            ],
          },
        },
        include: { lines: true },
      });

      const line = order.lines[0];
      const updatedWallet = await tx.userWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: creditUnits } },
        select: { id: true, balance: true },
      });

      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          userId: studentId,
          delta: new Prisma.Decimal(creditUnits),
          balanceAfter: updatedWallet.balance,
          reason: WalletLedgerReason.PURCHASE,
          orderId: order.id,
          orderLineId: line.id,
          note: `Purchased ${creditUnits} HOUR(s) — order ${order.id}`,
          idempotencyKey: `purchase:${line.id}`,
        },
      });
    }

    // Verify the wallet has enough hours to cover the lesson.
    const refreshed = await tx.userWallet.findUniqueOrThrow({
      where: { id: wallet.id },
      select: { balance: true },
    });
    if (refreshed.balance.lt(requiredHours)) {
      throw new Error(
        `Student has only ${refreshed.balance.toString()}h remaining — select a bundle product.`,
      );
    }

    // Create session + booking.
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

    const booking = await tx.lessonBooking.create({
      data: {
        sessionId: session.id,
        guestId: studentId,
        status: LessonBookingStatus.CONFIRMED,
      },
      select: { id: true },
    });

    // Consume hours from the wallet (mirrors consumeBundleUnit).
    const consumed = await tx.userWallet.update({
      where: { id: wallet.id, balance: { gte: requiredHours } },
      data: { balance: { decrement: requiredHours } },
      select: { id: true, balance: true },
    });

    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        userId: studentId,
        delta: requiredHours.neg(),
        balanceAfter: consumed.balance,
        reason: WalletLedgerReason.CONSUMPTION,
        lessonBookingId: booking.id,
        note: `Consumed ${requiredHours.toString()} HOUR(s) for lesson ${session.id}`,
        idempotencyKey: `consume:LESSON_HOURS:lesson:${booking.id}`,
      },
    });

    await ensureCommissionForSession(session.id, tx);
  });

  revalidatePath("/lessons");
  revalidatePath(returnTo);
  redirect(returnTo);
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
  commission: true,
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
    await prisma.$transaction(async (tx) => {
      for (const u of updates) {
        await tx.lessonSession.update({
          where: { id: u.id },
          data: {
            startsAt: new Date(u.startsAt),
            endsAt: new Date(u.endsAt),
            instructorId: u.instructorId,
          },
        });
        await ensureCommissionForSession(u.id, tx);
      }
    });
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
  productId?: string | null;
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

        await chargeGuestForSession(tx, {
          guestId: data.guestId,
          lessonType,
          productId: data.productId ?? null,
        });
      }

      await ensureCommissionForSession(s.id, tx);

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
    const session = await prisma.$transaction(async (tx) => {
      const s = await tx.lessonSession.update({
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
          commission: true,
        },
      });
      await ensureCommissionForSession(id, tx);
      return s;
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

    await prisma.$transaction(async (tx) => {
      await tx.lessonBooking.update({
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
      });
      await tx.lessonSession.update({
        where: { id: existing.sessionId },
        data: {
          instructorId: data.instructorId,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          ...(data.lessonType !== undefined && { lessonType: data.lessonType }),
          ...(data.capacity !== undefined && { capacity: data.capacity }),
        },
      });
      await ensureCommissionForSession(existing.sessionId, tx);
    });

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
      commission: true,
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

export async function updateLessonBookingStatus(
  id: string,
  status: LessonBookingStatus,
) {
  try {
    const booking = await prisma.lessonBooking.update({
      where: { id },
      data: { status },
      select: { sessionId: true },
    });
    await ensureCommissionForSession(booking.sessionId);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function addGuestToSession(
  sessionId: string,
  data: { guestId: string; productId: string | null },
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.lessonSession.findUnique({
        where: { id: sessionId },
        select: { id: true, lessonType: true },
      });
      if (!session) throw new Error("Session not found.");

      const existing = await tx.lessonBooking.findUnique({
        where: { sessionId_guestId: { sessionId, guestId: data.guestId } },
        select: { id: true },
      });
      if (existing) {
        throw new Error("This guest is already on this session.");
      }

      const booking = await tx.lessonBooking.create({
        data: {
          sessionId,
          guestId: data.guestId,
          status: LessonBookingStatus.CONFIRMED,
        },
        include: {
          guest: { select: { id: true, name: true, email: true, phone: true } },
        },
      });

      await chargeGuestForSession(tx, {
        guestId: data.guestId,
        lessonType: session.lessonType,
        productId: data.productId,
      });

      await ensureCommissionForSession(sessionId, tx);

      return booking;
    });

    revalidatePath("/bookings/schedule");
    return { success: true, data: result };
  } catch (error) {
    console.error("Add guest to session error:", error);
    return {
      success: false,
      message: `Failed to add guest. ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}