# Code Review v1 — fins-store-v3

**Date:** 2026-07-05
**Scope:** Full codebase — server actions (`lib/actions/`), auth (`lib/auth*.ts`, `proxy.ts`), API routes (`app/api/`), Prisma schema, shared libs (`lib/`), validators, Flash payment integration, and spot checks of client components.
**Stack reviewed:** Next.js 16 App Router, NextAuth v4 (JWT), Prisma 6 + Neon, Server Actions as the data layer.

---

## Overall assessment

The domain modeling is solid: money is consistently in integer cents, the wallet ledger is append-only with idempotency keys, commission/expense flows use optimistic status checks (`updateMany` + count verification), and the Flash webhook verifies HMAC signatures with a timing-safe compare. The main problem is **authorization**: route-level protection exists in `proxy.ts`, but the server actions themselves — which are directly invokable POST endpoints — almost never check the caller's session. Combined with a signup flow that effectively assigns everyone the password `12345678`, the back office and financial data are exposed to any anonymous visitor.

Findings are ordered by severity. File references are `path:line`.

---

## Critical

### C1. Systemic: server actions have no authorization checks ✅ FIXED (2026-07-06)

Next.js server actions are public HTTP endpoints. The `proxy.ts` role gate only matches page URLs (`/bookings`, `/accounting`, …), but an attacker can invoke any exported `"use server"` function by POSTing its action ID to an **unprotected** route (e.g. `/`), so route middleware does not protect actions. Each mutating or sensitive action must verify the session itself.

Only `lib/actions/user.actions.ts`, `settings.actions.ts`, and four functions in `booking.actions.ts` (`sendFullyBookedEmails`, `sendBulkEmails`, `deleteDepositPayment`, `payBookingDeposit`) do this. Everything else is callable by anonymous users. Highest-impact examples:

| Action | File | Impact |
|---|---|---|
| `postWalletLedger` | `lib/actions/lessons.actions.ts:127` | **Mint arbitrary wallet credit** for any user (exported `"use server"` helper) |
| `getOrCreateWallet` | `lib/actions/lessons.actions.ts:102` | Create wallets for any user |
| `settleUserBalance`, `submitPaymentFromForm`, `updatePayment` | `lib/actions/payment.actions.ts:210,427,311` | Record/edit payments, mark any order PAID (incl. via `DISCOUNT` method for free) |
| `createOrderForUser`, `consumeBundleUnit` | `lib/actions/payment.actions.ts:38,152` | Create charges / drain another user's credits |
| `settleInstructorCommissions`, `markCommissionPaid`, `updateCommission` | `lib/actions/commission.actions.ts` | Fabricate payouts, override commission amounts |
| `createExpense`, `markExpensePaid`, `settlePayeeExpenses` | `lib/actions/expense.actions.ts` | Fabricate/settle expenses |
| `deleteBooking`, `updateBookingStatus`, `updateBookingAmountPaid`, `assignBookingAgent`, `batchUpdateBookingSchedule`, `createDayUseBookingAdmin`, `updateBookingParty`, `createBookingPaymentLink` | `lib/actions/booking.actions.ts` | Delete/confirm/re-price any booking anonymously |
| `deleteLessonSession`, `updateLessonSession`, `batchUpdateSessionSchedule`, `addGuestToSession`, `createLessonSessionQuick` | `lib/actions/lessons.actions.ts` | Destroy/alter lesson history (feeds commissions & revenue) |
| `createRental`, `returnRental`, `cancelRental` | `lib/actions/rental.actions.ts` | Manipulate inventory + open orders |
| `createInventoryItem`, `updateInventoryItem`, `adjustInventoryQty` | `lib/actions/inventory.actions.ts` | Falsify stock |
| `createProduct`, `updateProduct`, `toggleProductActive` | `lib/actions/product.actions.ts` | **Re-price any product** (all order/lesson pricing derives from `product.priceCents`) |
| `addClosedDate`, `removeClosedDate` | `lib/actions/closedDate.actions.ts` | Close/open the venue |
| `quickAddBeachUse` | `lib/actions/beach-visit.actions.ts:14` | Consume other users' credits / create charges |

Sensitive **reads** are equally open: `getAllBookings`, `getAllDepositPayments`, `getAgentStats` (booking.actions), `getAllLessons`, `getLessonFormUsers` (full user list with phone/email), `getInstructorSessions`, `getAllRentals`, `getRentalFormUsers`, `listUnsettledOrders`, `listPaymentsGroupedByMethod`, `getInstructorCommissions`, `listExpenses`, `getExpenseSummary` — customer PII plus the entire financial state of the business.

**Fix:** add a guard as the first statement of every non-public action. You already have the right primitives in `lib/auth-guard.ts` — e.g. `await requireRole(STAFF_ROLES)` / `ADMIN_ROLES`. Consider a lint rule or a wrapper (`staffAction(fn)`) so new actions can't be added unguarded. Keep truly public actions (`createBooking`, `createKitesurfingBookingFromPublic`, `createUser`, password reset) explicitly documented as public. `postWalletLedger` and `getOrCreateWallet` should stop being exported server actions entirely — move them to a non-`"use server"` module so they're compile-time internal.

### C2. Signup: no password policy, and the form ships a default password of `12345678` ✅ FIXED (2026-07-06)

- `signUpFormSchema.password` is `z.string()` with no minimum (`lib/validators.ts:79`).
- The signup form's default values pre-fill `password: "12345678"` (`app/(root)/signup/SignUpForm.tsx:28`), so any user who doesn't notice the field registers with that exact password.
- `createUser` (`lib/actions/user.actions.ts:16`) never re-validates its input server-side — it trusts the client-sent object, so even the weak client schema can be bypassed (empty password, oversized fields, etc.).

**Fix:** remove the default value; enforce `min(8)` (matching `resetPasswordSchema`) in the schema; call `signUpFormSchema.parse(data)` inside `createUser` before hashing. Consider forcing a reset for existing accounts whose hash matches `12345678`.

### C3. Client controls the booking price that the payment deposit is derived from ✅ FIXED (2026-07-06)

`createBooking` (`lib/actions/booking.actions.ts:34`) persists `validatedData.totalPriceCents` straight from the client (schema only checks `int ≥ 0`). `createBookingPaymentLink` (`booking.actions.ts:900`) then computes the 50% deposit from that stored value, and payment auto-confirms the booking. A malicious guest (or anyone replaying the action) can submit a day-use booking for 20 people with `totalPriceCents: 1000`, pay a 5 EGP deposit, and get CONFIRMED.

The server already has `computeBookingTotalCents` (`lib/pricing.ts:73`) — `updateBooking` and `updateBookingParty` use it. `createBooking` should too, ignoring the client value for services with a known price (day-use, pharaoh-airstyle) and treating the client value only as a display hint.

Related: `numberOfPeople` has no upper bound (`lib/validators.ts:40`), so a single request can claim 10⁹ people (skews capacity aggregates and the 80-person auto-close).

### C4. Unauthenticated financial/PII API routes ✅ FIXED (2026-07-06)

- `GET /api/instructors/[id]/invoice` (`app/api/instructors/[id]/invoice/route.ts:20`) — anyone can enumerate instructor IDs and download PDFs with names, emails, phones, per-lesson earnings and student names.
- `GET /api/expenses/invoice?payeeId=…` (`app/api/expenses/invoice/route.ts:15`) — same for payee expenses.

The `proxy.ts` matcher doesn't cover `/api/*`, and neither route checks a session. **Fix:** verify session + staff/admin role at the top of each handler (or extend the proxy matcher to include these paths as a second layer).

---

## High

### H1. Prisma client is not a singleton in dev ✅ FIXED (2026-07-06)

`db/prisma.ts` creates a new `PrismaClient` on every module evaluation. Under `next dev` hot reload, each recompile leaks another client + Neon websocket pool, eventually exhausting connections. Use the standard pattern:

```ts
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### H2. Email case handling is inconsistent → lockouts and duplicate identities ✅ FIXED (2026-07-06 — run scripts/normalize-user-emails.ts for existing rows)

- `authorize()` looks up the login email verbatim (`lib/auth.ts:26`); `createUser` stores it verbatim; `requestPasswordReset` lowercases (`auth.actions.ts:24`); `createBooking` matches with `mode: "insensitive"`; `createKitesurfingBookingFromPublic` matches exact.
- A user who signs up as `John@x.com` can log in only with that exact casing, and `requestPasswordReset` will never find them (it lowercases). Conversely `john@x.com` and `John@x.com` can coexist as two accounts.

**Fix:** normalize (`trim().toLowerCase()`) at every boundary — signup, admin create, guest create, authorize, kitesurfing public booking — and run a one-off migration to lowercase existing rows (dedupe first).

### H3. Password reset doesn't invalidate active sessions ✅ FIXED (2026-07-06 — requires migration)

`resetPassword` (`lib/actions/auth.actions.ts:56`) changes the hash but JWT sessions live 30 days (`lib/auth.ts:13`) and nothing rotates them. An attacker holding a stolen session survives the victim's password reset. With JWT strategy you need a token-versioning mechanism (e.g. a `sessionVersion` column checked in the `jwt` callback) or a shorter `maxAge`. Also: `requestPasswordReset` / `resendVerification` have no rate limiting — trivially usable to spam a victim's inbox via Resend.

### H4. `onDelete: Cascade` on financial records contradicts the append-only ledger ✅ FIXED (2026-07-06 — requires migration)

`Order`, `Payment`, `UserWallet`, `WalletLedger`, `LessonBooking`, `BeachVisit`, `Rental` all cascade from `User` (`prisma/schema.prisma:368,398,430,456…`). One admin click on `deleteUser` silently erases the user's entire financial and ledger history — the very thing the append-only `WalletLedger` policy is meant to prevent (only `InstructorCommission` is `Restrict`). Prefer `Restrict` (block deletion while financial rows exist) plus a soft-delete/anonymize flow for GDPR-style removal.

### H5. Flash webhook logs secrets and full payloads unconditionally ✅ FIXED (2026-07-06)

`app/api/payments/flash/webhook/route.ts:24` logs **all request headers** (including the `signature` header and anything else Flash sends) and the raw body on every hit, outside the DEBUG flag. The comment says "remove once the integration is confirmed working" — it's still there. Gate it behind `FLASH_WEBHOOK_DEBUG` and redact the signature.

---

## Medium

### M1. Concurrent payment settlement can over-allocate ✅ FIXED (2026-07-06)

`settleUserBalance` (`payment.actions.ts:218`) reads open orders, computes outstanding, and inserts allocations inside an interactive transaction — but with default isolation, two simultaneous settlements for the same user can both read the same "outstanding" and together allocate more than the order total (status recompute then marks it PAID with paid > total). Same pattern in `updatePayment`. Low probability at a front desk, but this is money. Options: `Serializable` isolation for these transactions, `SELECT … FOR UPDATE` on the orders, or a per-user advisory lock.

### M2. Order↔lesson linkage is a ±24h time-window heuristic ✅ FIXED (2026-07-06 — new links only; legacy rows use the old fallback)

`repriceGuestOrdersForSession` (`lessons.actions.ts:671`) and `classifyBooking` (`session-revenue.ts:133`) locate "the order for this lesson" by searching the guest's order lines created within ±24 hours of the session start. A guest with two lessons (or a lesson + a shop order with a lesson SKU) in that window can get the **wrong order re-priced** or revenue misattributed. The schema already links `WalletLedger` to `lessonBookingId`/`orderLineId`; add an explicit `orderId`/`orderLineId` FK on `LessonBooking` when charging (`chargeGuestForSession` creates the order — the link is known at that moment) and drop the heuristic.

### M3. Unapplied payment remainder disappears from accounting ✅ FIXED (2026-07-06 — overpayment now rejected)

`settleUserBalance` returns `unappliedCents` when a payment exceeds outstanding orders, but nothing persists it — the `Payment` row keeps the full amount while allocations sum to less. There's no credit-balance concept, and future orders won't consume the surplus. Either reject overpayment, auto-credit a wallet, or surface unallocated amounts in the accounting UI so they're not silently absorbed.

### M4. Client-supplied `actorId` (and it's never actually sent) ✅ FIXED (2026-07-06)

`quickAddBeachUse` (`beach-visit.actions.ts:21`), `createRental` (`rental.actions.ts:11`), and `adjustInventoryQty` (`inventory.actions.ts:89`) read `actorId` from `FormData` — spoofable attribution for audit rows. Grep shows no caller ever sets it, so attribution is also always `null` in practice. Take the actor from `getServerSession` server-side (as `payBookingDeposit` already does).

### M5. Timezone handling is inconsistent around day boundaries ✅ FIXED (2026-07-06)

- `createBooking`'s closed-date gate uses local `startOfDay` (`booking.actions.ts:42`) while `addClosedDate` normalizes to UTC midnight (`closedDate.actions.ts:26`) — on a server not running in UTC the closed-date check can miss (or match the wrong day).
- `getDayUseMonthlyReport` builds month bounds with local-TZ `new Date(year, month-1, 1)` (`booking.actions.ts:182`) while most other queries use explicit `T00:00:00.000Z` UTC strings.
- `updateBookingStatus`'s 80-person aggregation uses local `startOfDay` (`booking.actions.ts:848`).

Pick one convention (UTC calendar days, which most of the code already uses) and apply it everywhere.

### M6. Public read path performs writes ✅ FIXED (2026-07-06)

`getBookingById` — used by the public booking-status page — calls `cancelExpiredWaitingPayments()` (`booking.actions.ts:793`), a DB `updateMany` + `revalidatePath`, on every anonymous GET. Same in `getAllBookings`. It's idempotent, but it turns cached reads into writes and lets anonymous traffic drive revalidation. The cron route (`/api/cron/cancel-expired-bookings`) should be the only trigger; also note that route is **open when `CRON_SECRET` is unset** — make the secret required in production.

### M7. Inventory adjustments can go negative / drift ✅ FIXED (2026-07-06)

`adjustInventoryQty` (`inventory.actions.ts:84`) applies any adjustment to both `totalQty` and `availableQty` with no floor check — a typo can drive `availableQty` below zero or below what's out on rentals (rental creation checks `availableQty < requested` only at checkout time). Add `gte` guards in the `update` where-clause like `consumeBundleUnit` does, and validate `type` against the enum instead of casting.

### M8. `updateLessonBooking` never clears `checkedInAt` ✅ FIXED (2026-07-06)

`lessons.actions.ts:779` sets `checkedInAt` when `attended && CONFIRMED`, else passes `undefined` (no-op). Un-checking attendance leaves the stale timestamp. Use `null` in the else branch if clearing is intended.

### M9. Duplicate, contradictory beach-use pricing constants ✅ FIXED (2026-07-06 — walk-ins now use lib/pricing date-aware rates)

`beach-visit.actions.ts:9` defines `DAY_USE_PRICE_CENTS = 150000` with the note "// 1500 EGP" but the checkout note says "regular 500 EGP" (`:107`), and `HOLIDAY_PRICE_MULTIPLIER` (`:11`) is defined but never applied — so holiday walk-ins are charged the standard rate, which may be a real revenue bug rather than dead code. `lib/pricing.ts:3` independently defines `ADULT_PRICE_CENTS = 150000`. Single-source the price and either apply or delete the holiday multiplier.

---

## Low / cleanup

- **Dead code:** `LESSON_PRICES_EGP` and `COMMISSION_RATE` (`lib/pricing.ts:90-99`) are unused. `import { email, z }` in `lib/validators.ts:1` — `email` is unused. Two different `formatEGP` implementations exist (`lib/pricing.ts:69`, `lib/commission.ts:60`) with different formatting.
- **Dependencies:** `@anthropic-ai/claude-code` is a production dependency (`package.json:16`) — move out of the app manifest. `@prisma/adapter-pg` and `pg` appear unused (runtime uses the Neon adapter); `lodash` and `dotenv` are worth auditing too.
- **Error leakage:** most catch blocks return `error.message` verbatim to the client (e.g. `booking.actions.ts:130`, `payment.actions.ts:422`). Prisma/infra errors can leak schema details; return generic messages and keep the detail in server logs.
- **`createUser` Account row:** `providerAccountId` is set to the user's email (`user.actions.ts:36`); if the email is later changed via `updateUser`, the row goes stale. Use `user.id`.
- **`recordFlashPayment` field tolerance:** amount comes from `payload.PaidAmountCents ?? order.amountCents` (`booking.actions.ts:950`) — the odd casing is presumably from Flash docs, but if both fields are absent the event is ignored silently; worth a warn-level log with the raw payload shape (under DEBUG).
- **`searchUser` / list actions cap results but don't paginate** (`user.actions.ts:185` take 25, `listUsers` take 100, `listExpenses` take 500) — fine for now, just noting the cliff.
- **No tests.** For the money paths (settlement allocation, wallet idempotency, commission recompute, Flash webhook idempotency) even a small Vitest suite against a local Postgres would pay for itself — several bugs above (M1–M3) are exactly the kind unit tests catch.
- **`console.log` noise** in production paths (`createUser`, SignUpForm logs validation errors to the browser console including field data).

---

## What's done well

- **Money discipline:** integer cents everywhere, `Decimal` for fractional quantities/wallet balances, snapshots of rates on commissions (`rateAtCreationCents`) and credits on order lines (`creditUnitsEach`).
- **Idempotency:** wallet ledger unique `(walletId, idempotencyKey)` with a race-safe P2002 recovery path (`lessons.actions.ts:186`); Flash payments keyed on `flashTransactionId` with a DB unique constraint; `cancelExpiredWaitingPayments` idempotent by construction.
- **Optimistic concurrency on status transitions:** `updateMany({ where: { status: PENDING } })` + count check in commissions/expenses is the right pattern.
- **Webhook security:** HMAC-SHA256 with `crypto.timingSafeEqual` and canonical payload construction (`lib/flash.ts:338`).
- **Token hygiene:** reset/verify tokens are 256-bit random, stored hashed, single-use, TTL-bound, and the reset flow returns a uniform message to prevent account enumeration.
- **`safeReturnTo`** (`lessons.actions.ts:262`) correctly guards against open redirects.

---

## Suggested priority order

1. **C1** — sweep every server action and add `requireRole` guards (a day of mechanical work; highest risk reduction per hour).
2. **C2** — remove the default password, enforce min length client + server.
3. **C4** — auth on the two invoice API routes.
4. **C3** — recompute booking totals server-side.
5. **H1/H2** — prisma singleton + email normalization (small, prevents ongoing data corruption).
6. Then the High/Medium items as capacity allows.
