'use server';

import { prisma } from "@/db/prisma";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { BookingFormData, bookingFormSchema, UpdateBookingData, updateBookingSchema } from "../validators";
import { sendBookingEmail, sendStaffNotificationEmail } from "@/emails/index";
import { BookingStatus, Role } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { addClosedDate } from "./closedDate.actions";
import { startOfDay } from "date-fns";

const STAFF_ROLES: Role[] = [Role.ADMIN, Role.STAFF, Role.OWNER];





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
      },
    });

    const isDayUse = validatedData.service === "day-use";
    const isPharaoh = validatedData.service === "pharaoh-airstyle";
    const includeTickets = isDayUse || isPharaoh;
    await sendBookingEmail(
      validatedData.email,
      validatedData.name,
      validatedData.date,
      validatedData.service,
      isDayUse ? validatedData.numberOfPeople : undefined,
      isDayUse ? (validatedData.numberOfKids ?? 0) : undefined,
      isDayUse ? (validatedData.totalPriceCents ?? undefined) : undefined,
    );
    await sendStaffNotificationEmail(
      validatedData.name,
      validatedData.email,
      validatedData.phone,
      validatedData.date,
      validatedData.service,
      validatedData.numberOfPeople,
      includeTickets ? (validatedData.numberOfKids ?? 0) : undefined,
      includeTickets ? (validatedData.totalPriceCents ?? undefined) : undefined,
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
    const bookings = await prisma.booking.findMany({})
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
    });
    return { success: true, data: bookings };
  } catch (error) {
    console.error('Error fetching bookings by service:', error);
    return { success: false, message: `Failed to fetch bookings. Error: ${error instanceof Error ? error.message : String(error)}` };
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
      select: { date: true, numberOfPeople: true },
    });

    const map = new Map<string, { totalPeople: number; bookingCount: number }>();
    bookings.forEach((b) => {
      const key = b.date.toISOString().split('T')[0];
      const existing = map.get(key) ?? { totalPeople: 0, bookingCount: 0 };
      map.set(key, {
        totalPeople: existing.totalPeople + b.numberOfPeople,
        bookingCount: existing.bookingCount + 1,
      });
    });

    return {
      success: true,
      data: Array.from(map.entries()).map(([date, v]) => ({ date, ...v })),
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
    });

    return { success: true, data: bookings };
  } catch (error) {
    console.error('Error fetching bookings by date:', error);
    return { success: false, message: `Failed to fetch bookings. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function updateBooking(id: string, data: UpdateBookingData) {
  try {
    const validatedData = updateBookingSchema.parse(data);
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

export async function getBookingById(id: string) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id } });
    return booking;
  } catch (e) {
    console.error("Error fetching booking by id", e);
    return null;
  }
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  try {
    const booking = await prisma.booking.update({ where: { id }, data: { bookingStatus: status } });
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

    return { success: true };
  } catch (error) {
    console.error('Status update error:', error);
    return { success: false, message: `Failed to update status. Error: ${error instanceof Error ? error.message : String(error)}` };
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

