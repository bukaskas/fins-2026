'use server';

import { prisma } from "@/db/prisma";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { BookingFormData, bookingFormSchema } from "../validators";



// Complete the createBooking server action in db/actions.ts to validate 
// formData with Zod, save the booking to PostgreSQL via Prisma Client, 
// and return success/error states.
export async function createBooking(data: BookingFormData) {
  try {

    console.log("Creating booking with data:", data);
    const validatedData = bookingFormSchema.parse(data);
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    console.log(validatedData)
    const booking = await prisma.booking.create({
      data: {
        name: validatedData.name,
        date: validatedData.date,
        email: validatedData.email,
        phone: validatedData.phone,
        service: validatedData.service,
      },
    });

    return ({
      success: true,
      message: `Booking created at ${validatedData.date.toISOString()}`,
      bookingId: booking.id,
      date: booking.date
    });
  }
  catch (error) {


    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Booking creation error:", error);
    if (error instanceof Error) {
      return {
        success: false,
        message: `Failed to create booking: ${error.message}`
      };
    }
    return { success: false, message: "Failed to create booking." };
  }
}
