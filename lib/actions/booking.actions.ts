'use server';

import { prisma } from "@/db/prisma";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { BookingFormData, bookingFormSchema } from "../validators";



// Complete the createBooking server action in db/actions.ts to validate 
// formData with Zod, save the booking to PostgreSQL via Prisma Client, 
// and return success/error states.
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

    return { success: false, message: "Failed to create booking." };
  }
}
