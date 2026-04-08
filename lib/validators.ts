import { email, z } from "zod";
import { BookingStatus, PaymentStatus } from "@prisma/client";

export const bookingFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  date: z.date().min(new Date(), "Date must be in the future"),
  phone: z.string().min(7, "Phone number must be at least 7 digits long"),
  email: z.string().email("Invalid email address"),
  service: z.string().min(1, "Service is required"),
  numberOfPeople: z.number().int().min(1, "At least 1 person required"),
  time: z.string().nullable().default(null),
  instructor: z.string().nullable().default(null),
  bookingStatus: z.nativeEnum(BookingStatus).default(BookingStatus.PENDING),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.UNPAID),
});
export type BookingFormData = z.infer<typeof bookingFormSchema>;

export const signUpFormSchema = z.object({
  name: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().email("Invalid email address"),
  password: z.string(),
});
export type SignUpFormData = z.infer<typeof signUpFormSchema>;

import { Role } from "@prisma/client";

export const userEditFormSchema = z.object({
  name: z.string().trim().nullable(),
  phone: z.string().trim().nullable(),
  email: z.string().email("Invalid email address"),
  role: z.nativeEnum(Role),
  // optional on edit; only validate if provided
  password: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine((v) => !v || v.length >= 8, {
      message: "Password must be at least 8 characters long",
    }),
});

export type UserEditFormData = z.infer<typeof userEditFormSchema>;

import { LessonType } from "@prisma/client";

export const kitesurfingBookingFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Phone number must be at least 7 digits long"),
  date: z.date({ required_error: "Date is required" }),
  time: z.string().min(1, "Please select a time"),
  lessonType: z.nativeEnum(LessonType),
  numberOfPeople: z.number().int().min(1).max(4).default(1),
  notes: z.string().nullable().default(null),
});

export type KitesurfingBookingFormData = z.infer<typeof kitesurfingBookingFormSchema>;