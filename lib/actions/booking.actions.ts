'use server';

import { prisma } from "@/db/prisma";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { BookingDepositData, bookingDepositSchema, BookingFormData, bookingFormSchema, bulkEmailSchema, CorporateBookingData, corporateBookingSchema, KaiCommunityBookingData, kaiCommunityBookingSchema, KiteCommunityBookingData, kiteCommunityBookingSchema, UpdateBookingData, updateBookingSchema } from "../validators";
import { sendBookingEmail, sendStaffNotificationEmail, sendFullyBookedEmail, sendBulkEmail } from "@/emails/index";
import {
  Booking,
  BookingContactChannel,
  BookingContactOutcome,
  BookingEventSource,
  BookingStatus,
  PaymentMethod,
  Prisma,
  Role,
} from "@prisma/client";

export type BookingWithAgent = Booking & {
  agent: { id: string; name: string | null; email: string } | null;
};
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { currentUserId, hasCapability, requireCapability } from "@/lib/auth-guard";
import { roleHasCapability } from "@/lib/permissions";
import { upsertClosedDate } from "@/lib/closed-dates";
import {
  calculateDayUsePrice,
  computeBookingTotalCents,
  KITE_COMMUNITY_PRICE_CENTS,
  priceFromUnitRates,
  ratesFromSnapshot,
  snapshotFromRate,
  type QuotedDayUseRates,
} from "@/lib/pricing";
import {
  DAY_USE_BOOKING_HORIZON_MONTHS,
  dateKeyFromUtcMidnight,
  dateKeyInCairo,
  isWithinDayUseBookingWindow,
} from "@/lib/date-keys";
import { createPaymentOrder, getFlashOrder, verifyWebhookSignature } from "@/lib/flash";
import { getAutoConfirmBookings } from "./settings.actions";
import { BOOKINGS_PAGE_SIZE, DAILY_CAPACITY, PHARAOH_AIRSTYLE_DATE_KEY, WAITING_PAYMENT_WINDOW_MS } from "@/lib/constants";
import {
  NEEDS_CONTACT_STATUSES,
  NEEDS_REVIEW_STATUSES,
  parseBookingStatusFilter,
} from "@/lib/bookings/status";
import { CAPACITY_STATUSES } from "@/lib/bookings/capacity";
import { depositCents } from "@/lib/bookings/payment-window";
import { emailPriceBreakdown, sendPaymentRequestEmail } from "@/lib/bookings/guest-emails";
import {
  ACTIVE_PENDING_STATUSES,
  buildAgentStats,
  CONFIRMED_STATUSES,
  DECLINED_STATUSES,
  type AgentStatsResult,
} from "@/lib/bookings/agent-stats";

const FLASH_CURRENCY = process.env.FLASH_CURRENCY || "EGP";
const FLASH_MIN_CENTS = 500; // Flash rejects orders below 5 EGP

/**
 * The id we hand Flash for a booking's Nth payment link.
 *
 * Flash treats `aggregatorOrderId` as unique forever and rejects a repeat with
 * DUPLICATE_ORDER, so a re-issued link cannot send the booking id again. Attempt
 * 1 stays bare — every link created before regeneration existed is an attempt 1,
 * and those orders are still live on Flash's side.
 */
function flashAggregatorId(bookingId: string, attempt: number): string {
  return attempt > 1 ? `${bookingId}-${attempt}` : bookingId;
}

/**
 * The inverse: recover the booking id from whatever Flash echoes back to us.
 *
 * Anchored to the UUID shape rather than splitting on the last hyphen — a
 * booking id ends in a 12-character group that is often all digits
 * (`…-446655440000`), so a naive `-(\d+)$` strip would mangle a *bare* id into
 * something Postgres rejects as malformed. Returns null for anything that
 * isn't UUID-prefixed, so the caller can ignore the event instead of throwing
 * (a throw would 500, and Flash would retry it forever).
 */
const BOOKING_UUID_PREFIX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function bookingIdFromAggregatorId(aggregatorOrderId: string): string | null {
  const match = BOOKING_UUID_PREFIX.exec(aggregatorOrderId);
  return match ? match[0] : null;
}

// A booking in WAITING_PAYMENT auto-cancels this long after it entered the
// status (i.e. after `waitingPaymentAt`) if it hasn't been paid/confirmed.

const BUSINESS_TIME_ZONE = "Africa/Cairo";

// Booking dates and closed dates are stored as UTC midnights; all calendar-day
// math in this module works in UTC to stay server-timezone independent.
function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Dates are UTC midnights, so day arithmetic is plain millisecond arithmetic. */
function addUtcDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Append to the booking history (see `BookingEvent`). Never throws: the history
 * only feeds reporting, so a failed insert must not undo or fail the change it
 * describes. Call it after the write has committed, not inside a transaction.
 */
async function logBookingEvents(events: Prisma.BookingEventCreateManyInput[]) {
  if (events.length === 0) return;
  try {
    await prisma.bookingEvent.createMany({ data: events });
  } catch (error) {
    console.error("Booking event log error:", error);
  }
}

/**
 * Cancel WAITING_PAYMENT bookings matching `where` whose 24h window has
 * elapsed, recording each as a cron cancellation. Idempotent: the WHERE clause
 * only matches still-waiting, already-expired rows.
 */
async function expireWaitingPayments(where: Prisma.BookingWhereInput = {}): Promise<number> {
  const expired = await prisma.booking.updateManyAndReturn({
    where: {
      ...where,
      bookingStatus: BookingStatus.WAITING_PAYMENT,
      waitingPaymentAt: { not: null, lt: new Date(Date.now() - WAITING_PAYMENT_WINDOW_MS) },
    },
    data: { bookingStatus: BookingStatus.CANCELED },
    select: { id: true },
  });
  await logBookingEvents(
    expired.map((b) => ({
      bookingId: b.id,
      source: BookingEventSource.CRON,
      fromStatus: BookingStatus.WAITING_PAYMENT,
      toStatus: BookingStatus.CANCELED,
    })),
  );
  return expired.length;
}

/**
 * Booking dates are stored as UTC midnights, but "today" belongs to the venue's
 * Cairo calendar. Convert Cairo's current date key into that storage format.
 */
function cairoBusinessDayStart(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
  ));
}

/** Apply the capacity side-effect after a booking has become confirmed. */
async function autoCloseConfirmedBookingDate(date: Date) {
  const dayStart = utcDayStart(date);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  const { _sum } = await prisma.booking.aggregate({
    where: {
      date: { gte: dayStart, lte: dayEnd },
      bookingStatus: { in: CAPACITY_STATUSES },
    },
    _sum: { numberOfPeople: true, numberOfKids: true },
  });
  const capacityPeople =
    (_sum.numberOfPeople ?? 0) + (_sum.numberOfKids ?? 0);
  if (capacityPeople >= DAILY_CAPACITY) {
    await upsertClosedDate(
      dayStart,
      `Auto-closed: ${DAILY_CAPACITY}-person daily capacity reached`,
    );
  }
}





export async function createBooking(
  data: BookingFormData,
  /** The Day Use unit rates the guest reviewed. A mismatch is refused, never
   *  silently booked at the new amount (see PLAN.md decision 19). */
  quotedRates?: QuotedDayUseRates,
) {
  try {
    const validatedData = bookingFormSchema.parse(data);
    const isDayUseService = validatedData.service === "day-use";

    // Gate: block closed dates for non-staff. Closed dates are stored as UTC
    // midnights (see lib/closed-dates.ts), so compare in UTC.
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string; role?: Role } | undefined;
    const userRole = sessionUser?.role;
    // A booking staff create themselves is theirs from the start.
    const staffCreatorId = roleHasCapability(userRole, "bookings:manage")
      ? sessionUser?.id ?? null
      : null;
    if (!roleHasCapability(userRole, "bookings:manage")) {
      const normalizedDate = utcDayStart(validatedData.date);
      // The guest calendar only offers Cairo today through the six-month
      // horizon; the same window is enforced here so it can't be bypassed.
      if (
        isDayUseService &&
        !isWithinDayUseBookingWindow(dateKeyFromUtcMidnight(normalizedDate))
      ) {
        return {
          success: false,
          message: `Please pick a date between today and ${DAY_USE_BOOKING_HORIZON_MONTHS} months from now.`,
        };
      }
      const closed = await prisma.closedDate.findUnique({ where: { date: normalizedDate } });
      if (closed) {
        return { success: false, message: "Sorry, this date is fully booked." };
      }
    }

    // Never trust the client's price: recompute for services with known
    // pricing (day-use, pharaoh-airstyle). The client value is only a display
    // hint, kept solely for services without server-side pricing.
    //
    // Day use keeps the whole breakdown rather than just the total, so the
    // confirmation email can print line items that are guaranteed to sum to
    // the number stored on the row.
    const dayUseBreakdown = isDayUseService
      ? calculateDayUsePrice(
          validatedData.date,
          validatedData.numberOfPeople,
          validatedData.numberOfKids ?? 0,
        )
      : null;

    // The rate moved between the guest's review and this request (a pricing
    // deploy mid-visit). Refuse in either direction and hand back the current
    // rates so the form can show them for explicit review. An old bundle that
    // predates `quotedRates` is checked on the total it sent instead.
    if (dayUseBreakdown) {
      const quoteIsStale = quotedRates
        ? quotedRates.adultUnitCents !== dayUseBreakdown.adultUnitCents ||
          quotedRates.kidsUnitCents !== dayUseBreakdown.kidsUnitCents
        : validatedData.totalPriceCents != null &&
          validatedData.totalPriceCents !== dayUseBreakdown.totalCents;
      if (quoteIsStale) {
        return {
          success: false,
          code: "PRICE_CHANGED" as const,
          message: "The price for this date has changed since you picked it.",
          rates: {
            dateKey: dateKeyFromUtcMidnight(validatedData.date),
            adultUnitCents: dayUseBreakdown.adultUnitCents,
            kidsUnitCents: dayUseBreakdown.kidsUnitCents,
            rateType: dayUseBreakdown.rateType,
          },
        };
      }
    }
    const serverTotalCents =
      dayUseBreakdown?.totalCents ??
      computeBookingTotalCents(
        validatedData.service,
        validatedData.date,
        validatedData.numberOfPeople,
        validatedData.numberOfKids ?? 0,
      );
    const totalPriceCents = serverTotalCents ?? validatedData.totalPriceCents ?? null;

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
        totalPriceCents,
        ...(dayUseBreakdown ? snapshotFromRate(dayUseBreakdown) : {}),
        instagram: validatedData.instagram?.trim() || null,
        bookingStatus: goToPayment
          ? BookingStatus.WAITING_PAYMENT
          : BookingStatus.PENDING,
        // Start the 24h payment countdown when landing in WAITING_PAYMENT.
        ...(goToPayment ? { waitingPaymentAt: new Date() } : {}),
        agentId: staffCreatorId,
      },
    });
    await logBookingEvents([
      {
        bookingId: booking.id,
        source: staffCreatorId ? BookingEventSource.STAFF : BookingEventSource.GUEST,
        actorId: staffCreatorId,
        toStatus: booking.bookingStatus,
        toAgentId: staffCreatorId,
      },
    ]);

    const isDayUse = validatedData.service === "day-use";
    const isPharaoh = validatedData.service === "pharaoh-airstyle";
    const includeTickets = isDayUse || isPharaoh;
    // Bookings that go straight to payment (existing customers, or any booking
    // while auto-confirm is on) skip the review, so they get the "pay your
    // deposit" email instead of the request receipt: the payment page they land
    // on is gone once the tab is closed, and the hold still lapses in 24h.
    if (goToPayment) {
      await sendPaymentRequestEmail(booking.id);
    } else {
      await sendBookingEmail(
        validatedData.email,
        validatedData.name,
        validatedData.date,
        {
          bookingType: validatedData.service,
          numberOfPeople: isDayUse ? validatedData.numberOfPeople : undefined,
          numberOfKids: isDayUse ? (validatedData.numberOfKids ?? 0) : undefined,
          priceBreakdown: dayUseBreakdown ?? undefined,
          bookingId: booking.id,
          // These rows are PENDING until someone reviews them, so the guest
          // gets a receipt, not a confirmation.
          stage: "request",
        },
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
      includeTickets ? (totalPriceCents ?? undefined) : undefined,
      booking.id,
    );

    return ({
      success: true,
      message: `Booking received for ${validatedData.date.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      })}`,
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
    // Public action: never echo internal error details to anonymous callers.
    return { success: false, message: "Failed to create booking. Please try again or contact us." };
  }
}


/** Pharaoh Airstyle day, stored the way the calendar stores dates. */
const PHARAOH_AIRSTYLE_DATE = new Date(`${PHARAOH_AIRSTYLE_DATE_KEY}T00:00:00.000Z`);
const KAI_COMMUNITY_NOTE = "Kai owner, Pharaoh airstyle";
const KITE_COMMUNITY_NOTE = "Kite community, Pharaoh airstyle";

/**
 * Kai unit owners & community registration for Pharaoh Airstyle. Unlike a
 * public booking there's no review and no payment window: the row is CONFIRMED
 * on insert, with no charge. The unit number travels in the booking comment,
 * which is also how staff tell these apart from paying day-use guests.
 */
export async function createKaiCommunityBooking(data: KaiCommunityBookingData) {
  try {
    const v = kaiCommunityBookingSchema.parse(data);
    const date = PHARAOH_AIRSTYLE_DATE;
    if (dateKeyFromUtcMidnight(date) < dateKeyInCairo()) {
      return { success: false, message: "Registration for this day is closed." };
    }

    const booking = await prisma.booking.create({
      data: {
        name: v.name,
        date,
        email: v.email,
        phone: v.phone,
        service: "day-use",
        numberOfPeople: v.numberOfPeople,
        numberOfKids: v.numberOfKids,
        totalPriceCents: 0,
        bookingStatus: BookingStatus.CONFIRMED,
        contacts: {
          create: {
            channel: BookingContactChannel.OTHER,
            outcome: BookingContactOutcome.REACHED,
            note: `${KAI_COMMUNITY_NOTE} · Unit ${v.unitNumber}`,
          },
        },
      },
    });
    await logBookingEvents([
      {
        bookingId: booking.id,
        source: BookingEventSource.GUEST,
        toStatus: booking.bookingStatus,
      },
    ]);

    await sendBookingEmail(v.email, v.name, date, {
      bookingType: "day-use",
      numberOfPeople: v.numberOfPeople,
      numberOfKids: v.numberOfKids,
      bookingId: booking.id,
      stage: "confirmed",
      amountPaidCents: 0,
      balanceDueCents: 0,
    });
    await sendStaffNotificationEmail(
      v.name,
      v.email,
      v.phone,
      date,
      "day-use",
      v.numberOfPeople,
      v.numberOfKids,
      0,
      booking.id,
    );

    return { success: true as const, message: "You're confirmed!", bookingId: booking.id };
  } catch (error) {
    console.error("Kai community booking error:", error);
    return { success: false, message: "Failed to register. Please try again or contact us." };
  }
}

/** Kite community registration: confirmed on insert, 800 EGP per person due on arrival. */
export async function createKiteCommunityBooking(data: KiteCommunityBookingData) {
  try {
    const v = kiteCommunityBookingSchema.parse(data);
    const date = PHARAOH_AIRSTYLE_DATE;
    if (dateKeyFromUtcMidnight(date) < dateKeyInCairo()) {
      return { success: false, message: "Registration for this day is closed." };
    }
    const totalCents = v.numberOfPeople * KITE_COMMUNITY_PRICE_CENTS;

    const booking = await prisma.booking.create({
      data: {
        name: v.name,
        date,
        email: v.email,
        phone: v.phone,
        service: "day-use",
        numberOfPeople: v.numberOfPeople,
        numberOfKids: 0,
        totalPriceCents: totalCents,
        bookingStatus: BookingStatus.CONFIRMED,
        contacts: {
          create: {
            channel: BookingContactChannel.OTHER,
            outcome: BookingContactOutcome.REACHED,
            note: `${KITE_COMMUNITY_NOTE} · Spot ${v.localSpot}`,
          },
        },
      },
    });
    await logBookingEvents([
      {
        bookingId: booking.id,
        source: BookingEventSource.GUEST,
        toStatus: booking.bookingStatus,
      },
    ]);

    await sendBookingEmail(v.email, v.name, date, {
      bookingType: "day-use",
      numberOfPeople: v.numberOfPeople,
      numberOfKids: 0,
      bookingId: booking.id,
      stage: "confirmed",
      amountPaidCents: 0,
      balanceDueCents: totalCents,
    });
    await sendStaffNotificationEmail(
      v.name,
      v.email,
      v.phone,
      date,
      "day-use",
      v.numberOfPeople,
      0,
      totalCents,
      booking.id,
    );

    return { success: true as const, message: "You're confirmed!", bookingId: booking.id };
  } catch (error) {
    console.error("Kite community booking error:", error);
    return { success: false, message: "Failed to register. Please try again or contact us." };
  }
}

// ── /bookings list query ─────────────────────────────────────────────────────
//
// Filtering, sorting and pagination all run in Postgres. Nothing here loads the
// whole table: the list is capped by `limit`, the counts are aggregates, and the
// row shape is the columns the UI actually renders.

/** Exactly the columns a booking row renders — not all 22 of them. */
const BOOKING_ROW_SELECT = {
  id: true,
  name: true,
  date: true,
  time: true,
  phone: true,
  email: true,
  service: true,
  numberOfPeople: true,
  numberOfKids: true,
  instructor: true,
  instagram: true,
  bookingStatus: true,
  totalPriceCents: true,
  amountPaidCents: true,
  createdAt: true,
  agent: { select: { id: true, name: true, email: true } },
} satisfies Prisma.BookingSelect;

export type BookingRow = Prisma.BookingGetPayload<{ select: typeof BOOKING_ROW_SELECT }>;

/** Raw search params from /bookings, already string-typed. */
export type BookingsQuery = {
  status?: string;
  service?: string;
  agent?: string;
  q?: string;
  range?: string;
  sort?: string;
  dir?: string;
  /** "1" restricts to bookings with nothing paid yet. */
  unpaid?: string;
  limit?: number;
};

export type BookingsPageResult = {
  rows: BookingRow[];
  /** Rows matching the filters, ignoring `limit`. */
  total: number;
  hasMore: boolean;
  /** Unfiltered counts behind the four stat chips. */
  stats: { today: number; week: number; waiting: number; unpaid: number };
};

const BOOKINGS_MAX_LIMIT = 2000;

function bookingsWhere(query: BookingsQuery): Prisma.BookingWhereInput {
  const { status, service, agent, q, unpaid, range = "upcoming" } = query;
  const where: Prisma.BookingWhereInput = {};

  const statuses = parseBookingStatusFilter(status);
  if (statuses.length === 1) {
    where.bookingStatus = statuses[0];
  } else if (statuses.length > 1) {
    where.bookingStatus = { in: statuses };
  }

  if (service && service !== "all") where.service = service;

  if (unpaid === "1") where.amountPaidCents = 0;

  if (agent === "unassigned") where.agentId = null;
  else if (agent && agent !== "all") where.agentId = agent;

  const term = q?.trim();
  if (term) {
    const matches: Prisma.BookingWhereInput[] = [
      { name:  { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { phone: { contains: term } },
    ];

    // Pasted phone numbers often contain spaces or punctuation while stored
    // values are compact (for example, "+20 100 008 7322" vs "+201000087322").
    const phoneDigits = term.replace(/\D/g, "");
    const isPhoneLike = phoneDigits.length >= 4 && /^[+\d\s().-]+$/.test(term);
    if (isPhoneLike && phoneDigits !== term) {
      matches.push({ phone: { contains: phoneDigits } });
    }

    where.OR = matches;
  }

  const todayStart = utcDayStart(new Date());
  if (range === "today") {
    where.date = { gte: todayStart, lt: addUtcDays(todayStart, 1) };
  } else if (range === "week") {
    where.date = { gte: todayStart, lt: addUtcDays(todayStart, 8) };
  } else if (range !== "all") {
    where.date = { gte: todayStart }; // "upcoming" — the default
  }

  return where;
}

function bookingsOrderBy(sort?: string, dir?: string): Prisma.BookingOrderByWithRelationInput[] {
  // `id` is the tiebreaker so paging never repeats or drops a row.
  if (sort === "created") {
    return [{ createdAt: dir === "asc" ? "asc" : "desc" }, { id: "asc" }];
  }
  return [{ date: "asc" }, { time: { sort: "asc", nulls: "last" } }, { id: "asc" }];
}

export async function getBookingsPage(query: BookingsQuery): Promise<BookingsPageResult> {
  await requireCapability("bookings:manage");

  const where = bookingsWhere(query);
  const limit = Math.min(Math.max(query.limit ?? BOOKINGS_PAGE_SIZE, 1), BOOKINGS_MAX_LIMIT);

  const todayStart = utcDayStart(new Date());
  const tomorrowStart = addUtcDays(todayStart, 1);
  const weekEnd = addUtcDays(todayStart, 8);

  const [rows, total, today, week, waiting, unpaid] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: bookingsOrderBy(query.sort, query.dir),
      select: BOOKING_ROW_SELECT,
      take: limit + 1, // one extra row is how we know there is a next page
    }),
    prisma.booking.count({ where }),
    prisma.booking.count({ where: { date: { gte: todayStart, lt: tomorrowStart } } }),
    prisma.booking.count({ where: { date: { gte: todayStart, lt: weekEnd } } }),
    prisma.booking.count({ where: { bookingStatus: BookingStatus.WAITING_PAYMENT } }),
    prisma.booking.count({
      where: { bookingStatus: BookingStatus.CONFIRMED, amountPaidCents: 0 },
    }),
  ]);

  const hasMore = rows.length > limit;

  return {
    rows: hasMore ? rows.slice(0, limit) : rows,
    total,
    hasMore,
    stats: { today, week, waiting, unpaid },
  };
}

/**
 * Every guest matching the current filters — not just the loaded page.
 * Backs "Copy guests", which must cover the whole filtered set.
 */
export async function getFilteredBookingGuests(query: BookingsQuery) {
  await requireCapability("bookings:manage");
  return prisma.booking.findMany({
    where: bookingsWhere(query),
    orderBy: bookingsOrderBy(query.sort, query.dir),
    select: { name: true, date: true, phone: true },
  });
}

export async function getBookingsByService(service: string) {
  await requireCapability("bookings:manage");
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
  await requireCapability("bookings:manage");
  try {
    const { year, month, agentId } = opts;
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

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
      const dayIndex = new Date(b.date).getUTCDate() - 1;
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
  await requireCapability("bookings:manage");
  try {
    const today = new Date();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 3, 1));
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 4, 0, 23, 59, 59, 999));

    const bookings = await prisma.booking.findMany({
      where: {
        date: { gte: start, lte: end },
        ...(statuses && statuses.length > 0 ? { bookingStatus: { in: statuses } } : {}),
      },
      select: { date: true, numberOfPeople: true, bookingStatus: true },
    });

    // Waiting payment is split out from review so the dashboard never folds
    // "owes money, 24h clock running" into "needs a staff decision".
    type DayBreakdown = {
      confirmedPeople: number;
      confirmedCount: number;
      paymentPeople: number;
      paymentCount: number;
      reviewPeople: number;
      reviewCount: number;
    };
    const empty = (): DayBreakdown => ({
      confirmedPeople: 0,
      confirmedCount: 0,
      paymentPeople: 0,
      paymentCount: 0,
      reviewPeople: 0,
      reviewCount: 0,
    });

    const map = new Map<string, DayBreakdown>();
    bookings.forEach((b) => {
      const isConfirmed = CONFIRMED_STATUSES.includes(b.bookingStatus);
      const isActive = ACTIVE_PENDING_STATUSES.includes(b.bookingStatus);
      // Declined/canceled/no-response contribute to no number.
      if (!isConfirmed && !isActive) return;

      const key = b.date.toISOString().split('T')[0];
      const day = map.get(key) ?? empty();
      if (isConfirmed) {
        day.confirmedPeople += b.numberOfPeople;
        day.confirmedCount += 1;
      } else if (b.bookingStatus === BookingStatus.WAITING_PAYMENT) {
        day.paymentPeople += b.numberOfPeople;
        day.paymentCount += 1;
      } else {
        day.reviewPeople += b.numberOfPeople;
        day.reviewCount += 1;
      }
      map.set(key, day);
    });

    return {
      success: true,
      data: Array.from(map.entries()).map(([date, v]) => ({
        date,
        ...v,
        totalPeople: v.confirmedPeople + v.paymentPeople + v.reviewPeople,
        bookingCount: v.confirmedCount + v.paymentCount + v.reviewCount,
      })),
    };
  } catch (error) {
    console.error('Error fetching booking counts by date:', error);
    return { success: false, message: `Failed to fetch booking counts. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function deleteBooking(id: string) {
  await requireCapability("bookings:manage");
  try {
    await prisma.booking.delete({ where: { id } });
    revalidatePath('/bookings', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Error deleting booking:', error);
    return { success: false, message: `Failed to delete booking. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

const AGENT_STATS_BOOKING_SELECT = {
  agentId: true,
  service: true,
  bookingStatus: true,
  totalPriceCents: true,
  amountPaidCents: true,
  createdAt: true,
  events: {
    select: {
      source: true,
      actorId: true,
      fromStatus: true,
      toStatus: true,
      createdAt: true,
    },
  },
  contacts: { select: { actorId: true, createdAt: true } },
} satisfies Prisma.BookingSelect;

/**
 * Figures for /bookings/agents over bookings created in `[rangeStart,
 * rangeEnd)`; both null means all time. `previousStart` adds the same team
 * figures for `[previousStart, rangeStart)`. The rules live in
 * lib/bookings/agent-stats.ts.
 *
 * ADMIN and OWNER get every row. Anyone else gets team totals and their own
 * row only, so the page cannot be used to rank colleagues.
 */
export async function getAgentStats(
  rangeStart: Date | null,
  rangeEnd: Date | null,
  previousStart: Date | null = null,
): Promise<{ success: true; data: AgentStatsResult } | { success: false; message: string }> {
  const session = await getServerSession(authOptions);
  const viewer = session?.user as { id?: string; role?: Role } | undefined;
  if (!roleHasCapability(viewer?.role, "bookings:manage")) {
    throw new Error("Not authorized");
  }
  try {
    const now = new Date();
    const created =
      rangeStart && rangeEnd ? { createdAt: { gte: rangeStart, lt: rangeEnd } } : {};

    const [bookings, previousBookings, contactCounts, openBookings, firstEvent] =
      await Promise.all([
        prisma.booking.findMany({ where: created, select: AGENT_STATS_BOOKING_SELECT }),
        rangeStart && previousStart
          ? prisma.booking.findMany({
              where: { createdAt: { gte: previousStart, lt: rangeStart } },
              select: AGENT_STATS_BOOKING_SELECT,
            })
          : null,
        prisma.bookingContact.groupBy({
          by: ["actorId"],
          where: { actorId: { not: null }, ...created },
          _count: { _all: true },
        }),
        // Follow-ups are about today's open bookings, whenever they were made.
        prisma.booking.findMany({
          where: {
            bookingStatus: { in: ACTIVE_PENDING_STATUSES },
            contacts: { some: {} },
          },
          select: {
            contacts: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { actorId: true, outcome: true, createdAt: true, nextContactAt: true },
            },
          },
        }),
        prisma.bookingEvent.findFirst({
          orderBy: { createdAt: "asc" },
          select: { createdAt: true },
        }),
      ]);

    const contactsByActor = new Map<string, number>();
    for (const c of contactCounts) {
      if (c.actorId) contactsByActor.set(c.actorId, c._count._all);
    }
    const openContacts = openBookings.flatMap((b) => b.contacts);

    // Everyone who works the desk, plus anyone else the figures mention.
    const mentioned = new Set<string>(contactsByActor.keys());
    for (const b of bookings) {
      if (b.agentId) mentioned.add(b.agentId);
      for (const e of b.events) if (e.actorId) mentioned.add(e.actorId);
      for (const c of b.contacts) if (c.actorId) mentioned.add(c.actorId);
    }
    for (const c of openContacts) if (c.actorId) mentioned.add(c.actorId);
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { role: { in: [Role.STAFF, Role.RECEPTION] } },
          { id: { in: Array.from(mentioned) } },
        ],
      },
      select: { id: true, name: true, email: true, role: true },
    });

    const trackingSince = firstEvent?.createdAt ?? null;
    const { team, perAgent } = buildAgentStats({
      bookings,
      users,
      contactsByActor,
      openContacts,
      trackingSince,
      now,
    });
    const previous = previousBookings
      ? buildAgentStats({
          bookings: previousBookings,
          users,
          contactsByActor: new Map(),
          openContacts: [],
          trackingSince,
          now,
        }).team
      : null;

    const seesTeam = viewer?.role === Role.ADMIN || viewer?.role === Role.OWNER;

    return {
      success: true,
      data: {
        team,
        previous,
        perAgent: seesTeam ? perAgent : perAgent.filter((row) => row.agentId === viewer?.id),
        scope: seesTeam ? "team" : "self",
        trackingSince,
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
  await requireCapability("bookings:manage");
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
    if (!(await hasCapability("bookings:manage"))) {
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
    let canceledCount = 0;
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
      const canceled = await prisma.booking.updateManyAndReturn({
        where: { id: { in: sentIds }, bookingStatus: BookingStatus.PENDING },
        data: { bookingStatus: BookingStatus.CANCELED },
        select: { id: true },
      });
      const actorId = await currentUserId();
      await logBookingEvents(
        canceled.map((b) => ({
          bookingId: b.id,
          source: BookingEventSource.STAFF,
          actorId,
          fromStatus: BookingStatus.PENDING,
          toStatus: BookingStatus.CANCELED,
        })),
      );
      canceledCount = canceled.length;
      revalidatePath('/bookings', 'layout');
    }

    return {
      success: true,
      sent: sentIds.length,
      // Can trail `sent` if staff moved a booking out of PENDING mid-batch.
      canceled: canceledCount,
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
    if (!(await hasCapability("bookings:manage"))) {
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

const DAY_USE_PRICING_SELECT = {
  service: true,
  date: true,
  numberOfPeople: true,
  numberOfKids: true,
  adultUnitPriceCents: true,
  kidsUnitPriceCents: true,
  dayUseRateType: true,
} satisfies Prisma.BookingSelect;

type DayUsePricingRow = Prisma.BookingGetPayload<{ select: typeof DAY_USE_PRICING_SELECT }>;

const UNSNAPSHOTTED_PARTY_EDIT_MESSAGE =
  "This older day use booking has no saved per-person rates, so its party can't be repriced automatically. Check the original price with a manager before changing the party.";

/**
 * Price a staff edit to a Day Use booking.
 *
 * - Same date: the booking keeps the unit rates it was sold at, whatever the
 *   config says today. A legacy row without them can't have its party changed.
 * - New date (or a booking becoming Day Use): the destination date's current
 *   rate, replacing the whole snapshot in the same write.
 *
 * Returns the fields to write, or `{}` when nothing price-related changes.
 */
function priceDayUseEdit(
  existing: DayUsePricingRow,
  next: { date: Date; adults: number; kids: number },
):
  | { ok: true; data: Prisma.BookingUpdateInput }
  | { ok: false; message: string } {
  const sameDate =
    existing.service === "day-use" &&
    dateKeyFromUtcMidnight(existing.date) === dateKeyFromUtcMidnight(next.date);

  if (!sameDate) {
    const fresh = calculateDayUsePrice(next.date, next.adults, next.kids);
    return {
      ok: true,
      data: { totalPriceCents: fresh.totalCents, ...snapshotFromRate(fresh) },
    };
  }

  const snapshot = ratesFromSnapshot(existing);
  if (snapshot) {
    return {
      ok: true,
      data: {
        totalPriceCents: priceFromUnitRates(snapshot, next.adults, next.kids).totalCents,
      },
    };
  }

  const partyChanged =
    existing.numberOfPeople !== next.adults || existing.numberOfKids !== next.kids;
  if (partyChanged) return { ok: false, message: UNSNAPSHOTTED_PARTY_EDIT_MESSAGE };
  // Nothing that affects the price changed: leave the stored total alone
  // rather than quietly moving it to today's rate.
  return { ok: true, data: {} };
}

export async function updateBooking(id: string, data: UpdateBookingData) {
  await requireCapability("bookings:manage");
  try {
    const validatedData = updateBookingSchema.parse(data);
    const existing = await prisma.booking.findUnique({
      where: { id },
      select: DAY_USE_PRICING_SELECT,
    });
    if (!existing) {
      return { success: false, message: "Booking not found." };
    }

    let pricingData: Prisma.BookingUpdateInput;
    if (validatedData.service === "day-use") {
      const priced = priceDayUseEdit(existing, {
        date: validatedData.date,
        adults: validatedData.numberOfPeople,
        kids: validatedData.numberOfKids ?? 0,
      });
      if (!priced.ok) return { success: false, message: priced.message };
      pricingData = priced.data;
    } else {
      const newTotalCents = computeBookingTotalCents(
        validatedData.service,
        validatedData.date,
        validatedData.numberOfPeople,
        validatedData.numberOfKids ?? 0,
      );
      pricingData = {
        ...(newTotalCents !== null ? { totalPriceCents: newTotalCents } : {}),
        // No longer Day Use: its frozen Day Use rates no longer describe it.
        adultUnitPriceCents: null,
        kidsUnitPriceCents: null,
        dayUseRateType: null,
      };
    }

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
        ...pricingData,
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
  await requireCapability("bookings:manage");
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
    if (!(await hasCapability("bookings:manage"))) {
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
    // Public read path: expire only THIS booking if its payment window lapsed
    // (idempotent single-row update), instead of sweeping the whole table on
    // every anonymous page view. The table-wide sweep runs from the cron route
    // and staff reads.
    await expireWaitingPayments({ id });
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
/**
 * Cancels bookings whose 24h WAITING_PAYMENT window has elapsed.
 *
 * Deliberately does NOT call revalidatePath: this runs from render paths
 * (e.g. the reception dashboard) where cache revalidation is unsupported and
 * throws. Callers that run outside render — the cron route — revalidate.
 */
export async function cancelExpiredWaitingPayments() {
  return expireWaitingPayments();
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: Role } | undefined;
  if (!roleHasCapability(user?.role, "bookings:manage")) {
    return { success: false, message: "Not authorized." };
  }
  return applyBookingStatusChange(id, status, user?.id);
}

/**
 * Internal status-change core (not an action endpoint).
 *
 * Ownership (`agentId`) is set once: a booking with no owner goes to the staff
 * member who first confirms it. Later status changes — a second confirmation,
 * reception marking ARRIVED — never move it; only assignBookingAgent does.
 */
async function applyBookingStatusChange(
  id: string,
  status: BookingStatus,
  actorId?: string,
) {
  try {
    const before = await prisma.booking.findUnique({
      where: { id },
      select: { bookingStatus: true, agentId: true },
    });
    if (!before) return { success: false, message: "Booking not found." };

    const claimsOwnership =
      !!actorId &&
      !before.agentId &&
      CONFIRMED_STATUSES.includes(status) &&
      !CONFIRMED_STATUSES.includes(before.bookingStatus);

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        bookingStatus: status,
        ...(claimsOwnership ? { agentId: actorId } : {}),
        // Start (or restart) the 24h payment countdown on entry into
        // WAITING_PAYMENT; the deadline is derived as waitingPaymentAt + 24h.
        ...(status === BookingStatus.WAITING_PAYMENT
          ? { waitingPaymentAt: new Date() }
          : {}),
      },
    });
    // payBookingDeposit re-applies CONFIRMED on every payment; only a real
    // change is history.
    if (before.bookingStatus !== status) {
      await logBookingEvents([
        {
          bookingId: id,
          source: BookingEventSource.STAFF,
          actorId: actorId ?? null,
          fromStatus: before.bookingStatus,
          toStatus: status,
          ...(claimsOwnership ? { toAgentId: actorId } : {}),
        },
      ]);
    }
    revalidatePath('/bookings', 'layout');
    revalidatePath('/reception');

    // Auto-close the date if confirmed people reach the 80-person limit
    if (status === BookingStatus.CONFIRMED) {
      await autoCloseConfirmedBookingDate(booking.date);
    }

    // Generate a Flash payment link when moving into WAITING_PAYMENT.
    // Link creation is non-fatal: the status change still succeeds and the
    // admin can retry from the booking page if it fails.
    if (status === BookingStatus.WAITING_PAYMENT) {
      const linkRes = await createBookingPaymentLink(id);
      // Sent even when the link failed: the email points at the booking page,
      // which issues a fresh link itself.
      await sendPaymentRequestEmail(id);
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
 * Create, reuse, or re-issue a Flash payment link for a booking's outstanding
 * balance. Safe to call repeatedly: a link that is still live is returned as-is,
 * and only an expired one is replaced (under a fresh order id — see
 * {@link flashAggregatorId}).
 *
 * Intentionally public: guests trigger this from the unauthenticated booking
 * detail page (PayDepositOnline). Knowing the booking UUID is the capability.
 */
export async function createBookingPaymentLink(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return { success: false, message: "Booking not found." };

    const now = Date.now();
    if (booking.bookingStatus !== BookingStatus.WAITING_PAYMENT) {
      return {
        success: false,
        message: "Payment links are only available while the booking is waiting for payment.",
      };
    }
    if (!booking.waitingPaymentAt) {
      return {
        success: false,
        message: "This booking has no active payment window. Move it back to waiting for payment first.",
      };
    }

    const deadline =
      booking.waitingPaymentAt.getTime() + WAITING_PAYMENT_WINDOW_MS;
    if (deadline <= now) {
      return {
        success: false,
        message: "The booking's payment window has expired. Start a new payment window before issuing a link.",
      };
    }

    // Reuse a live link rather than creating a duplicate Flash order. An expired
    // one falls through to be re-issued instead: since links started carrying a
    // real `validity`, handing the stored link back forever would mean handing
    // back a dead one forever.
    const linkIsLive =
      booking.paymentLinkExpiresAt !== null &&
      booking.paymentLinkExpiresAt.getTime() > now &&
      booking.paymentLinkExpiresAt.getTime() <= deadline;
    if (booking.flashOrderId && booking.paymentLink && linkIsLive) {
      return {
        success: true as const,
        paymentLink: booking.paymentLink,
        expiresAt: booking.paymentLinkExpiresAt,
        reused: true,
      };
    }

    // A replacement needs an order id Flash has not seen before.
    const attempt = booking.paymentLink
      ? booking.paymentLinkAttempt + 1
      : booking.paymentLinkAttempt;

    if (booking.totalPriceCents == null) {
      return {
        success: false,
        message: "Set the booking total price before creating a payment link.",
      };
    }

    // The online payment is a 50% deposit to confirm the booking; the rest is
    // paid on arrival. Subtract anything already paid so we never overcharge.
    const deposit = depositCents(booking.totalPriceCents);
    const dueCents = deposit - booking.amountPaidCents;
    if (dueCents < FLASH_MIN_CENTS) {
      return {
        success: false,
        message: `Deposit must be at least ${FLASH_MIN_CENTS / 100} ${FLASH_CURRENCY} to create a payment link.`,
      };
    }

    // Expire the link with the booking's own 24h payment window, so a payment
    // link can never outlive the hold it was issued for. Flash takes `validity`
    // in seconds and applies its own default when it is omitted — which is how
    // links used to stay alive after the booking had already auto-cancelled.
    //
    // In the normal flow this is a full 24h: `applyBookingStatusChange` stamps
    // `waitingPaymentAt` and creates the link in the same call. A link made by
    // hand later gets only what is left of that window, so the two deadlines
    // stay the same deadline.
    const validitySeconds = Math.floor((deadline - now) / 1000);
    if (validitySeconds < 1) {
      return {
        success: false,
        message: "The booking's payment window has expired. Start a new payment window before issuing a link.",
      };
    }
    const expiresAt = new Date(now + validitySeconds * 1000);
    const aggregatorOrderId = flashAggregatorId(booking.id, attempt);

    const result = await createPaymentOrder({
      aggregatorOrderId,
      amountCents: dueCents,
      currency: FLASH_CURRENCY,
      customer: { name: booking.name, phone: booking.phone },
      validity: validitySeconds,
    });

    // The provider call cannot be part of a database transaction. Re-check the
    // booking state when storing its order so a concurrent status/payment
    // change cannot attach a newly issued link to an ineligible booking.
    const { count } = await prisma.booking.updateMany({
      where: {
        id: bookingId,
        bookingStatus: BookingStatus.WAITING_PAYMENT,
        waitingPaymentAt: booking.waitingPaymentAt,
        paymentLinkAttempt: booking.paymentLinkAttempt,
        amountPaidCents: booking.amountPaidCents,
      },
      data: {
        flashOrderId: result.flashOrderId,
        paymentLink: result.paymentLink,
        paymentLinkExpiresAt: expiresAt,
        paymentLinkAttempt: attempt,
      },
    });
    if (count === 0) {
      console.warn("Flash link created after booking state changed", {
        bookingId,
        aggregatorOrderId,
      });
      return {
        success: false,
        message: "The booking changed while the payment link was being created. Refresh and try again.",
      };
    }
    revalidatePath('/bookings', 'layout');
    revalidatePath(`/bookings/${bookingId}`);
    revalidatePath('/reception');

    return { success: true as const, paymentLink: result.paymentLink, expiresAt };
  } catch (error) {
    console.error('Flash payment link error:', error);
    return {
      success: false,
      message: `Failed to create payment link. ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Apply a Flash webhook event to a booking.
 *
 * The HMAC signature is verified here (in addition to the webhook route) so
 * this exported server action cannot be invoked directly with a forged
 * payload. This function is idempotent (keyed on the Flash transaction id) and
 * only records a payment + confirms the booking on a "succeeded" event.
 * Returns `retry: true` only for unexpected failures so the route can signal
 * Flash to retry.
 */
export async function recordFlashPayment(
  payload: Record<string, unknown>,
  signature: string | null,
) {
  if (!verifyWebhookSignature(payload, signature)) {
    return { success: false, ignored: true as const, message: "Invalid signature." };
  }
  try {
    const transactionId = String(payload.transactionId ?? "");
    const aggregatorOrderId = String(payload.aggregatorOrderId ?? "");
    const status = String(payload.status ?? "");
    const order = (payload.order ?? {}) as Record<string, unknown>;
    const providerOrderId = String(order.id ?? payload.orderId ?? "");
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

    // A re-issued link carries `<bookingId>-N`, so the id Flash echoes back is
    // not always the booking id itself. Anything that isn't UUID-prefixed is a
    // foreign order: ignore it rather than letting Postgres reject a malformed
    // uuid, which would surface as a 500 and an endless Flash retry.
    const bookingId = bookingIdFromAggregatorId(aggregatorOrderId);
    if (!bookingId) {
      console.warn("Flash webhook with unparseable order id", { aggregatorOrderId });
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
      bookingId,
      amountCents: paidAmountCents,
      idempotencyKey: transactionId,
      aggregatorOrderId,
      providerOrderId,
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
 * Send the guest their payment confirmation, at most once per booking.
 *
 * Both payment paths land here and neither is safe on its own: a Flash webhook
 * can be redelivered, and `payBookingDeposit` re-runs the CONFIRMED
 * side-effects every time reception records a payment - so the guest who pays
 * the balance on arrival would otherwise get a second "confirmed" email.
 * `confirmationEmailSentAt` is claimed inside the WHERE clause, which makes the
 * check and the claim one atomic statement rather than a read-then-write two
 * concurrent callers could both pass.
 *
 * Never throws: a mail outage must not fail a payment that is already recorded.
 */
async function sendBookingConfirmedEmailOnce(bookingId: string) {
  let claimed = false;
  try {
    const { count } = await prisma.booking.updateMany({
      where: { id: bookingId, confirmationEmailSentAt: null },
      data: { confirmationEmailSentAt: new Date() },
    });
    if (count === 0) return;
    claimed = true;

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    // Reception can enter a booking with a phone number and no email, and the
    // Pharaoh template is a one-off event mail with no confirmed variant -
    // re-sending it here would just duplicate the mail the guest already has.
    if (!booking?.email || booking.service === "pharaoh-airstyle") {
      await releaseConfirmationEmailClaim(bookingId);
      return;
    }

    const isDayUse = booking.service === "day-use";
    const totalCents = booking.totalPriceCents;
    const balanceDueCents =
      totalCents !== null
        ? Math.max(totalCents - booking.amountPaidCents, 0)
        : undefined;
    const priceBreakdown = emailPriceBreakdown(booking);

    await sendBookingEmail(booking.email, booking.name, booking.date, {
      bookingType: booking.service,
      numberOfPeople: isDayUse ? booking.numberOfPeople : undefined,
      numberOfKids: isDayUse ? booking.numberOfKids : undefined,
      priceBreakdown,
      bookingId: booking.id,
      stage: "confirmed",
      amountPaidCents: booking.amountPaidCents,
      balanceDueCents,
    });
  } catch (error) {
    // The claim means "the guest has this email". Nothing was sent, so give it
    // back and let the next payment - or a manual resend - try again.
    if (claimed) await releaseConfirmationEmailClaim(bookingId);
    console.error("Confirmation email error:", error);
  }
}

async function releaseConfirmationEmailClaim(bookingId: string) {
  try {
    await prisma.booking.updateMany({
      where: { id: bookingId },
      data: { confirmationEmailSentAt: null },
    });
  } catch (error) {
    console.error("Confirmation email claim release error:", error);
  }
}

// Serializable settlement prevents a concurrent status, amount, or link
// change from slipping between validation and the payment/status writes.
async function withBookingSettlementRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === "P2034" && attempt < attempts) continue;
      throw error;
    }
  }
}

/**
 * Settle a successful Flash payment. The booking eligibility, expected
 * deposit, current aggregator order, and provider order are all checked in the
 * same serializable transaction that records the money. Money reported by a
 * valid signed event is retained even when those checks fail, but the booking
 * is placed in UNDER_REVIEW instead of being confirmed.
 */
async function applyFlashPayment(opts: {
  bookingId: string;
  amountCents: number;
  idempotencyKey: string;
  aggregatorOrderId: string;
  providerOrderId: string;
}) {
  const {
    bookingId,
    amountCents,
    idempotencyKey,
    aggregatorOrderId,
    providerOrderId,
  } = opts;

  const runSettlement = () => prisma.$transaction(async (tx) => {
    const sameKey = await tx.bookingPayment.findUnique({
      where: { flashTransactionId: idempotencyKey },
      select: {
        bookingId: true,
        booking: { select: { bookingStatus: true } },
      },
    });
    if (sameKey) {
      if (sameKey.bookingId !== bookingId) {
        const { count } = await tx.booking.updateMany({
          where: { id: bookingId },
          data: { bookingStatus: BookingStatus.UNDER_REVIEW },
        });
        if (count === 0) {
          return { missing: true as const, confirmed: false as const };
        }
        return {
          duplicateSettlement: true as const,
          confirmed: false as const,
          reviewRequired: true as const,
          mismatchReasons: ["flash_transaction_id_reused"],
        };
      }
      return {
        duplicate: true as const,
        confirmed: sameKey.booking.bookingStatus === BookingStatus.CONFIRMED,
        reviewRequired:
          sameKey.booking.bookingStatus === BookingStatus.UNDER_REVIEW,
      };
    }

    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        date: true,
        bookingStatus: true,
        waitingPaymentAt: true,
        totalPriceCents: true,
        amountPaidCents: true,
        flashOrderId: true,
        paymentLinkAttempt: true,
      },
    });
    if (!booking) {
      return { missing: true as const, confirmed: false as const };
    }

    // A different successful transaction after a booking already settled is
    // not an idempotent retry. The partial unique index prevents a second row;
    // flag the booking for a human to reconcile the possible double charge.
    const existingFlash = await tx.bookingPayment.findFirst({
      where: { bookingId, flashTransactionId: { not: null } },
      select: { id: true },
    });
    if (existingFlash) {
      await tx.booking.update({
        where: { id: bookingId },
        data: { bookingStatus: BookingStatus.UNDER_REVIEW },
      });
      return {
        duplicateSettlement: true as const,
        confirmed: false as const,
        reviewRequired: true as const,
        bookingDate: booking.date,
        previousStatus: booking.bookingStatus,
        mismatchReasons: ["booking_already_has_flash_settlement"],
      };
    }

    const expectedAmountCents = booking.totalPriceCents === null
      ? null
      : Math.max(
          Math.round(booking.totalPriceCents / 2) - booking.amountPaidCents,
          0,
        );
    const expectedAggregatorOrderId = flashAggregatorId(
      booking.id,
      booking.paymentLinkAttempt,
    );
    const paymentDeadline = booking.waitingPaymentAt
      ? booking.waitingPaymentAt.getTime() + WAITING_PAYMENT_WINDOW_MS
      : null;
    const now = Date.now();
    const mismatchReasons: string[] = [];

    if (booking.bookingStatus !== BookingStatus.WAITING_PAYMENT) {
      mismatchReasons.push("booking_not_waiting_for_payment");
    }
    if (paymentDeadline === null || paymentDeadline <= now) {
      mismatchReasons.push("payment_window_expired");
    }
    if (expectedAmountCents === null || amountCents !== expectedAmountCents) {
      mismatchReasons.push("unexpected_amount");
    }
    if (aggregatorOrderId !== expectedAggregatorOrderId) {
      mismatchReasons.push("unexpected_aggregator_order");
    }
    if (!providerOrderId || providerOrderId !== booking.flashOrderId) {
      mismatchReasons.push("unexpected_provider_order");
    }

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
    const reviewRequired = mismatchReasons.length > 0;
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        amountPaidCents: _sum.amountCents ?? 0,
        bookingStatus: reviewRequired
          ? BookingStatus.UNDER_REVIEW
          : BookingStatus.CONFIRMED,
      },
    });

    return {
      confirmed: !reviewRequired,
      reviewRequired,
      bookingDate: booking.date,
      previousStatus: booking.bookingStatus,
      mismatchReasons,
    };
  }, {
    timeout: 30000,
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });

  let settled;
  try {
    settled = await withBookingSettlementRetry(runSettlement);
  } catch (error) {
    // The database-level one-settlement-per-booking constraint is the final
    // race guard. If another settlement won concurrently, distinguish a true
    // redelivery from a second charge by re-entering the same serializable
    // decision path after the winning transaction has committed.
    if ((error as { code?: string })?.code !== "P2002") throw error;
    settled = await withBookingSettlementRetry(runSettlement);
  }

  if ("missing" in settled) {
    console.warn("Flash settlement for unknown booking", { aggregatorOrderId });
    return { ignored: true as const, confirmed: false as const };
  }
  if ("duplicate" in settled) return settled;

  // After the commit, and never throwing: reporting must not make Flash retry
  // a payment that is already recorded.
  if ("previousStatus" in settled) {
    const toStatus = settled.reviewRequired
      ? BookingStatus.UNDER_REVIEW
      : BookingStatus.CONFIRMED;
    if (settled.previousStatus !== toStatus) {
      await logBookingEvents([
        {
          bookingId,
          source: BookingEventSource.PAYMENT,
          fromStatus: settled.previousStatus,
          toStatus,
        },
      ]);
    }
    if (settled.confirmed) await assignPaymentConfirmedOwner(bookingId);
  }

  if (settled.reviewRequired) {
    console.warn("Flash settlement routed to review", {
      bookingId,
      transactionId: idempotencyKey,
      mismatchReasons: settled.mismatchReasons,
    });
  } else {
    try {
      await autoCloseConfirmedBookingDate(settled.bookingDate);
    } catch (error) {
      // Settlement is already committed. A capacity-maintenance failure must
      // not make Flash retry a payment that was safely recorded.
      console.error("Confirmed booking capacity update error:", error);
    }
    await sendBookingConfirmedEmailOnce(bookingId);
  }
  revalidatePath('/bookings', 'layout');
  revalidatePath('/reception');
  revalidatePath(`/bookings/${bookingId}`);

  return settled;
}

/**
 * A payment confirmed this booking, so no person did. If it has no owner, it
 * goes to the staff member who last sent it to WAITING_PAYMENT; a booking no
 * staff member moved stays ownerless and is reported as self-serve.
 */
async function assignPaymentConfirmedOwner(bookingId: string) {
  try {
    const request = await prisma.bookingEvent.findFirst({
      where: {
        bookingId,
        source: BookingEventSource.STAFF,
        toStatus: BookingStatus.WAITING_PAYMENT,
        actorId: { not: null },
      },
      orderBy: { createdAt: "desc" },
      select: { actorId: true },
    });
    if (!request?.actorId) return;
    const { count } = await prisma.booking.updateMany({
      where: { id: bookingId, agentId: null },
      data: { agentId: request.actorId },
    });
    if (count > 0) {
      await logBookingEvents([
        {
          bookingId,
          source: BookingEventSource.PAYMENT,
          toAgentId: request.actorId,
        },
      ]);
    }
  } catch (error) {
    console.error("Payment-confirmed owner assignment error:", error);
  }
}

/**
 * Pull the live order status from Flash and, if paid, confirm the booking.
 * A webhook-free fallback/reconciliation path (idempotent with the webhook).
 */
export async function checkBookingPaymentStatus(bookingId: string) {
  await requireCapability("bookings:manage");
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, paymentLinkAttempt: true },
    });
    if (!booking) return { success: false, message: "Booking not found." };

    // Walk the attempts newest-first. Usually there is exactly one, but a guest
    // who paid a link just before it lapsed — and whose webhook we then missed —
    // has their money sitting on an *older* order, which is precisely the case
    // this manual check exists to rescue. A single unreachable order must not
    // abort the walk, so failures are remembered and reported only if no attempt
    // yields an answer.
    let status = "unknown";
    let lastError: unknown = null;

    for (let attempt = booking.paymentLinkAttempt; attempt >= 1; attempt--) {
      let order;
      try {
        order = await getFlashOrder(flashAggregatorId(bookingId, attempt));
      } catch (error) {
        lastError = error;
        continue;
      }

      status = order.status ?? "unknown";
      if (status !== "succeeded") continue;

      const amountCents = order.amountCents ?? 0;
      if (amountCents <= 0) {
        return { success: false, message: "Flash returned no amount for this order." };
      }

      const applied = await applyFlashPayment({
        bookingId,
        amountCents,
        idempotencyKey: order.id ?? `flash-order-${flashAggregatorId(bookingId, attempt)}`,
        aggregatorOrderId:
          order.aggregatorOrderId ?? flashAggregatorId(bookingId, attempt),
        providerOrderId: order.id ?? "",
      });

      return { success: true as const, status, ...applied };
    }

    if (lastError && status === "unknown") throw lastError;

    return { success: true as const, status, confirmed: false as const };
  } catch (error) {
    console.error("Check payment status error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function updateBookingParty(id: string, adults: number, kids: number) {
  await requireCapability("bookings:manage");
  try {
    if (!Number.isInteger(adults) || adults < 1) {
      return { success: false, message: "Adults must be a whole number ≥ 1." };
    }
    if (!Number.isInteger(kids) || kids < 0) {
      return { success: false, message: "Kids must be a whole number ≥ 0." };
    }
    const existing = await prisma.booking.findUnique({
      where: { id },
      select: DAY_USE_PRICING_SELECT,
    });
    if (!existing) {
      return { success: false, message: "Booking not found." };
    }
    let pricingData: Prisma.BookingUpdateInput;
    if (existing.service === "day-use") {
      // Same date, so this keeps the rates the booking was sold at.
      const priced = priceDayUseEdit(existing, { date: existing.date, adults, kids });
      if (!priced.ok) return { success: false, message: priced.message };
      pricingData = priced.data;
    } else {
      const newTotalCents = computeBookingTotalCents(existing.service, existing.date, adults, kids);
      pricingData = newTotalCents !== null ? { totalPriceCents: newTotalCents } : {};
    }
    await prisma.booking.update({
      where: { id },
      data: {
        numberOfPeople: adults,
        numberOfKids: kids,
        ...pricingData,
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
    if (!roleHasCapability(user?.role, "bookings:manage")) {
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
          actorId: user?.id ?? null,
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
    // After the status change, so the email reads the booking in its settled
    // state — amountPaidCents is already re-aggregated above.
    await sendBookingConfirmedEmailOnce(bookingId);
    revalidatePath(`/bookings/${bookingId}`);

    return { success: true, amountPaidCents };
  } catch (error) {
    console.error('Booking deposit error:', error);
    return { success: false, message: `Failed to record deposit. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function updateBookingAmountPaid(id: string, amountPaidCents: number) {
  await requireCapability("bookings:manage");
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
  await requireCapability("bookings:manage");
  try {
    const today = utcDayStart(new Date());

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
  await requireCapability("bookings:manage");
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
  await requireCapability("bookings:manage");
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
  await requireCapability("bookings:manage");
  try {
    const today = utcDayStart(new Date());

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
  await requireCapability("bookings:manage");
  try {
    const before = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { agentId: true },
    });
    await prisma.booking.update({
      where: { id: bookingId },
      data: { agentId },
    });
    if (before && before.agentId !== agentId) {
      await logBookingEvents([
        {
          bookingId,
          source: BookingEventSource.STAFF,
          actorId: await currentUserId(),
          fromAgentId: before.agentId,
          toAgentId: agentId,
        },
      ]);
    }
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
  await requireCapability("bookings:manage");
  try {
    const creatorId = await currentUserId();
    const booking = await prisma.booking.create({
      data: {
        agentId: creatorId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        date: data.date,
        service: "day-use",
        numberOfPeople: data.numberOfPeople,
        numberOfKids: data.numberOfKids,
        // Freeze today's rate for the date so a later party edit reprices from
        // it rather than being blocked as an unsnapshotted legacy row.
        ...snapshotFromRate(calculateDayUsePrice(data.date, 1, 0)),
        bookingStatus: data.bookingStatus,
        amountPaidCents: data.amountPaidCents,
        ...(data.bookingStatus === BookingStatus.WAITING_PAYMENT
          ? { waitingPaymentAt: new Date() }
          : {}),
      },
    });
    await logBookingEvents([
      {
        bookingId: booking.id,
        source: BookingEventSource.STAFF,
        actorId: creatorId,
        toStatus: booking.bookingStatus,
        toAgentId: creatorId,
      },
    ]);
    if (booking.bookingStatus === BookingStatus.WAITING_PAYMENT) {
      await sendPaymentRequestEmail(booking.id);
    }
    revalidatePath("/bookings");
    revalidatePath("/bookings/day-use");
    return { success: true, bookingId: booking.id };
  } catch (error) {
    return { success: false, message: `Failed to create booking: ${error instanceof Error ? error.message : String(error)}` };
  }
}


export async function createCorporateBooking(data: CorporateBookingData) {
  await requireCapability("bookings:manage");
  try {
    const validated = corporateBookingSchema.parse(data);
    const creatorId = await currentUserId();
    const booking = await prisma.booking.create({
      data: {
        agentId: creatorId,
        service: "corporate",
        name: validated.name,
        phone: validated.phone,
        email: validated.email,
        date: validated.date,
        numberOfPeople: validated.numberOfPeople,
        // Deposit owed lives in totalPriceCents; amountPaidCents stays 0 until
        // the deposit is collected via PayDepositDialog / payBookingDeposit.
        totalPriceCents: validated.depositCents,
        amountPaidCents: 0,
        bookingStatus: BookingStatus.WAITING_PAYMENT,
        waitingPaymentAt: new Date(),
      },
    });
    await logBookingEvents([
      {
        bookingId: booking.id,
        source: BookingEventSource.STAFF,
        actorId: creatorId,
        toStatus: booking.bookingStatus,
        toAgentId: creatorId,
      },
    ]);
    revalidatePath("/bookings");
    return { success: true, bookingId: booking.id };
  } catch (error) {
    return { success: false, message: `Failed to create booking: ${error instanceof Error ? error.message : String(error)}` };
  }
}


/* -------------------------------------------------------------------------- */
/*  Reception dashboard                                                       */
/* -------------------------------------------------------------------------- */

const RECEPTION_ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.REQUEST_SENT,
  BookingStatus.UNDER_REVIEW,
  BookingStatus.WAITING_PAYMENT,
  BookingStatus.CONFIRMED,
  BookingStatus.ARRIVED,
];

const RECEPTION_REVIEW_STATUSES = NEEDS_REVIEW_STATUSES;
const RECEPTION_CONTACT_STATUSES = NEEDS_CONTACT_STATUSES;

const receptionBookingInclude = {
  agent: { select: { id: true, name: true, email: true } },
  contacts: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: { actor: { select: { name: true, email: true } } },
  },
} as const;

type ReceptionBookingSource = Prisma.BookingGetPayload<{
  include: typeof receptionBookingInclude;
}>;

export type ReceptionBookingRow = BookingWithAgent & {
  dueCents: number | null;
  paymentState: "DUE" | "PAID" | "UNKNOWN";
  lastContact: {
    createdAt: Date;
    channel: BookingContactChannel;
    outcome: BookingContactOutcome;
    nextContactAt: Date | null;
    actorName: string | null;
  } | null;
};

export type ReceptionDashboardData = {
  businessDate: string;
  generatedAt: Date;
  summary: {
    todayBookings: number;
    todayGuests: number;
    reviewToday: number;
    contactUpcoming: number;
    arrivedToday: number;
  };
  todayBookings: ReceptionBookingRow[];
  reviewToday: ReceptionBookingRow[];
  reviewTotal: number;
  contactUpcoming: Array<
    ReceptionBookingRow & {
      contactReason: string;
      paymentExpiresAt: Date | null;
    }
  >;
  contactTotal: number;
  capacity: Array<{ date: string; people: number; closed: boolean }>;
};

function toReceptionBookingRow(
  source: ReceptionBookingSource,
): ReceptionBookingRow {
  const { contacts, ...booking } = source;
  const dueCents =
    booking.totalPriceCents == null
      ? null
      : Math.max(booking.totalPriceCents - booking.amountPaidCents, 0);
  const latest = contacts[0] ?? null;

  return {
    ...booking,
    dueCents,
    paymentState:
      dueCents == null ? "UNKNOWN" : dueCents > 0 ? "DUE" : "PAID",
    lastContact: latest
      ? {
          createdAt: latest.createdAt,
          channel: latest.channel,
          outcome: latest.outcome,
          nextContactAt: latest.nextContactAt,
          actorName: latest.actor?.name ?? latest.actor?.email ?? null,
        }
      : null,
  };
}

function contactReason(source: ReceptionBookingSource): string {
  if (source.bookingStatus === BookingStatus.REQUEST_SENT) {
    return "Guest information required";
  }
  if (!source.paymentLink) return "Payment link needs attention";
  return "Payment reminder";
}

export async function getReceptionDashboard(): Promise<ReceptionDashboardData> {
  await requireCapability("bookings:manage");

  // Sweep expired payment windows first so every queue starts from live state.
  await cancelExpiredWaitingPayments();

  const todayStart = cairoBusinessDayStart();
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  const todayWhere: Prisma.BookingWhereInput = {
    date: { gte: todayStart, lte: todayEnd },
    bookingStatus: { in: RECEPTION_ACTIVE_STATUSES },
  };
  const reviewWhere: Prisma.BookingWhereInput = {
    date: { gte: todayStart, lte: todayEnd },
    bookingStatus: { in: RECEPTION_REVIEW_STATUSES },
  };
  const contactWhere: Prisma.BookingWhereInput = {
    date: { gte: todayStart },
    bookingStatus: { in: RECEPTION_CONTACT_STATUSES },
  };

  const [
    todayBookings,
    reviewToday,
    reviewTotal,
    contactUpcoming,
    contactTotal,
    weekConfirmed,
    closedDates,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: todayWhere,
      orderBy: [
        { time: { sort: "asc", nulls: "last" } },
        { createdAt: "asc" },
      ],
      include: receptionBookingInclude,
    }),
    prisma.booking.findMany({
      where: reviewWhere,
      orderBy: { createdAt: "asc" },
      include: receptionBookingInclude,
      take: 20,
    }),
    prisma.booking.count({ where: reviewWhere }),
    prisma.booking.findMany({
      where: contactWhere,
      orderBy: { createdAt: "asc" },
      include: receptionBookingInclude,
      take: 30,
    }),
    prisma.booking.count({ where: contactWhere }),
    prisma.booking.findMany({
      where: {
        date: { gte: todayStart, lte: weekEnd },
        bookingStatus: { in: CAPACITY_STATUSES },
      },
      select: { date: true, numberOfPeople: true, numberOfKids: true },
    }),
    prisma.closedDate.findMany({
      where: { date: { gte: todayStart, lte: weekEnd } },
      select: { date: true },
    }),
  ]);

  const peopleByDay = new Map<string, number>();
  for (const booking of weekConfirmed) {
    const key = booking.date.toISOString().split("T")[0];
    peopleByDay.set(
      key,
      (peopleByDay.get(key) ?? 0) +
        booking.numberOfPeople +
        (booking.numberOfKids ?? 0),
    );
  }
  const closedSet = new Set(
    closedDates.map((date) => date.date.toISOString().split("T")[0]),
  );
  const capacity = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(todayStart.getTime() + index * 24 * 60 * 60 * 1000);
    const key = day.toISOString().split("T")[0];
    return {
      date: key,
      people: peopleByDay.get(key) ?? 0,
      closed: closedSet.has(key),
    };
  });

  const todayRows = todayBookings.map(toReceptionBookingRow);
  return {
    businessDate: todayStart.toISOString().split("T")[0],
    generatedAt: new Date(),
    summary: {
      todayBookings: todayRows.length,
      todayGuests: todayRows.reduce(
        (sum, booking) =>
          sum + booking.numberOfPeople + (booking.numberOfKids ?? 0),
        0,
      ),
      reviewToday: reviewTotal,
      contactUpcoming: contactTotal,
      arrivedToday: todayRows.filter(
        (booking) => booking.bookingStatus === BookingStatus.ARRIVED,
      ).length,
    },
    todayBookings: todayRows,
    reviewToday: reviewToday.map(toReceptionBookingRow),
    reviewTotal,
    contactUpcoming: contactUpcoming.map((booking) => ({
      ...toReceptionBookingRow(booking),
      contactReason: contactReason(booking),
      paymentExpiresAt: booking.waitingPaymentAt
        ? new Date(booking.waitingPaymentAt.getTime() + WAITING_PAYMENT_WINDOW_MS)
        : null,
    })),
    contactTotal,
    capacity,
  };
}

export async function logBookingContact(
  bookingId: string,
  channel: BookingContactChannel,
  outcome: BookingContactOutcome = BookingContactOutcome.ATTEMPTED,
) {
  await requireCapability("bookings:manage");
  const session = await getServerSession(authOptions);
  const actorId = (session?.user as { id?: string } | undefined)?.id;

  if (!Object.values(BookingContactChannel).includes(channel)) {
    return { success: false as const, message: "Invalid contact channel." };
  }
  if (!Object.values(BookingContactOutcome).includes(outcome)) {
    return { success: false as const, message: "Invalid contact outcome." };
  }

  try {
    const contact = await prisma.bookingContact.create({
      data: { bookingId, actorId: actorId ?? null, channel, outcome },
      select: { id: true, createdAt: true },
    });
    revalidatePath("/reception");
    return { success: true as const, contact };
  } catch (error) {
    console.error("Booking contact log error", error);
    return {
      success: false as const,
      message: "Could not record the contact attempt. Please try again.",
    };
  }
}

/**
 * Booking read for the staff desk view: the record plus the two histories the
 * desk needs to answer "what has already happened" — the payment ledger and
 * the contact log. Capability-gated, unlike the public getBookingById.
 */
export async function getBookingForDesk(id: string) {
  if (!(await hasCapability("bookings:manage"))) return null;
  try {
    // Same idempotent single-row expiry as the public read, so the desk never
    // shows a live countdown for a booking the cron has already let lapse.
    await expireWaitingPayments({ id });

    return await prisma.booking.findUnique({
      where: { id },
      include: {
        agent: { select: { id: true, name: true, email: true } },
        payments: { orderBy: { createdAt: "desc" } },
        contacts: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { actor: { select: { id: true, name: true, email: true } } },
        },
      },
    });
  } catch (e) {
    console.error("Error fetching booking for desk", e);
    return null;
  }
}
