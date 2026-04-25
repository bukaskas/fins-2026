import { email, z } from "zod";
import { BookingStatus, PaymentStatus } from "@prisma/client";

export const bookingFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  date: z.date().min(new Date(), "Date must be in the future"),
  phone: z.string().min(7, "Phone number must be at least 7 digits long"),
  email: z.string().email("Invalid email address"),
  service: z.string().min(1, "Service is required"),
  numberOfPeople: z.number().int().min(1, "At least 1 person required"),
  numberOfKids: z.number().int().min(0).default(0),
  totalPriceCents: z.number().int().min(0).nullable().default(null),
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

export const kitesurfingBookingFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Phone number must be at least 7 digits long"),
  date: z.date({ error: "Date is required" }),
  time: z.string().min(1, "Please select a time"),
  notes: z.string().nullable().default(null),
});

export type KitesurfingBookingFormData = z.infer<typeof kitesurfingBookingFormSchema>;

import { InventoryCategory, ItemCondition } from "@prisma/client";

export const rentalLineSchema = z.object({
  inventoryItemId: z.string().min(1, "Item is required"),
  qty: z.number().int().min(1, "Quantity must be at least 1"),
  unitPriceCents: z.number().int().min(0, "Price must be 0 or more"),
});

export const createRentalSchema = z
  .object({
    guestId: z.string().min(1, "Guest is required"),
    startsAt: z.coerce.date(),
    dueAt: z.coerce.date(),
    notes: z.string().nullable().default(null),
    lines: z.array(rentalLineSchema).min(1, "At least one item is required"),
  })
  .refine((d) => d.dueAt > d.startsAt, {
    message: "Due date must be after start date",
    path: ["dueAt"],
  });

export type CreateRentalData = z.infer<typeof createRentalSchema>;

export const createInventoryItemSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  category: z.nativeEnum(InventoryCategory),
  size: z.string().nullable().default(null),
  totalQty: z.number().int().min(0, "Quantity must be 0 or more"),
  condition: z.nativeEnum(ItemCondition).default(ItemCondition.GOOD),
});

export type CreateInventoryItemData = z.infer<typeof createInventoryItemSchema>;

export const updateInventoryItemSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.nativeEnum(InventoryCategory).optional(),
  size: z.string().nullable().optional(),
  totalQty: z.number().int().min(0).optional(),
  condition: z.nativeEnum(ItemCondition).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateInventoryItemData = z.infer<typeof updateInventoryItemSchema>;