# Instructor Commission

Go-live date: 2026-05-12.

## Overview

Instructor commission is persisted per qualifying lesson session. Each instructor has their own per-lesson-type hourly rates. Sessions whose bookings reach a qualifying status generate a `PENDING` commission row that can be edited or paid out, then locked.

## Data model

Two tables:

- `InstructorProfile` — one per instructor user. Holds six `*RateCents` fields (`privateRateCents`, `semiPrivateRateCents`, `extraPrivateRateCents`, `extraSemiPrivateRateCents`, `foilRateCents`, `kidsRateCents`). Created automatically when `user.isInstructor` is set to `true`.
- `InstructorCommission` — one per `LessonSession` (1:1 via `sessionId @unique`). Stores frozen rate + duration snapshots, calculated and override amounts, status, and optional `paymentId` link.

Schema: `prisma/schema.prisma`.

## Business rules

- **Booking-gated creation.** A commission row exists only when the session has at least one booking with status `CONFIRMED` or `COMPLETED`. Session-creation alone does not create one; booking-status transitions trigger creation. When all qualifying bookings revert (e.g. back to `RESERVED`, `CANCELED`, or `NO_SHOW`), any `PENDING` commission is deleted.
- **Rate snapshot.** `rateAtCreationCents` and `durationMinutes` are frozen on the commission row. Editing the instructor's `InstructorProfile` rates does NOT retroactively affect past commissions.
- **Auto-recalc while PENDING.** When a session's `lessonType`, start/end times, or `instructorId` change and the commission is still `PENDING`, the row is re-snapshotted (new commission type, new rate from the matching profile field, new duration). Any existing `overrideAmountCents` is preserved.
- **Immutability after PAID.** Once `status = PAID`, the row cannot be edited, re-recalculated, or unlinked from its `Payment`. Marking the same commission paid again with the same `paymentId` is idempotent; with a different `paymentId` it is rejected.
- **`finalAmountCents` invariant.** `finalAmountCents = overrideAmountCents ?? calculatedAmountCents`. It is always written by the server (`lib/actions/commission.actions.ts`) and must never be computed client-side.
- **No backfill.** Lesson sessions created before go-live have no commission row. The session detail UI shows "No commission tracked" for them.

## LessonType → CommissionType mapping

| LessonType      | CommissionType       | Profile rate field          |
| --------------- | -------------------- | --------------------------- |
| `PRIVATE`       | `PRIVATE`            | `privateRateCents`          |
| `GROUP`         | `SEMI_PRIVATE`       | `semiPrivateRateCents`      |
| `EXTRA_PRIVATE` | `EXTRA_PRIVATE`      | `extraPrivateRateCents`     |
| `EXTRA_GROUP`   | `EXTRA_SEMI_PRIVATE` | `extraSemiPrivateRateCents` |
| `FOIL`          | `FOIL`               | `foilRateCents`             |
| `KIDS`          | `KIDS`               | `kidsRateCents`             |

Helpers live in `lib/commission.ts`.

## Mark-as-paid convention

Commission payouts reuse the existing `Payment` table. The convention is: record a `Payment` row whose `userId` is the instructor's `User.id` (treat the instructor as the recipient on their own payout payment). Accounting creates the payment via `/accounting/payments` first; the commission's "Mark paid" dialog then links to it.

The "Mark paid" payment picker only shows payments where `payment.userId === instructor.id`.

A dedicated `InstructorPayout` table is a possible future refinement; for now the convention above keeps payouts and the existing payment plumbing in one place.

## Files

- `prisma/schema.prisma` — schema (`InstructorProfile`, `InstructorCommission`, `CommissionType`, `CommissionStatus`).
- `lib/commission.ts` — pure helpers: `commissionTypeFromLessonType`, `rateFieldForCommissionType`, `calculateCommissionCents`, `formatEGP`.
- `lib/actions/commission.actions.ts` — server actions: `ensureCommissionForSession`, `updateCommission`, `markCommissionPaid`, `getInstructorCommissions`, `listPayoutPaymentsForInstructor`.
- `lib/actions/lessons.actions.ts` — hooks `ensureCommissionForSession` into all session/booking write paths.
- `lib/actions/user.actions.ts` — upserts `InstructorProfile` when `isInstructor` is true.
- `components/commission/` — UI: `CommissionCard`, `CommissionEditDialog`, `MarkPaidDialog`, `InstructorCommissionsTable`, `CommissionsFilters`, `RateEditor`, `CommissionStatusBadge`.
- `app/(root)/instructors/[id]/page.tsx` — renders `InstructorCommissionsTable` for the selected month.
- `app/(root)/users/edit/[id]/UserEditForm.tsx` — embeds `RateEditor` when `isInstructor` is checked.
- `components/lessons/LessonSessionEditSheet.tsx` — renders `CommissionCard` on each lesson session.
