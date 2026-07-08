# Plan — Corporate Booking Form

Admin-only form to create a **corporate** booking: name, contact number, event
date, number of people, and the deposit amount owed. Email is optional.

_All design decisions are locked (see "Decisions" below) — this plan is build-ready._

## Decisions (locked)

1. **Date** — form includes a **required date picker** (reuse the day-use
   calendar block). `Booking.date` is a required column and corporate events have a date.
2. **Status** — new bookings are created **fixed as `WAITING_PAYMENT`** (deposit
   owed → lands in the payment queue). No status selector on the form.
3. **Deposit** — the amount is what's **owed** → stored in `totalPriceCents`,
   with `amountPaidCents = 0`. The deposit is collected later via the existing
   `PayDepositDialog`.
4. **Email** — an **optional** email field is included (null when left blank).

## Goal & scope

An admin opens a page, fills the form, and saves a corporate booking:

| Field | Type | Notes |
|-------|------|-------|
| Name | text (required, min 2) | company or contact name |
| Contact number | phone (required) | validated E.164, `defaultCountry="EG"` |
| Email | email (optional) | null when blank |
| Date | date (required) | reuse day-use calendar/popover block |
| Number of people | int (required, ≥ 1) | |
| Deposit owed | EGP amount (required, > 0) | stored in cents as amount **due** |

Out of scope for v1: emailing the guest, payment-link generation, agent
assignment. Collecting the deposit reuses the existing `PayDepositDialog` flow.

## Key design decision — reuse the `Booking` model

Do **not** add a new table. A corporate booking is a `Booking` row with
`service = "corporate"`. This matches how `createDayUseBookingAdmin`
(`lib/actions/booking.actions.ts:1371`) already creates admin bookings and lets
corporate bookings show up in the existing bookings lists, calendar, and
reception dashboard for free. **No Prisma migration required.**

Field mapping onto `Booking` (`prisma/schema.prisma:136`):

- `name` → `name`
- contact number → `phone`
- email → `email` (nullable; null when blank)
- date → `date` (store as UTC midnight, like the day-use form)
- number of people → `numberOfPeople`
- **deposit owed → `totalPriceCents`**; `amountPaidCents` starts at `0`. When the
  deposit is collected, the existing `PayDepositDialog` / `payBookingDeposit`
  advances `amountPaidCents`, so "paid vs. due" is tracked with zero new plumbing.
- `service` → `"corporate"` (string literal, no enum change needed)
- `bookingStatus` → **`WAITING_PAYMENT`** (fixed)

## Files to create / change

1. **`lib/validators.ts`** — add `corporateBookingSchema`:
   ```ts
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
   ```
   Reuse existing `phoneSchema` and `emailSchema` (the optional-email preprocess
   mirrors `updateBookingSchema`, `lib/validators.ts:68`). Amount is entered in
   EGP and converted to cents in the client
   (`Math.round(parseFloat(egp) * 100)`), matching `DayUseAdminForm`.

2. **`lib/actions/booking.actions.ts`** — add `createCorporateBooking(data)`:
   - `await requireCapability("bookings:manage")` (same guard as the day-use admin action).
   - `corporateBookingSchema.parse(data)`.
   - `prisma.booking.create({ data: { service: "corporate", name, phone, email,
     date, numberOfPeople, totalPriceCents: depositCents, amountPaidCents: 0,
     bookingStatus: BookingStatus.WAITING_PAYMENT } })`.
   - `revalidatePath("/bookings")`.
   - Return `{ success, bookingId }` / `{ success: false, message }` — mirror the
     day-use action's shape.

3. **`app/(root)/bookings/corporate/new/page.tsx`** — server component page wrapper.
   Copy the layout/header/card shell from
   `app/(root)/bookings/day-use/new/page.tsx` (gradient background, back link,
   glass card), changing the eyebrow to `Fins · Corporate` and heading to
   "New Booking". Renders `<CorporateAdminForm />`.

4. **`app/(root)/bookings/corporate/new/CorporateAdminForm.tsx`** — `"use client"`
   form. Base it on `DayUseAdminForm.tsx`; reuse its `fieldBox`, `labelStyle`,
   `inputStyle` classes, the `PhoneInput` wrapper block, and the `Popover` +
   `Calendar` date block verbatim. Fields in order: Name, Contact number
   (`PhoneInput`), Email (optional), Date (calendar popover, store as
   `Date.UTC(...)`), Number of people (number input), Deposit owed — EGP (number
   input). Client-side guards before submit: name non-empty, phone non-empty,
   date picked, deposit > 0. On submit → `createCorporateBooking`, toast, then
   `router.push("/bookings")`.

5. **Entry point** — add a link/button to the corporate form on
   `app/(root)/bookings/page.tsx`, next to the existing "New day-use booking"
   action. (Confirm exactly where that link lives when implementing.)

## Design system

Follow `.claude/design-system/MASTER.md`. There is no
`.claude/design-system/pages/corporate*.md`, so MASTER governs. Fastest correct
path: mirror the existing `day-use/new` page + form styling exactly so the new
page reads as part of the same family (soft rounded fields, sky-blue gradient
submit, Raleway font vars).

## Reception / payment follow-up (no new work)

Because the row is a normal `Booking` with `totalPriceCents` set and
`amountPaidCents = 0`, the deposit can be collected later through the existing
`PayDepositDialog` (`components/bookings/PayDepositDialog.tsx`) →
`payBookingDeposit`, which appends a `BookingPayment` and advances
`amountPaidCents`. No changes needed there.

## Verification

- `npm run lint` and `npm run build`.
- Manually: open `/bookings/corporate/new`, submit valid + invalid inputs
  (empty name, bad phone, no date, 0 people, 0 deposit, blank email) and confirm
  validation, that a blank email saves as null, and that the row appears in the
  bookings list as `WAITING_PAYMENT` with the deposit shown as due/unpaid.
