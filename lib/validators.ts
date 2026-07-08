import { z } from "zod";

// Emails are stored lowercase; normalize at every input boundary so lookups,
// uniqueness, and password reset all agree (see code-review-v1.md H2).
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address");
import { BookingStatus, CommissionType, ExpenseType, PaymentMethod } from "@prisma/client";
import { isValidPhoneNumber } from "libphonenumber-js";

// E.164 phone validator. isValidPhoneNumber enforces the per-country
// digit-count rules from libphonenumber metadata, so a number that's
// too short, too long, or missing its country code is rejected.
export const phoneSchema = z
  .string()
  .trim()
  .refine(isValidPhoneNumber, "Enter a valid phone number with country code");

export const optionalPhoneSchema = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null))
  .refine(
    (v) => v == null || isValidPhoneNumber(v),
    "Enter a valid phone number with country code",
  );

export const bookingFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  date: z.date().refine(
    (d) => {
      const todayUTC = new Date(Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ));
      return d.getTime() >= todayUTC.getTime();
    },
    "Date must be today or in the future"
  ),
  phone: phoneSchema,
  email: emailSchema,
  service: z.string().min(1, "Service is required"),
  numberOfPeople: z
    .number()
    .int()
    .min(1, "At least 1 person required")
    .max(100, "For groups over 100 people, please contact us directly"),
  numberOfKids: z.number().int().min(0).max(100).default(0),
  // Display hint only — the server recomputes the price for priced services
  // (see createBooking).
  totalPriceCents: z.number().int().min(0).max(100_000_000).nullable().default(null),
  time: z.string().nullable().default(null),
  instructor: z.string().nullable().default(null),
  instagram: z.string().trim().nullish(),
  bookingStatus: z.nativeEnum(BookingStatus).default(BookingStatus.PENDING),
  amountPaidCents: z.number().int().min(0).default(0),
});
export type BookingFormData = z.infer<typeof bookingFormSchema>;

export const updateBookingSchema = z.object({
  name:             z.string().min(2, "Name must be at least 2 characters long"),
  date:             z.date(),
  email:            z.preprocess(
    (v) => (v === "" || v == null) ? null : v,
    emailSchema.nullable()
  ),
  phone:            phoneSchema,
  service:          z.string().min(1, "Service is required"),
  numberOfPeople:   z.number().int().min(1, "At least 1 person required").max(100),
  numberOfKids:     z.number().int().min(0).max(100).default(0),
  amountPaidCents:  z.number().int().min(0).default(0),
  instructor:       z.string().nullable().default(null),
  time:             z.string().nullable().default(null),
});
export type UpdateBookingData = z.infer<typeof updateBookingSchema>;

export const corporateBookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  phone: phoneSchema,
  email: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    emailSchema.nullable(),
  ),
  date: z.date({ error: "Date is required" }),
  numberOfPeople: z.number().int().min(1, "At least 1 person required").max(1000),
  depositCents: z.number().int().positive("Deposit must be greater than 0"),
});
export type CorporateBookingData = z.infer<typeof corporateBookingSchema>;

export const bookingDepositSchema = z.object({
  amountCents: z.number().int().positive("Amount must be greater than 0"),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().trim().nullish(),
});
export type BookingDepositData = z.infer<typeof bookingDepositSchema>;

export const signUpFormSchema = z.object({
  name: z.string().nullable(),
  phone: optionalPhoneSchema,
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters long"),
});
export type SignUpFormData = z.infer<typeof signUpFormSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Missing reset token"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

import { Role, UserType } from "@prisma/client";

const rateCentsField = z.coerce
  .number()
  .int("Must be a whole number")
  .min(0, "Must be 0 or more")
  .default(0);

export const instructorRatesSchema = z.object({
  privateRateCents: rateCentsField,
  semiPrivateRateCents: rateCentsField,
  extraPrivateRateCents: rateCentsField,
  extraSemiPrivateRateCents: rateCentsField,
  foilRateCents: rateCentsField,
  kidsRateCents: rateCentsField,
});

export type InstructorRatesData = z.infer<typeof instructorRatesSchema>;

export const userEditFormSchema = z.object({
  name: z.string().trim().nullable(),
  phone: optionalPhoneSchema,
  email: emailSchema,
  role: z.nativeEnum(Role),
  userType: z.nativeEnum(UserType),
  isInstructor: z.boolean().default(false),
  rates: instructorRatesSchema.optional(),
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

export const commissionUpdateSchema = z.object({
  overrideAmountCents: z
    .union([z.coerce.number().int().min(0), z.null()])
    .optional(),
  commissionType: z.nativeEnum(CommissionType).optional(),
});

export type CommissionUpdateData = z.infer<typeof commissionUpdateSchema>;

const MANUAL_EXPENSE_TYPES = [
  ExpenseType.TRANSPORTATION,
  ExpenseType.MAINTENANCE,
  ExpenseType.SUPPLIES,
  ExpenseType.OTHER,
] as const;

export const newExpenseSchema = z.object({
  type: z.enum(MANUAL_EXPENSE_TYPES),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  amountCents: z
    .number()
    .int("Amount must be a whole number of cents")
    .positive("Amount must be greater than 0"),
  payeeId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type NewExpenseData = z.infer<typeof newExpenseSchema>;

export const newLessonFormSchema = z
  .object({
    studentId: z.string().uuid({ message: "Student is required." }),
    instructorId: z.string().uuid({ message: "Instructor is required." }),
    productId: z.string().uuid({ message: "Product is required." }),
    startsAt: z.string().min(1, "Start date/time is required."),
    durationHours: z.coerce.number().int("Hours must be a whole number.").min(0),
    durationMinutesPart: z.coerce
      .number()
      .refine((v) => [0, 15, 30, 45].includes(v), {
        message: "Minutes must be 00, 15, 30 or 45.",
      }),
    notes: z.string().nullable().optional().transform((v) => (v && v.length > 0 ? v : null)),
  })
  .refine((d) => d.durationHours * 60 + d.durationMinutesPart > 0, {
    message: "Duration must be greater than 0.",
    path: ["durationHours"],
  });

export type NewLessonFormData = z.infer<typeof newLessonFormSchema>;

export const kitesurfingBookingFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: emailSchema,
  phone: phoneSchema,
  date: z.date({ error: "Date is required" }),
  time: z.string().min(1, "Please select a time"),
  notes: z.string().nullable().default(null),
});

export type KitesurfingBookingFormData = z.infer<typeof kitesurfingBookingFormSchema>;

import { InventoryCategory, ItemCondition } from "@prisma/client";

export const rentalEquipmentSchema = z.object({
  inventoryItemId: z.string().uuid("Invalid inventory item"),
  qty: z.number().int().min(1, "Quantity must be at least 1"),
});

export const rentalProductLineSchema = z.object({
  productId: z.string().uuid("Invalid product"),
  qty: z.number().int().min(1, "Quantity must be at least 1"),
  equipment: z
    .array(rentalEquipmentSchema)
    .min(1, "At least one equipment item per product"),
});

export const createRentalSchema = z.object({
  guestId: z.string().uuid("Guest is required"),
  notes: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v : null)),
  productLines: z
    .array(rentalProductLineSchema)
    .min(1, "At least one product is required"),
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
export const bulkEmailSchema = z.object({
  date: z.string().min(1, "Date is required"),
  statuses: z
    .array(z.nativeEnum(BookingStatus))
    .min(1, "Select at least one status"),
  subject: z.string().trim().min(1, "Subject is required"),
  message: z.string().trim().min(1, "Message is required"),
});

export type BulkEmailData = z.infer<typeof bulkEmailSchema>;
