import { email, z } from "zod";
import { User } from "@prisma/client";
export const bookingFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  date: z.date().min(new Date(), "Date must be in the future"),
  phone: z.string().min(7, "Phone number must be at least 7 digits long"),
  email: z.string().email("Invalid email address"),
  service: z.string().min(1, "Service is required"),
  time: z.string().nullable().default(null),
  instructor: z.string().nullable().default(null),
});
export type BookingFormData = z.infer<typeof bookingFormSchema>;

export const signUpFormSchema = z.object({
  name: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().email("Invalid email address"),
  password: z.string(),
});
export type SignUpFormData = z.infer<typeof signUpFormSchema>;
