import { email, z } from "zod";

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