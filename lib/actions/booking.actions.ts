'use server';

import { prisma } from "@/db/prisma";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { BookingDepositData, bookingDepositSchema, BookingFormData, bookingFormSchema, bulkEmailSchema, UpdateBookingData, updateBookingSchema } from "../validators";
import { sendBookingEmail, sendStaffNotificationEmail, sendFullyBookedEmail, sendBulkEmail } from "@/emails/index";
import { Booking, BookingStatus, PaymentMethod, Role } from "@prisma/client";

export type BookingWithAgent = Booking & {
  agent: { id: string; name: string | null; email: string } | null;
};
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { addClosedDate } from "./closedDate.actions";
import { startOfDay, startOfMonth, endOfMonth, getDaysInMonth } from "date-fns";
import { computeBookingTotalCents } from "@/lib/pricing";
import { createPaymentOrder, getFlashOrder } from "@/lib/flash";
import { getAutoConfirmBookings } from "./settings.actions";

const STAFF_ROLES: Role[] = [Role.ADMIN, Role.STAFF, Role.OWNER];

const FLASH_CURRENCY = process.env.FLASH_CURRENCY || "EGP";
const FLASH_MIN_CENTS = 500; // Flash rejects orders below 5 EGP

// A booking in WAITING_PAYMENT auto-cancels this long after it entered the
// status (i.e. after `waitingPaymentAt`) if it hasn't been paid/confirmed.
const WAITING_PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours





export async function createBooking(data: BookingFormData) {
  try {
    const validatedData = bookingFormSchema.parse(data);

    // Gate: block closed dates for non-staff
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role as Role | undefined;
    if (!userRole || !STAFF_ROLES.includes(userRole)) {
      const normalizedDate = startOfDay(validatedData.date);
      const closed = await prisma.closedDate.findUnique({ where: { date: normalizedDate } });
      if (closed) {
        return { success: false, message: "Sorry, this date is fully booked." };
      }
    }

    // Returning customers (matched by email or phone) skip the availability
    // review and go straight to payment.
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: validatedData.email, mode: "insensitive" } },
          { phone: validatedData.phone },
        ],
      },
      select: { id: true },
    });
    const isExisting = !!existingUser;

    // Existing customers always skip review and go straight to payment. When the
    // admin "auto-confirm" toggle is on, brand-new customers do too; otherwise
    // they start as PENDING for availability review.
    const autoConfirm = await getAutoConfirmBookings();
    const goToPayment = isExisting || autoConfirm;

    const booking = await prisma.booking.create({
      data: {
        name: validatedData.name,
        date: validatedData.date,
        email: validatedData.email,
        phone: validatedData.phone,
        service: validatedData.service,
        numberOfPeople: validatedData.numberOfPeople,
        numberOfKids: validatedData.numberOfKids ?? 0,
        totalPriceCents: validatedData.totalPriceCents ?? null,
        instagram: validatedData.instagram?.trim() || null,
        bookingStatus: goToPayment
          ? BookingStatus.WAITING_PAYMENT
          : BookingStatus.PENDING,
        // Start the 24h payment countdown when landing in WAITING_PAYMENT.
        ...(goToPayment ? { waitingPaymentAt: new Date() } : {}),
      },
    });

    const isDayUse = validatedData.service === "day-use";
    const isPharaoh = validatedData.service === "pharaoh-airstyle";
    const includeTickets = isDayUse || isPharaoh;
    // Bookings that go straight to payment (existing customers, or any booking
    // while auto-confirm is on) land on the payment page directly, so skip the
    // "booking request received" guest email for them.
    if (!goToPayment) {
      await sendBookingEmail(
        validatedData.email,
        validatedData.name,
        validatedData.date,
        validatedData.service,
        isDayUse ? validatedData.numberOfPeople : undefined,
        isDayUse ? (validatedData.numberOfKids ?? 0) : undefined,
        isDayUse ? (validatedData.totalPriceCents ?? undefined) : undefined,
        booking.id,
      );
    }
    await sendStaffNotificationEmail(
      validatedData.name,
      validatedData.email,
      validatedData.phone,
      validatedData.date,
      validatedData.service,
      validatedData.numberOfPeople,
      includeTickets ? (validatedData.numberOfKids ?? 0) : undefined,
      includeTickets ? (validatedData.totalPriceCents ?? undefined) : undefined,
      booking.id,
    );

    return ({
      success: true,
      message: `Booking created at ${validatedData.date.toISOString()}`,
      bookingId: booking.id,
      date: booking.date,
      bookingType: booking.service,
    });
  }
  catch (error) {
    console.error('Booking creation error:', error);
    if (isRedirectError(error)) {
      throw error;
    }
    return { success: false, message: `Failed to create booking. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}


export async function getAllBookings() {
  try {
    await cancelExpiredWaitingPayments();
    const bookings = await prisma.booking.findMany({
      include: { agent: { select: { id: true, name: true, email: true } } },
    });
    return { success: true, data: bookings };
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return { success: false, message: `Failed to fetch bookings. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function getBookingsByService(service: string) {
  try {
    const bookings = await prisma.booking.findMany({
      where: { service },
      orderBy: [{ date: 'asc' }],
      include: { agent: { select: { id: true, name: true, email: true } } },
    });
    return { success: true, data: bookings };
  } catch (error) {
    console.error('Error fetching bookings by service:', error);
    return { success: false, message: `Failed to fetch bookings. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export type DayUseMonthlyReport = {
  totals: {
    confirmedBookings: number;
    confirmedPeople: number;
    appliedBookings: number;
    appliedPeople: number;
    declinedBookings: number;
  };
  perDay: { day: number; confirmedPeople: number }[];
};

export async function getDayUseMonthlyReport(opts: {
  year: number;
  month: number; // 1-12
  agentId?: string | null; // undefined / "all" => all agents
}): Promise<
  { success: true; data: DayUseMonthlyReport } | { success: false; message: string }
> {
  try {
    const { year, month, agentId } = opts;
    const monthStart = startOfMonth(new Date(year, month - 1, 1));
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = getDaysInMonth(monthStart);

    const bookings = await prisma.booking.findMany({
      where: {
        service: "day-use",
        date: { gte: monthStart, lte: monthEnd },
        ...(agentId && agentId !== "all" ? { agentId } : {}),
      },
      select: {
        date: true,
        bookingStatus: true,
        numberOfPeople: true,
        numberOfKids: true,
      },
    });

    const perDay = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      confirmedPeople: 0,
    }));

    const totals = {
      confirmedBookings: 0,
      confirmedPeople: 0,
      appliedBookings: 0,
      appliedPeople: 0,
      declinedBookings: 0,
    };

    for (const b of bookings) {
      const people = b.numberOfPeople + (b.numberOfKids ?? 0);
      const isConfirmed = CONFIRMED_STATUSES.includes(b.bookingStatus);
      const isDeclined = DECLINED_STATUSES.includes(b.bookingStatus);
      const dayIndex = new Date(b.date).getDate() - 1;
      const bucket = perDay[dayIndex];

      totals.appliedBookings += 1;
      totals.appliedPeople += people;

      if (isConfirmed) {
        totals.confirmedBookings += 1;
        totals.confirmedPeople += people;
        if (bucket) bucket.confirmedPeople += people;
      } else if (isDeclined) {
        totals.declinedBookings += 1;
      }
    }

    return { success: true, data: { totals, perDay } };
  } catch (error) {
    console.error("Error fetching day-use monthly report:", error);
    return {
      success: false,
      message: `Failed to fetch day-use report. Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function getBookingCountsByDate(statuses?: BookingStatus[]) {
  try {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 4, 0, 23, 59, 59);

    const bookings = await prisma.booking.findMany({
      where: {
        date: { gte: start, lte: end },
        ...(statuses && statuses.length > 0 ? { bookingStatus: { in: statuses } } : {}),
      },
      select: { date: true, numberOfPeople: true, bookingStatus: true },
    });

    type DayBreakdown = {
      confirmedPeople: number;
      confirmedCount: number;
      activePeople: number;
      activeCount: number;
    };
    const empty = (): DayBreakdown => ({
      confirmedPeople: 0,
      confirmedCount: 0,
      activePeople: 0,
      activeCount: 0,
    });

    const map = new Map<string, DayBreakdown>();
    bookings.forEach((b) => {
      const isConfirmed = CONFIRMED_STATUSES.includes(b.bookingStatus);
      const isActive = ACTIVE_PENDING_STATUSES.includes(b.bookingStatus);
      // Declined/canceled/no-response contribute to neither number.
      if (!isConfirmed && !isActive) return;

      const key = b.date.toISOString().split('T')[0];
      const day = map.get(key) ?? empty();
      if (isConfirmed) {
        day.confirmedPeople += b.numberOfPeople;
        day.confirmedCount += 1;
      } else {
        day.activePeople += b.numberOfPeople;
        day.activeCount += 1;
      }
      map.set(key, day);
    });

    return {
      success: true,
      data: Array.from(map.entries()).map(([date, v]) => ({
        date,
        ...v,
        totalPeople: v.confirmedPeople + v.activePeople,
        bookingCount: v.confirmedCount + v.activeCount,
      })),
    };
  } catch (error) {
    console.error('Error fetching booking counts by date:', error);
    return { success: false, message: `Failed to fetch booking counts. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function deleteBooking(id: string) {
  try {
    await prisma.booking.delete({ where: { id } });
    revalidatePath('/bookings', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Error deleting booking:', error);
    return { success: false, message: `Failed to delete booking. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export type AgentStatsRow = {
  agentId: string | null;
  name: string;
  email: string | null;
  touched: number;
  byStatus: Record<BookingStatus, number>;
  confirmedCount: number;
  declinedCount: number;
  pendingCount: number;
  revenueCents: number;
  collectedCents: number;
  peopleCount: number;
  serviceBreakdown: Record<string, number>;
  topService: string | null;
};

export type AgentStatsResult = {
  team: {
    totalBookings: number;
    confirmedCount: number;
    declinedCount: number;
    pendingCount: number;
    unassignedCount: number;
    conversionRate: number;
    revenueCents: number;
    collectedCents: number;
    serviceBreakdown: Record<string, number>;
  };
  perAgent: AgentStatsRow[];
};

const CONFIRMED_STATUSES: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.ARRIVED,
];
// Active but not yet confirmed — counted separately from confirmed on the
// dashboard calendar.
const ACTIVE_PENDING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.REQUEST_SENT,
  BookingStatus.UNDER_REVIEW,
  BookingStatus.WAITING_PAYMENT,
];
const DECLINED_STATUSES: BookingStatus[] = [
  BookingStatus.DECLINED,
  BookingStatus.NO_RESPONSE_EXPIRED,
  BookingStatus.CANCELED,
];

function emptyStatusMap(): Record<BookingStatus, number> {
  return Object.values(BookingStatus).reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as Record<BookingStatus, number>);
}

export async function getAgentStats(
  rangeStart: Date | null,
  rangeEnd: Date | null,
): Promise<{ success: true; data: AgentStatsResult } | { success: false; message: string }> {
  try {
    const where =
      rangeStart && rangeEnd ? { createdAt: { gte: rangeStart, lte: rangeEnd } } : {};

    const [bookings, agents] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          agentId: true,
          service: true,
          bookingStatus: true,
          totalPriceCents: true,
          amountPaidCents: true,
          numberOfPeople: true,
          numberOfKids: true,
          agent: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.user.findMany({
        where: { role: { in: [Role.ADMIN, Role.STAFF] } },
        select: { id: true, name: true, email: true },
      }),
    ]);

    const rowsById = new Map<string | null, AgentStatsRow>();

    for (const a of agents) {
      rowsById.set(a.id, {
        agentId: a.id,
        name: a.name || a.email,
        email: a.email,
        touched: 0,
        byStatus: emptyStatusMap(),
        confirmedCount: 0,
        declinedCount: 0,
        pendingCount: 0,
        revenueCents: 0,
        collectedCents: 0,
        peopleCount: 0,
        serviceBreakdown: {},
        topService: null,
      });
    }

    const ensureRow = (
      key: string | null,
      seedName: string,
      seedEmail: string | null,
    ): AgentStatsRow => {
      const existing = rowsById.get(key);
      if (existing) return existing;
      const row: AgentStatsRow = {
        agentId: key,
        name: seedName,
        email: seedEmail,
        touched: 0,
        byStatus: emptyStatusMap(),
        confirmedCount: 0,
        declinedCount: 0,
        pendingCount: 0,
        revenueCents: 0,
        collectedCents: 0,
        peopleCount: 0,
        serviceBreakdown: {},
        topService: null,
      };
      rowsById.set(key, row);
      return row;
    };

    const teamServiceBreakdown: Record<string, number> = {};
    let teamRevenue = 0;
    let teamCollected = 0;
    let teamConfirmed = 0;
    let teamDeclined = 0;
    let teamPending = 0;
    let unassignedCount = 0;

    for (const b of bookings) {
      const key = b.agentId ?? null;
      const seedName = b.agent ? b.agent.name || b.agent.email : "Unassigned";
      const seedEmail = b.agent?.email ?? null;
      const row = ensureRow(key, seedName, seedEmail);

      row.touched += 1;
      row.byStatus[b.bookingStatus] += 1;

      const isConfirmed = CONFIRMED_STATUSES.includes(b.bookingStatus);
      const isDeclined = DECLINED_STATUSES.includes(b.bookingStatus);

      if (isConfirmed) row.confirmedCount += 1;
      else if (isDeclined) row.declinedCount += 1;
      else row.pendingCount += 1;

      if (isConfirmed) {
        row.revenueCents += b.totalPriceCents ?? 0;
        row.peopleCount += b.numberOfPeople + (b.numberOfKids ?? 0);
      }
      row.collectedCents += b.amountPaidCents;
      row.serviceBreakdown[b.service] = (row.serviceBreakdown[b.service] ?? 0) + 1;

      teamServiceBreakdown[b.service] = (teamServiceBreakdown[b.service] ?? 0) + 1;
      if (isConfirmed) {
        teamConfirmed += 1;
        teamRevenue += b.totalPriceCents ?? 0;
      } else if (isDeclined) {
        teamDeclined += 1;
      } else {
        teamPending += 1;
      }
      teamCollected += b.amountPaidCents;
      if (key === null) unassignedCount += 1;
    }

    for (const row of rowsById.values()) {
      const entries = Object.entries(row.serviceBreakdown);
      if (entries.length > 0) {
        entries.sort((a, b) => b[1] - a[1]);
        row.topService = entries[0][0];
      }
    }

    const perAgent = Array.from(rowsById.values()).sort((a, b) => {
      if (a.agentId === null) return 1;
      if (b.agentId === null) return -1;
      return b.touched - a.touched;
    });

    const totalBookings = bookings.length;
    const decided = teamConfirmed + teamDeclined;
    const conversionRate = decided > 0 ? teamConfirmed / decided : 0;

    return {
      success: true,
      data: {
        team: {
          totalBookings,
          confirmedCount: teamConfirmed,
          declinedCount: teamDeclined,
          pendingCount: teamPending,
          unassignedCount,
          conversionRate,
          revenueCents: teamRevenue,
          collectedCents: teamCollected,
          serviceBreakdown: teamServiceBreakdown,
        },
        perAgent,
      },
    };
  } catch (error) {
    console.error("Error fetching agent stats:", error);
    return {
      success: false,
      message: `Failed to fetch agent stats. Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function getBookingsByDate(date: string, statuses?: BookingStatus[]) {
  try {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    const bookings = await prisma.booking.findMany({
      where: {
        date: { gte: start, lte: end },
        ...(statuses && statuses.length > 0 ? { bookingStatus: { in: statuses } } : {}),
      },
      orderBy: [{ time: 'asc' }, { createdAt: 'asc' }],
      include: { agent: { select: { id: true, name: true, email: true } } },
    });

    return { success: true, data: bookings };
  } catch (error) {
    console.error('Error fetching bookings by date:', error);
    return { success: false, message: `Failed to fetch bookings. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function sendFullyBookedEmails(date: string) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: Role } | undefined)?.role;
    if (!userRole || !STAFF_ROLES.includes(userRole)) {
      return { success: false, message: "Not authorized." };
    }

    const startUTC = new Date(`${date}T00:00:00.000Z`);
    const endUTC = new Date(`${date}T23:59:59.999Z`);
    if (isNaN(startUTC.getTime())) {
      return { success: false, message: "Invalid date." };
    }

    const pending = await prisma.booking.findMany({
      where: {
        date: { gte: startUTC, lte: endUTC },
        bookingStatus: BookingStatus.PENDING,
      },
      select: { id: true, name: true, email: true, date: true },
    });

    const sentIds: string[] = [];
    let skippedNoEmail = 0;
    let failed = 0;

    for (const b of pending) {
      if (!b.email) {
        skippedNoEmail += 1;
        continue;
      }
      try {
        await sendFullyBookedEmail(b.email, b.name, b.date);
        sentIds.push(b.id);
      } catch (e) {
        console.error(`Fully-booked email failed for booking ${b.id}:`, e);
        failed += 1;
      }
    }

    if (sentIds.length > 0) {
      await prisma.booking.updateMany({
        where: { id: { in: sentIds } },
        data: { bookingStatus: BookingStatus.CANCELED },
      });
      revalidatePath('/bookings', 'layout');
    }

    return {
      success: true,
      sent: sentIds.length,
      skippedNoEmail,
      failed,
      totalPending: pending.length,
    };
  } catch (error) {
    console.error('Fully-booked batch error:', error);
    return { success: false, message: `Failed to send emails. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function sendBulkEmails(
  date: string,
  statuses: BookingStatus[],
  subject: string,
  message: string,
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: Role } | undefined)?.role;
    if (!userRole || !STAFF_ROLES.includes(userRole)) {
      return { success: false, message: "Not authorized." };
    }

    const parsed = bulkEmailSchema.safeParse({ date, statuses, subject, message });
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const startUTC = new Date(`${parsed.data.date}T00:00:00.000Z`);
    const endUTC = new Date(`${parsed.data.date}T23:59:59.999Z`);
    if (isNaN(startUTC.getTime())) {
      return { success: false, message: "Invalid date." };
    }

    const recipients = await prisma.booking.findMany({
      where: {
        date: { gte: startUTC, lte: endUTC },
        bookingStatus: { in: parsed.data.statuses },
      },
      select: { id: true, name: true, email: true },
    });

    let sent = 0;
    let skippedNoEmail = 0;
    let failed = 0;

    for (const b of recipients) {
      if (!b.email) {
        skippedNoEmail += 1;
        continue;
      }
      try {
        await sendBulkEmail(b.email, b.name, parsed.data.subject, parsed.data.message);
        sent += 1;
      } catch (e) {
        console.error(`Bulk email failed for booking ${b.id}:`, e);
        failed += 1;
      }
    }

    // Note: this action intentionally does NOT mutate any booking status.
    return {
      success: true,
      sent,
      skippedNoEmail,
      failed,
      totalMatched: recipients.length,
    };
  } catch (error) {
    console.error('Bulk email batch error:', error);
    return { success: false, message: `Failed to send emails. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function updateBooking(id: string, data: UpdateBookingData) {
  try {
    const validatedData = updateBookingSchema.parse(data);
    const newTotalCents = computeBookingTotalCents(
      validatedData.service,
      validatedData.date,
      validatedData.numberOfPeople,
      validatedData.numberOfKids ?? 0,
    );
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        name: validatedData.name,
        date: validatedData.date,
        email: validatedData.email,
        phone: validatedData.phone,
        service: validatedData.service,
        numberOfPeople: validatedData.numberOfPeople,
        numberOfKids: validatedData.numberOfKids,
        amountPaidCents: validatedData.amountPaidCents,
        instructor: validatedData.instructor ?? null,
        time: validatedData.time ?? null,
        ...(newTotalCents !== null ? { totalPriceCents: newTotalCents } : {}),
      },
    });

    revalidatePath('/bookings', 'layout');
    return ({
      success: true,
      message: `Booking updated at ${validatedData.date.toISOString()}`,
      bookingId: updatedBooking.id,
      date: updatedBooking.date
    });
  } catch (error) {
    console.error('Booking update error:', error);
    return { success: false, message: `Failed to update booking. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function getAllDepositPayments() {
  try {
    const payments = await prisma.bookingPayment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: {
            id: true,
            name: true,
            service: true,
            date: true,
            agent: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    return { success: true as const, data: payments };
  } catch (error) {
    console.error("Error fetching deposit payments", error);
    return {
      success: false as const,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete a single deposit payment and re-sync the booking's amountPaidCents.
 * BookingPayment carries no wallet-ledger side effects, so a plain delete +
 * re-aggregate keeps the booking total consistent.
 */
export async function deleteDepositPayment(paymentId: string) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; role?: Role } | undefined;
    if (!user?.role || !STAFF_ROLES.includes(user.role)) {
      return { success: false as const, message: "Not authorized." };
    }

    const payment = await prisma.bookingPayment.findUnique({
      where: { id: paymentId },
      select: { bookingId: true },
    });
    if (!payment) {
      return { success: false as const, message: "Payment not found." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.bookingPayment.delete({ where: { id: paymentId } });

      const { _sum } = await tx.bookingPayment.aggregate({
        where: { bookingId: payment.bookingId },
        _sum: { amountCents: true },
      });

      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { amountPaidCents: _sum.amountCents ?? 0 },
      });
    });

    revalidatePath("/bookings/payments");
    revalidatePath(`/bookings/${payment.bookingId}`);
    return { success: true as const };
  } catch (error) {
    console.error("Error deleting deposit payment", error);
    return {
      success: false as const,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getBookingById(id: string) {
  try {
    await cancelExpiredWaitingPayments();
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { agent: { select: { id: true, name: true, email: true } } },
    });
    return booking;
  } catch (e) {
    console.error("Error fetching booking by id", e);
    return null;
  }
}

/**
 * Cancel any booking still in WAITING_PAYMENT whose 24h window has elapsed.
 *
 * Idempotent by construction: the WHERE clause only matches still-waiting,
 * already-expired rows, so re-running it (on read, or from the cron route) is a
 * no-op once they're canceled. Bookings without a `waitingPaymentAt` (legacy
 * rows) are skipped. Cancellation has no other side effects in this codebase, so
 * a single bulk update is sufficient.
 */
export async function cancelExpiredWaitingPayments() {
  const cutoff = new Date(Date.now() - WAITING_PAYMENT_WINDOW_MS);
  const { count } = await prisma.booking.updateMany({
    where: {
      bookingStatus: BookingStatus.WAITING_PAYMENT,
      waitingPaymentAt: { not: null, lt: cutoff },
    },
    data: { bookingStatus: BookingStatus.CANCELED },
  });
  if (count > 0) revalidatePath('/bookings', 'layout');
  return count;
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        bookingStatus: status,
        ...(userId ? { agentId: userId } : {}),
        // Start (or restart) the 24h payment countdown on entry into
        // WAITING_PAYMENT; the deadline is derived as waitingPaymentAt + 24h.
        ...(status === BookingStatus.WAITING_PAYMENT
          ? { waitingPaymentAt: new Date() }
          : {}),
      },
    });
    revalidatePath('/bookings', 'layout');

    // Auto-close the date if confirmed people reach the 80-person limit
    if (status === BookingStatus.CONFIRMED) {
      const dayStart = startOfDay(booking.date);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      const { _sum } = await prisma.booking.aggregate({
        where: { date: { gte: dayStart, lte: dayEnd }, bookingStatus: BookingStatus.CONFIRMED },
        _sum: { numberOfPeople: true },
      });
      if ((_sum.numberOfPeople ?? 0) >= 80) {
        await addClosedDate(dayStart, "Auto-closed: 80-person daily capacity reached");
      }
    }

    // Generate a Flash payment link when moving into WAITING_PAYMENT.
    // Link creation is non-fatal: the status change still succeeds and the
    // admin can retry from the booking page if it fails.
    if (status === BookingStatus.WAITING_PAYMENT) {
      const linkRes = await createBookingPaymentLink(id);
      if (!linkRes.success) {
        return { success: true, warning: linkRes.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Status update error:', error);
    return { success: false, message: `Failed to update status. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Create (or reuse) a Flash payment link for a booking's outstanding balance.
 * Safe to call repeatedly — if a link already exists it is returned as-is.
 */
export async function createBookingPaymentLink(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return { success: false, message: "Booking not found." };

    // Idempotency: reuse an existing link rather than creating a duplicate
    // Flash order (aggregatorOrderId = booking id is unique on Flash's side).
    if (booking.flashOrderId && booking.paymentLink) {
      return { success: true as const, paymentLink: booking.paymentLink, reused: true };
    }

    if (booking.totalPriceCents == null) {
      return {
        success: false,
        message: "Set the booking total price before creating a payment link.",
      };
    }

    // The online payment is a 50% deposit to confirm the booking; the rest is
    // paid on arrival. Subtract anything already paid so we never overcharge.
    const depositCents = Math.round(booking.totalPriceCents / 2);
    const dueCents = depositCents - booking.amountPaidCents;
    if (dueCents < FLASH_MIN_CENTS) {
      return {
        success: false,
        message: `Deposit must be at least ${FLASH_MIN_CENTS / 100} ${FLASH_CURRENCY} to create a payment link.`,
      };
    }

    const result = await createPaymentOrder({
      aggregatorOrderId: booking.id,
      amountCents: dueCents,
      currency: FLASH_CURRENCY,
      customer: { name: booking.name, phone: booking.phone },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        flashOrderId: result.flashOrderId,
        paymentLink: result.paymentLink,
      },
    });
    revalidatePath('/bookings', 'layout');
    revalidatePath(`/bookings/${bookingId}`);

    return { success: true as const, paymentLink: result.paymentLink };
  } catch (error) {
    console.error('Flash payment link error:', error);
    return {
      success: false,
      message: `Failed to create payment link. ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Apply a verified Flash webhook event to a booking.
 *
 * Signature verification happens in the route before this is called. This
 * function is idempotent (keyed on the Flash transaction id) and only records a
 * payment + confirms the booking on a "succeeded" event. Returns `retry: true`
 * only for unexpected failures so the route can signal Flash to retry.
 */
export async function recordFlashPayment(payload: Record<string, unknown>) {
  try {
    const transactionId = String(payload.transactionId ?? "");
    const aggregatorOrderId = String(payload.aggregatorOrderId ?? "");
    const status = String(payload.status ?? "");
    const order = (payload.order ?? {}) as Record<string, unknown>;
    const paidAmountCents = Number(
      payload.PaidAmountCents ?? order.amountCents ?? 0
    );

    if (!transactionId || !aggregatorOrderId) {
      console.warn("Flash webhook missing transactionId/aggregatorOrderId", {
        transactionId,
        aggregatorOrderId,
      });
      return { success: true, ignored: true as const };
    }

    // Only succeeded payments mutate the booking. Log everything else.
    if (status !== "succeeded") {
      console.info(`Flash webhook ignored (status=${status})`, {
        aggregatorOrderId,
        transactionId,
      });
      return { success: true, ignored: true as const };
    }

    const booking = await prisma.booking.findUnique({
      where: { id: aggregatorOrderId },
      select: { id: true },
    });
    if (!booking) {
      console.warn("Flash webhook for unknown booking", { aggregatorOrderId });
      return { success: true, ignored: true as const };
    }

    if (!Number.isFinite(paidAmountCents) || paidAmountCents <= 0) {
      console.warn("Flash webhook with invalid paid amount", {
        aggregatorOrderId,
        paidAmountCents,
      });
      return { success: true, ignored: true as const };
    }

    const applied = await applyFlashPayment({
      bookingId: booking.id,
      amountCents: paidAmountCents,
      idempotencyKey: transactionId,
    });
    return { success: true, ...applied };
  } catch (error) {
    console.error("Flash webhook processing error:", error);
    // Unexpected error — let Flash retry.
    return {
      success: false,
      retry: true as const,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Record a Flash payment against a booking and confirm it. Shared by the
 * webhook and the manual status-check so the two paths can't double-record:
 *  - same idempotency key (DB unique) → no-op
 *  - booking already has any Flash-originated payment → no-op
 *    (the link is always for the 50% deposit, so one per booking)
 */
async function applyFlashPayment(opts: {
  bookingId: string;
  amountCents: number;
  idempotencyKey: string;
}) {
  const { bookingId, amountCents, idempotencyKey } = opts;

  const sameKey = await prisma.bookingPayment.findUnique({
    where: { flashTransactionId: idempotencyKey },
    select: { id: true },
  });
  if (sameKey) return { duplicate: true as const };

  const existingFlash = await prisma.bookingPayment.findFirst({
    where: { bookingId, flashTransactionId: { not: null } },
    select: { id: true },
  });
  if (existingFlash) return { duplicate: true as const };

  // Mirror payBookingDeposit: record the payment, re-aggregate, update booking.
  await prisma.$transaction(async (tx) => {
    await tx.bookingPayment.create({
      data: {
        bookingId,
        amountCents,
        method: PaymentMethod.CARD,
        reference: idempotencyKey,
        flashTransactionId: idempotencyKey,
      },
    });

    const { _sum } = await tx.bookingPayment.aggregate({
      where: { bookingId },
      _sum: { amountCents: true },
    });

    await tx.booking.update({
      where: { id: bookingId },
      data: { amountPaidCents: _sum.amountCents ?? 0 },
    });
  });

  // Reuse CONFIRMED side-effects (revalidation, 80-person auto-close).
  await updateBookingStatus(bookingId, BookingStatus.CONFIRMED);
  revalidatePath(`/bookings/${bookingId}`);

  return { confirmed: true as const };
}

/**
 * Pull the live order status from Flash and, if paid, confirm the booking.
 * A webhook-free fallback/reconciliation path (idempotent with the webhook).
 */
export async function checkBookingPaymentStatus(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true },
    });
    if (!booking) return { success: false, message: "Booking not found." };

    const order = await getFlashOrder(bookingId);
    const status = order.status ?? "unknown";

    if (status !== "succeeded") {
      return { success: true as const, status, confirmed: false as const };
    }

    const amountCents = order.amountCents ?? 0;
    if (amountCents <= 0) {
      return { success: false, message: "Flash returned no amount for this order." };
    }

    const applied = await applyFlashPayment({
      bookingId,
      amountCents,
      idempotencyKey: order.id ?? `flash-order-${bookingId}`,
    });

    return { success: true as const, status, confirmed: true as const, ...applied };
  } catch (error) {
    console.error("Check payment status error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function updateBookingParty(id: string, adults: number, kids: number) {
  try {
    if (!Number.isInteger(adults) || adults < 1) {
      return { success: false, message: "Adults must be a whole number ≥ 1." };
    }
    if (!Number.isInteger(kids) || kids < 0) {
      return { success: false, message: "Kids must be a whole number ≥ 0." };
    }
    const existing = await prisma.booking.findUnique({
      where: { id },
      select: { service: true, date: true },
    });
    if (!existing) {
      return { success: false, message: "Booking not found." };
    }
    const newTotalCents = computeBookingTotalCents(existing.service, existing.date, adults, kids);
    await prisma.booking.update({
      where: { id },
      data: {
        numberOfPeople: adults,
        numberOfKids: kids,
        ...(newTotalCents !== null ? { totalPriceCents: newTotalCents } : {}),
      },
    });
    revalidatePath('/bookings', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Party update error:', error);
    return { success: false, message: `Failed to update party. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function payBookingDeposit(bookingId: string, data: BookingDepositData) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; role?: Role } | undefined;
    if (!user?.role || !STAFF_ROLES.includes(user.role)) {
      return { success: false, message: "Not authorized." };
    }

    const validated = bookingDepositSchema.parse(data);

    const amountPaidCents = await prisma.$transaction(async (tx) => {
      await tx.bookingPayment.create({
        data: {
          bookingId,
          amountCents: validated.amountCents,
          method: validated.method,
          reference: validated.reference ?? null,
          actorId: user.id ?? null,
        },
      });

      const { _sum } = await tx.bookingPayment.aggregate({
        where: { bookingId },
        _sum: { amountCents: true },
      });
      const total = _sum.amountCents ?? 0;

      await tx.booking.update({
        where: { id: bookingId },
        data: { amountPaidCents: total },
      });

      return total;
    });

    // Reuse the CONFIRMED side-effects (agent assignment, revalidation, 80-person auto-close).
    await updateBookingStatus(bookingId, BookingStatus.CONFIRMED);
    revalidatePath(`/bookings/${bookingId}`);

    return { success: true, amountPaidCents };
  } catch (error) {
    console.error('Booking deposit error:', error);
    return { success: false, message: `Failed to record deposit. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function updateBookingAmountPaid(id: string, amountPaidCents: number) {
  try {
    await prisma.booking.update({ where: { id }, data: { amountPaidCents } });
    revalidatePath('/bookings', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Amount paid update error:', error);
    return { success: false, message: `Failed to update payment. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function getFutureKitesurfingBookings() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookings = await prisma.booking.findMany({
      where: {
        service: 'kitesurfing-course',
        date: { gte: today },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      include: { agent: { select: { id: true, name: true, email: true } } },
    });

    return { success: true, data: bookings };
  } catch (error) {
    console.error('Error fetching future kitesurfing bookings:', error);
    return { success: false, message: `Failed to fetch bookings. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function getBookingsByDateRange(from: string, to: string) {
  try {
    const start = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T23:59:59.999Z`);

    const bookings = await prisma.booking.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      include: { agent: { select: { id: true, name: true, email: true } } },
    });

    return { success: true, data: bookings };
  } catch (error) {
    console.error('Error fetching bookings by date range:', error);
    return { success: false, message: `Failed to fetch bookings. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function batchUpdateBookingSchedule(
  updates: { id: string; time: string | null; instructor: string | null }[]
) {
  try {
    await prisma.$transaction(
      updates.map((u) =>
        prisma.booking.update({
          where: { id: u.id },
          data: { time: u.time, instructor: u.instructor },
        })
      )
    );
    return { success: true, message: 'Schedule updated successfully.' };
  } catch (error) {
    console.error('Batch update error:', error);
    return { success: false, message: `Failed to update schedule. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function getFutureBookingPeopleTotalsByDate() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureBookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: today,
        },
      },
      select: {
        date: true,
        numberOfPeople: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group bookings by date and sum numberOfPeople
    const totalsMap = new Map<string, number>();
    futureBookings.forEach((booking) => {
      const dateKey = booking.date.toISOString().split('T')[0];
      const current = totalsMap.get(dateKey) || 0;
      totalsMap.set(dateKey, current + booking.numberOfPeople);
    });

    // Convert to array of { date, totalPeople }
    const totals = Array.from(totalsMap.entries())
      .map(([dateStr, totalPeople]) => ({
        date: new Date(dateStr),
        totalPeople,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return { success: true, data: totals };
  } catch (error) {
    console.error('Error fetching future booking totals:', error);
    return { success: false, message: `Failed to fetch booking totals. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function assignBookingAgent(bookingId: string, agentId: string | null) {
  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { agentId },
    });
    revalidatePath('/bookings', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Agent assignment error:', error);
    return { success: false, message: `Failed to assign agent. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function createDayUseBookingAdmin(data: {
  name: string;
  email: string;
  phone: string;
  date: Date;
  numberOfPeople: number;
  numberOfKids: number;
  bookingStatus: BookingStatus;
  amountPaidCents: number;
}) {
  try {
    const booking = await prisma.booking.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        date: data.date,
        service: "day-use",
        numberOfPeople: data.numberOfPeople,
        numberOfKids: data.numberOfKids,
        bookingStatus: data.bookingStatus,
        amountPaidCents: data.amountPaidCents,
      },
    });
    revalidatePath("/bookings");
    revalidatePath("/bookings/day-use");
    return { success: true, bookingId: booking.id };
  } catch (error) {
    return { success: false, message: `Failed to create booking: ${error instanceof Error ? error.message : String(error)}` };
  }
}

