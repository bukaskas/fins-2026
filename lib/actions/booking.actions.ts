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
      },
    });

    await sendBookingEmail(validatedData.email, validatedData.name, validatedData.date);

    return ({
      success: true,
      message: `Booking created at ${validatedData.date.toISOString()}`,
      bookingId: booking.id,
      date: booking.date
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

