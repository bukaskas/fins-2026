# Plan: User Type (customer standing) on bookings

## Goal

Tag every user with a "type" that controls how readily we accept their bookings:

| Type        | Meaning                                                                 |
|-------------|------------------------------------------------------------------------|
| `LEVEL_1`   | Good customer — always welcome.                                         |
| `LEVEL_2`   | Better **not** to accept when the date already has **50+ confirmed**.   |
| `LEVEL_3`   | Accept on **Saturdays and weekdays only** (i.e. not Fridays).          |
| `BLACKLIST` | Do **not** accept bookings — guest is not from the community.           |

## What already exists (no work needed)

The data layer and admin editing were already built:

- `enum UserType { LEVEL_1 LEVEL_2 LEVEL_3 BLACKLIST }` — `prisma/schema.prisma:203`
- `userType UserType @default(LEVEL_1)` on `User` — `prisma/schema.prisma:222`
- Migration `prisma/migrations/20260626183842_add_user_type/`
- Validator field `userType: z.nativeEnum(UserType)` — `lib/validators.ts:126`
- Edit form selector + persistence — `app/(root)/users/edit/[id]/UserEditForm.tsx`, `lib/actions/user.actions.ts:126` (`updateUser`)
- Type badge on the user detail page — `app/(root)/users/[id]/page.tsx:52`

So a user **can** be assigned a type today. The type just isn't **enforced** anywhere, and it's missing from a couple of screens.

## Gaps to close

### 1. Enforce the rules in the booking flow (the core work)

File: `lib/actions/booking.actions.ts`, function `createBooking` (line 34).

It already looks up a matching user by email/phone (line ~57) but only reads `{ id: true }`. Extend that lookup to also select `userType`, then gate the booking before it is created.

```ts
const existingUser = await prisma.user.findFirst({
  where: { OR: [
    { email: { equals: validatedData.email, mode: "insensitive" } },
    { phone: validatedData.phone },
  ]},
  select: { id: true, userType: true },
});
```

Add an enforcement helper that runs **before** `prisma.booking.create(...)`. Outcomes are
three-way: **hard reject**, **route to manual review** (`BookingStatus.UNDER_REVIEW`, which
already exists), or **accept** (existing flow). Returns
`{ outcome: "reject" | "review" | "accept"; message?: string }`.

- **BLACKLIST** → **hard reject**. Return `{ success: false, message: "Sorry, this date is fully booked." }`
  (the same neutral message used for closed dates so we don't reveal the flag).
- **LEVEL_3** → **route to review** if the booking date is a **Friday**. Compute the weekday
  from `validatedData.date` (Egypt/Red Sea weekend is Fri–Sat, so "Saturdays and weekdays" =
  every day **except Friday**). Non-Friday dates → accept.
- **LEVEL_2** → **route to review** if the date already has **≥ 50 confirmed people**
  (sum of `numberOfPeople`). Reuse the same per-date confirmed aggregate as the 80-person
  auto-close (`booking.actions.ts:814`):
  ```ts
  const { _sum } = await prisma.booking.aggregate({
    where: { date: { gte: dayStart, lte: dayEnd }, bookingStatus: BookingStatus.CONFIRMED },
    _sum: { numberOfPeople: true },
  });
  if ((_sum.numberOfPeople ?? 0) >= 50) review;
  ```
- **Unmatched guests** (no existing user by email/phone) → **route to review** so staff vet
  anyone not yet in the community.
- **LEVEL_1** (matched) → accept (existing flow).

"Route to review" means create the booking with `bookingStatus: UNDER_REVIEW` instead of the
normal `WAITING_PAYMENT`/`PENDING`, and **skip** the `waitingPaymentAt` countdown and the
straight-to-payment path. Send the guest the "booking request received" email (not a payment
link) and the staff notification (see #4).

Apply this gate for the same audience as the existing closed-date gate: skip it entirely for
`STAFF_ROLES` so staff can always force a booking. Keep the gate **after** the closed-date
check and **before** the existing-user "skip review → payment" logic.

> ⚠️ Note: routing **all unmatched guests** to `UNDER_REVIEW` overrides the current
> auto-confirm behavior for brand-new customers — with this rule, new guests no longer go
> straight to `WAITING_PAYMENT` even when the admin auto-confirm toggle is on. Confirm this is
> acceptable, or scope "send unmatched to review" to apply only when auto-confirm is **off**.

### 2. Surface the matched user's type on the staff notification email

Pass the matched user's `userType` (or "new guest" when unmatched) into
`sendStaffNotificationEmail` so staff see the flag on every booking attempt — especially the
ones routed to `UNDER_REVIEW`. Update the email template under `emails/` and the send helper
signature in `emails/index.tsx`.

### 3. Wire user type into the "new user" form

The create form has no type selector and `createUser` / `createUserAsAdmin` never set it
(defaults to `LEVEL_1`). That's acceptable as a default, but to let admins set it at creation:

- Add a `userType` select to `app/(root)/users/new/UserCreateForm.tsx`
  (mirror the markup already in `UserEditForm.tsx:216`).
- Add `userType?: UserType` to the create payload in
  `lib/actions/user.actions.ts:207` (`createUserAsAdmin`) and pass it through to
  `data: { ... }`.

If we don't want type-at-creation, skip this and rely on the edit form — but then the default
of `LEVEL_1` means new walk-ins are never auto-restricted, which is the desired default anyway.

### 4. Show the type in the users list

`app/(root)/users/page.tsx` doesn't render `userType`. Add a small badge column reusing the
`USER_TYPE_BADGE` map already defined on the detail page (`app/(root)/users/[id]/page.tsx:52`)
— extract it to a shared file (e.g. `components/users/UserTypeBadge.tsx`) so the list, detail,
and forms share one source of truth for labels/colors.

## Resolved decisions

1. **Rejection UX** → LEVEL_2/LEVEL_3 hits are **routed to manual review** (`UNDER_REVIEW`),
   not silently rejected. Only **BLACKLIST** is a hard reject with the neutral "fully booked"
   message.
2. **Guests with no account** → **routed to review** (`UNDER_REVIEW`) so staff vet anyone not
   yet in the community. (See the ⚠️ note in #1 about the interaction with the auto-confirm
   toggle — confirm before building.)
3. **LEVEL_2 threshold** → **50+ people** (sum of `numberOfPeople` on confirmed bookings),
   consistent with the 80-person auto-close rule.
4. **Staff email** → **include the matched user's type** (or "new guest") on every booking
   attempt — see #2 above.

## Test checklist

- LEVEL_1 (matched) → books any day → `WAITING_PAYMENT` as today.
- LEVEL_2 → date with 49 confirmed people accepts; with 50+ → `UNDER_REVIEW`.
- LEVEL_3 → Friday → `UNDER_REVIEW`; Saturday + Sun–Thu accept.
- BLACKLIST → every date hard-rejected with neutral message.
- Unmatched new email/phone → `UNDER_REVIEW`.
- Staff role → all of the above still bookable (gate skipped).
- Routed-to-review bookings get the "request received" guest email, no payment link, no
  `waitingPaymentAt` countdown.
- Staff notification email shows the user type / "new guest".
- No new migration needed (column already deployed).
