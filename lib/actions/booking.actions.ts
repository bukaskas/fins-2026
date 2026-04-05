'use server';

import { prisma } from "@/db/prisma";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { BookingFormData, bookingFormSchema } from "../validators";
import { sendBookingEmail } from "@/emails/index";





export async function createBooking(data: BookingFormData) {
  try {
    const validatedData = bookingFormSchema.parse(data);
    const booking = await prisma.booking.create({
      data: {
        name: validatedData.name,
        date: validatedData.date,
        email: validatedData.email,
        phone: validatedData.phone,
        service: validatedData.service,
        numberOfPeople: validatedData.numberOfPeople,
      },
    });

    await sendBookingEmail(validatedData.email, validatedData.name, validatedData.date, validatedData.service);

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

export async function getBookingCountsByDate() {
  try {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 4, 0, 23, 59, 59);

    const bookings = await prisma.booking.findMany({
      where: { date: { gte: start, lte: end } },
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
    return { success: true };
  } catch (error) {
    console.error('Error deleting booking:', error);
    return { success: false, message: `Failed to delete booking. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function getBookingsByDate(date: string) {
  try {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    const bookings = await prisma.booking.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: [{ time: 'asc' }, { createdAt: 'asc' }],
    });

    return { success: true, data: bookings };
  } catch (error) {
    console.error('Error fetching bookings by date:', error);
    return { success: false, message: `Failed to fetch bookings. Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function updateBooking(id: string, data: BookingFormData) {
  try {
    const validatedData = bookingFormSchema.parse(data);
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        name: validatedData.name,
        date: validatedData.date,
        email: validatedData.email,
        phone: validatedData.phone,
        service: validatedData.service,
        numberOfPeople: validatedData.numberOfPeople,
        instructor: validatedData.instructor ?? null,
        time: validatedData.time ?? null,
      },
    });

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

