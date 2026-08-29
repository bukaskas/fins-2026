"use server";

import { prisma } from "@/db/prisma";
import { Prisma, WalletType } from "@prisma/client";
import { LessonType, LessonBookingStatus, OrderStatus, ProductType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcryptjs from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { hasCapability, requireCapability } from "@/lib/auth-guard";
import { sendBookingEmail, sendStaffNotificationEmail } from "@/emails";
import {
  KitesurfingBookingFormData,
  kitesurfingBookingFormSchema,
  newLessonFormSchema,
} from "@/lib/validators";
import { ensureCommissionForSession } from "@/lib/actions/commission.actions";
import { ensureSessionRevenue } from "@/lib/actions/session-revenue";
import {
  LESSON_CANONICAL_MINUTES,
  LESSON_TYPE_SKU,
  getDefaultProductForLessonType,
  referenceMinutesFor,
} from "@/lib/lesson-products";

type TxClient = Prisma.TransactionClient;

async function chargeGuestForSession(
  tx: TxClient,
  args: {
    guestId: string;
    lessonType: LessonType;
    durationMinutes: number;
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

  const referenceMinutes = referenceMinutesFor(product);
  const qty =
    args.durationMinutes > 0 && referenceMinutes > 0
      ? new Prisma.Decimal(args.durationMinutes)
          .div(referenceMinutes)
          .toDecimalPlaces(4)
      : new Prisma.Decimal(0);
  const lineTotalCents = Math.round(product.priceCents * qty.toNumber());

  return tx.order.create({
    data: {
      userId: args.guestId,
      status: "OPEN",
      totalCents: lineTotalCents,
      lines: {
        create: [
          {
            productId: product.id,
            qty,
            unitPriceCents: product.priceCents,
            lineTotalCents,
          },
        ],
      },
    },
  });
}

// NOTE: getOrCreateWallet / postWalletLedger moved to lib/wallet.ts — they are
// internal helpers and must not be exposed as server-action endpoints.

export async function getLessonFormUsers() {
  await requireCapability("lessons:manage");
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
  await requireCapability("lessons:view");
  if (!userId) return 0;
  const wallet = await prisma.userWallet.findUnique({
    where: { userId_type: { userId, type: WalletType.LESSON_HOURS } },
    select: { balance: true },
  });
  return wallet ? Number(wallet.balance) : 0;
}

export async function getActiveLessonBundleProducts() {
  await requireCapability("lessons:view");
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
      lessonType: true,
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
      lessonType: p.lessonType,
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
  await requireCapability("lessons:manage");
  const returnTo = safeReturnTo(formData.get("returnTo"));

  const parsed = newLessonFormSchema.safeParse({
    studentId: String(formData.get("studentId") ?? "").trim(),
    instructorId: String(formData.get("instructorId") ?? "").trim(),
    productId: String(formData.get("productId") ?? "").trim(),
    startsAt: String(formData.get("startsAt") ?? "").trim(),
    durationHours: formData.get("durationHours") ?? 0,
    durationMinutesPart: formData.get("durationMinutesPart") ?? 0,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(first?.message ?? "Invalid form data.");
  }

  const {
    studentId,
    instructorId,
    productId,
    startsAt: startsAtRaw,
    durationHours,
    durationMinutesPart,
    notes,
  } = parsed.data;

  const durationMinutes = durationHours * 60 + durationMinutesPart;
  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) throw new Error("Invalid start date/time.");
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Selected product not found.");
    if (!product.isActive) {
      throw new Error(`Product "${product.sku}" is inactive — activate it in /products.`);
    }
    if (product.category !== "LESSONS") {
      throw new Error(`Product "${product.sku}" is not a LESSONS product.`);
    }
    if (!product.lessonType) {
      throw new Error(
        `Product "${product.sku}" has no lesson type configured — set it in /products.`,
      );
    }

    const session = await tx.lessonSession.create({
      data: {
        startsAt,
        endsAt,
        lessonType: product.lessonType,
        capacity: 1,
        instructorId,
        notes,
      },
      select: { id: true },
    });

    const order = await chargeGuestForSession(tx, {
      guestId: studentId,
      lessonType: product.lessonType,
      durationMinutes,
      productId: product.id,
    });

    await tx.lessonBooking.create({
      data: {
        sessionId: session.id,
        guestId: studentId,
        status: LessonBookingStatus.CONFIRMED,
        orderId: order.id,
      },
      select: { id: true },
    });

    await ensureCommissionForSession(session.id, tx);
    await ensureSessionRevenue(session.id, tx);
  });

  revalidatePath("/lessons");
  revalidatePath("/bookings/schedule");
  redirect("/bookings/schedule");
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
  await requireCapability("lessons:view");
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
  await requireCapability("lessons:manage");
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
        await ensureSessionRevenue(u.id, tx);
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
  await requireCapability("lessons:manage");
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
        const durationMinutes = Math.round(
          (s.endsAt.getTime() - s.startsAt.getTime()) / 60000,
        );

        const order = await chargeGuestForSession(tx, {
          guestId: data.guestId,
          lessonType,
          durationMinutes,
          productId: data.productId ?? null,
        });

        await tx.lessonBooking.create({
          data: {
            sessionId: s.id,
            guestId: data.guestId,
            status: LessonBookingStatus.CONFIRMED,
            orderId: order.id,
          },
        });
      }

      await ensureCommissionForSession(s.id, tx);
      await ensureSessionRevenue(s.id, tx);

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
      LESSON_CANONICAL_MINUTES[LessonType.PRIVATE] * 60 * 1000
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
        {
          bookingType: "kitesurfing-course",
          // Unlike createBooking's PENDING rows, this one holds a real seat on
          // a real session (LessonBookingStatus.RESERVED), so it may say so.
          confirmed: true,
        },
      );
    } catch (emailError) {
      console.error("Failed to send booking confirmation email:", emailError);
    }

    try {
      await sendStaffNotificationEmail(
        validated.name,
        validated.email,
        validated.phone,
        startsAt,
        "kitesurfing-course",
        1,
      );
    } catch (emailError) {
      console.error("Failed to send staff notification email:", emailError);
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
    // Public action: never echo internal error details to anonymous callers.
    return {
      success: false,
      message: "Failed to create booking. Please try again or contact us.",
    };
  }
}

export async function updateLessonSession(
  id: string,
  data: {
    productId: string;
    instructorId: string | null;
    startsAt: Date;
    endsAt: Date;
    notes: string | null;
    capacity: number;
  }
) {
  await requireCapability("lessons:manage");
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Snapshot the original start time so we can find the orders that were
      // created near the booking's original session window.
      const original = await tx.lessonSession.findUniqueOrThrow({
        where: { id },
        select: { startsAt: true },
      });

      const product = await tx.product.findUnique({ where: { id: data.productId } });
      if (!product) throw new Error("Selected product not found.");
      if (!product.isActive) {
        throw new Error(`Product "${product.sku}" is inactive — activate it in /products.`);
      }
      if (product.category !== "LESSONS") {
        throw new Error(`Product "${product.sku}" is not a LESSONS product.`);
      }
      if (!product.lessonType) {
        throw new Error(
          `Product "${product.sku}" has no lesson type configured — set it in /products.`,
        );
      }

      const s = await tx.lessonSession.update({
        where: { id },
        data: {
          lessonType: product.lessonType,
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

      const newDurationMinutes = Math.round(
        (data.endsAt.getTime() - data.startsAt.getTime()) / 60000,
      );
      const repricing = await repriceGuestOrdersForSession(tx, {
        originalStartsAt: original.startsAt,
        newProduct: product,
        newDurationMinutes,
        bookings: s.bookings.map((b) => ({
          guestId: b.guestId,
          guestName: b.guest.name ?? b.guest.email,
          orderId: b.orderId,
        })),
      });

      await ensureCommissionForSession(id, tx);
      await ensureSessionRevenue(id, tx);

      return { session: s, repricing };
    });
    revalidatePath("/bookings/schedule");
    return {
      success: true as const,
      data: result.session,
      repricing: result.repricing,
    };
  } catch (error) {
    return {
      success: false as const,
      message: `Failed to update session. ${error instanceof Error ? error.message : String(error)
        }`,
    };
  }
}

type RepricingResult = {
  updated: number;
  skipped: { guestName: string; reason: string }[];
};

async function repriceGuestOrdersForSession(
  tx: TxClient,
  args: {
    originalStartsAt: Date;
    newProduct: {
      id: string;
      priceCents: number;
      lessonType: LessonType | null;
      referenceDurationMinutes: number | null;
    };
    newDurationMinutes: number;
    bookings: { guestId: string; guestName: string; orderId: string | null }[];
  },
): Promise<RepricingResult> {
  const result: RepricingResult = { updated: 0, skipped: [] };
  if (args.bookings.length === 0) return result;

  const dayMs = 24 * 60 * 60 * 1000;
  const windowStart = new Date(args.originalStartsAt.getTime() - dayMs);
  const windowEnd = new Date(args.originalStartsAt.getTime() + dayMs);
  const lessonSkus = Object.values(LESSON_TYPE_SKU);

  const referenceMinutes = referenceMinutesFor(args.newProduct);
  const newQty =
    args.newDurationMinutes > 0 && referenceMinutes > 0
      ? new Prisma.Decimal(args.newDurationMinutes)
          .div(referenceMinutes)
          .toDecimalPlaces(4)
      : new Prisma.Decimal(0);
  const newLineTotal = Math.round(args.newProduct.priceCents * newQty.toNumber());

  for (const booking of args.bookings) {
    // Preferred: the order explicitly linked when the booking was charged.
    // Fallback (legacy bookings without the link): the guest's most recent
    // lesson-SKU order line within ±24h of the original session start.
    const orderLine = booking.orderId
      ? await tx.orderLine.findFirst({
          where: {
            orderId: booking.orderId,
            product: { sku: { in: lessonSkus } },
          },
          select: {
            id: true,
            order: { select: { id: true, status: true } },
          },
        })
      : await tx.orderLine.findFirst({
          where: {
            product: { sku: { in: lessonSkus } },
            order: {
              userId: booking.guestId,
              createdAt: { gte: windowStart, lte: windowEnd },
            },
          },
          orderBy: { order: { createdAt: "desc" } },
          select: {
            id: true,
            order: { select: { id: true, status: true } },
          },
        });

    if (!orderLine) continue;

    if (orderLine.order.status !== OrderStatus.OPEN) {
      result.skipped.push({
        guestName: booking.guestName,
        reason: orderLine.order.status,
      });
      continue;
    }

    await tx.orderLine.update({
      where: { id: orderLine.id },
      data: {
        productId: args.newProduct.id,
        qty: newQty,
        unitPriceCents: args.newProduct.priceCents,
        lineTotalCents: newLineTotal,
      },
    });

    const allLines = await tx.orderLine.findMany({
      where: { orderId: orderLine.order.id },
      select: { lineTotalCents: true },
    });
    const newOrderTotal = allLines.reduce((s, l) => s + l.lineTotalCents, 0);
    await tx.order.update({
      where: { id: orderLine.order.id },
      data: { totalCents: newOrderTotal },
    });

    result.updated += 1;
  }

  return result;
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
  await requireCapability("lessons:manage");
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
              : null,
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
      await ensureSessionRevenue(existing.sessionId, tx);
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
  await requireCapability("lessons:manage");
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
  // Staff can view any instructor's schedule. Users flagged `isInstructor`
  // (whatever their role) can view their own — the /my-schedule page relies
  // on this.
  if (!(await hasCapability("lessons:view"))) {
    const session = await getServerSession(authOptions);
    const user = session?.user as
      | { id?: string; isInstructor?: boolean }
      | undefined;
    if (!user?.isInstructor || user.id !== instructorId) {
      throw new Error("Not authorized");
    }
  }
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
  await requireCapability("lessons:view");
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
  await requireCapability("lessons:manage");
  try {
    const booking = await prisma.lessonBooking.update({
      where: { id },
      data: { status },
      select: { sessionId: true },
    });
    await ensureCommissionForSession(booking.sessionId);
    await ensureSessionRevenue(booking.sessionId);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function addGuestToSession(
  sessionId: string,
  data: { guestId: string; productId: string | null },
) {
  await requireCapability("lessons:book");
  try {
    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.lessonSession.findUnique({
        where: { id: sessionId },
        select: { id: true, lessonType: true, startsAt: true, endsAt: true },
      });
      if (!session) throw new Error("Session not found.");

      const existing = await tx.lessonBooking.findUnique({
        where: { sessionId_guestId: { sessionId, guestId: data.guestId } },
        select: { id: true },
      });
      if (existing) {
        throw new Error("This guest is already on this session.");
      }

      const durationMinutes = Math.round(
        (session.endsAt.getTime() - session.startsAt.getTime()) / 60000,
      );

      const order = await chargeGuestForSession(tx, {
        guestId: data.guestId,
        lessonType: session.lessonType,
        durationMinutes,
        productId: data.productId,
      });

      const booking = await tx.lessonBooking.create({
        data: {
          sessionId,
          guestId: data.guestId,
          status: LessonBookingStatus.CONFIRMED,
          orderId: order.id,
        },
        include: {
          guest: { select: { id: true, name: true, email: true, phone: true } },
        },
      });

      await ensureCommissionForSession(sessionId, tx);
      await ensureSessionRevenue(sessionId, tx);

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