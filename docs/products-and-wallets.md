# Products and wallets

How products are added to a user, how wallets get credited and consumed, and where each piece lives in the codebase. **Keep this file in sync** whenever you change any of the entry points or schema listed below.

## Overview

Two kinds of products exist:

- **`SERVICE`** — direct charge (e.g. a single private lesson). Creating an order for a `SERVICE` product just bills the user; no wallet is involved.
- **`BUNDLE_CREDIT`** — prepaid credits (e.g. "10 lesson hours"). Creating an order for a `BUNDLE_CREDIT` product **credits the user's wallet immediately** with `creditUnits` × `qty`. The user later consumes those units as they take lessons / beach days.

Two wallet types:

- **`LESSON_HOURS`** (unit: `HOUR`) — consumed by lessons.
- **`BEACH_USE`** (unit: `ENTRY`) — consumed by beach visits.

Money is always integer **cents** (`*Cents` suffix). Wallet balance is a `Decimal(12,2)`. The `WalletLedger` is **append-only** — every change to a wallet writes one row, and rows are never deleted or updated.

## Data model

`prisma/schema.prisma`:

- `Product` — `type` (`SERVICE` | `BUNDLE_CREDIT`), `priceCents`, `creditUnits?`, `walletType?`, `walletUnit?`, `isActive`. For `BUNDLE_CREDIT`, `walletType` + `walletUnit` are required and `creditUnits` must be > 0.
- `Order` / `OrderLine` — line stores `creditUnitsEach` snapshot at sale time so price/credit changes don't rewrite history.
- `UserWallet` — one row per `(userId, type)`. Created lazily.
- `WalletLedger` — immutable. Every entry has a signed `delta`, the `balanceAfter`, a `reason` (`PURCHASE | CONSUMPTION | ADJUSTMENT | REFUND | EXPIRY | MIGRATION`), and optional foreign keys to `orderId`, `orderLineId`, `paymentId`, `lessonBookingId`, `beachVisitId`, `rentalId`. The `idempotencyKey` column plus the `@@unique([walletId, idempotencyKey])` constraint protects against duplicate writes on retries.

## Entry points — where products get added to a user

There are **three** code paths that add a product (and therefore a wallet credit) to a user today. Any new path you build should follow the same conventions.

### 1. Generic order creation — `createOrderForUser`

File: `lib/actions/payment.actions.ts` (`createOrderForUser`).

- Used by accounting / manual order creation flows.
- Takes `{ userId, items: [{ productId, qty }] }`. Creates an `Order` with status `OPEN`, one `OrderLine` per item.
- For each `BUNDLE_CREDIT` line: upserts the matching `UserWallet`, increments balance by `creditUnits × qty`, writes a `PURCHASE` ledger row with `idempotencyKey = "purchase:{orderLineId}"`.
- `SERVICE` lines just become part of the order; no wallet write.
- The order is `OPEN` until paid (see `settleUserBalance`).

### 2. Bundle-on-the-fly during lesson creation — `createLessonSessionFromForm`

File: `lib/actions/lessons.actions.ts` (`createLessonSessionFromForm`).
UI: `app/(root)/lessons/new/page.tsx` → `components/lessons/NewLessonForm.tsx`.

Admin path used when booking a new lesson at `/lessons/new`:

1. Read the student's `LESSON_HOURS` wallet (upsert if missing).
2. If the form supplied `bundleProductId`: load the product, validate (`isActive`, `type === BUNDLE_CREDIT`, `walletType === LESSON_HOURS`, `creditUnits >= requiredHours`), create `Order` + `OrderLine`, credit the wallet, write a `PURCHASE` ledger row keyed `purchase:{orderLineId}`. (Mirrors the bundle path in `createOrderForUser` — kept inline because everything must run in one transaction with the session creation.)
3. Verify `wallet.balance >= requiredHours`; throw otherwise.
4. Create `LessonSession` + `LessonBooking`.
5. Atomic decrement (`update where balance: { gte: requiredHours }`); write a `CONSUMPTION` ledger row keyed `consume:LESSON_HOURS:lesson:{lessonBookingId}`.
6. Call `ensureCommissionForSession`.

The bundle picker is only rendered when the selected student's current balance is less than the lesson duration. Bundles whose `creditUnits` are smaller than `requiredHours` appear disabled in the dropdown.

### 3. Adding a guest to an existing session — `addGuestToSession`

File: `lib/actions/lessons.actions.ts` (`addGuestToSession`, helper `chargeGuestForSession`).
UI: `components/lessons/LessonSessionEditSheet.tsx` (AddGuestSection).

- For ad-hoc guest adds on a session that already exists.
- Currently creates an `Order` with a `SERVICE` product (either the explicit `productId` from the picker, or `getDefaultProductForLessonType(...)` for the session's lesson type). **This path does not consume from the wallet** — it just bills the user for the lesson.
- If you want wallet-based booking here too, port the credit/consume logic from `createLessonSessionFromForm`.

Default per-lesson-type SKUs live in `lib/lesson-products.ts` (`LESSON_TYPE_SKU` + `getDefaultProductForLessonType`).

## Consumption — debiting the wallet

`lib/actions/payment.actions.ts` exports `consumeBundleUnit` (atomic decrement + `CONSUMPTION` ledger row). **It is currently not called directly** — `createLessonSessionFromForm` inlines the equivalent logic so the consume can run inside the same transaction as the lesson creation. Beach-visit and rental consume paths are not yet wired (`consumeBundleUnit` is the function to call when they are).

Idempotency-key convention for consumes:
- Lesson: `consume:LESSON_HOURS:lesson:{lessonBookingId}`
- Beach: `consume:{walletType}:beach:{beachVisitId}`

## Invariants — must hold for every new entry point

1. **Money in cents.** Never use floats for money.
2. **Wallet writes must be transactional.** Every wallet balance change must (a) update `UserWallet.balance` and (b) insert a `WalletLedger` row, in the same `prisma.$transaction`.
3. **Append-only ledger.** Don't update or delete `WalletLedger` rows. Corrections are new `ADJUSTMENT` / `REFUND` rows.
4. **Idempotency key on every write.** Use the conventions above so retries don't double-credit / double-consume.
5. **`balanceAfter` must reflect the post-update balance.** Read it back from the wallet `update` result, not computed client-side.
6. **Use `update where balance: { gte: amount }` for consumes.** This makes the decrement race-safe — concurrent consumes that would overdraw the wallet throw instead of producing a negative balance.
7. **Validate `BUNDLE_CREDIT` products** before crediting: `isActive`, `type === BUNDLE_CREDIT`, matching `walletType` + `walletUnit`, `creditUnits > 0`.

## Read paths — where balances and history are shown

- `getUserLessonHoursBalance(userId)` — `lib/actions/lessons.actions.ts`. Returns the `LESSON_HOURS` balance as a number.
- `getActiveLessonBundleProducts()` — same file. Returns active `BUNDLE_CREDIT` products targeting `LESSON_HOURS`, ordered by `creditUnits` ascending.
- `app/(root)/users/[id]/page.tsx` — per-user activity page: wallet cards, full order history (one row per `OrderLine`), payments, lesson sessions, rentals, beach visits, outstanding balance.
- `app/(root)/products/page.tsx` + `components/products/ProductDialog.tsx` — product CRUD UI.

## Files

- `prisma/schema.prisma` — `Product`, `Order`, `OrderLine`, `UserWallet`, `WalletLedger`, enums.
- `lib/actions/product.actions.ts` — product CRUD.
- `lib/actions/payment.actions.ts` — `createOrderForUser`, `consumeBundleUnit`, `settleUserBalance`, `submitPaymentFromForm`, `listPaymentsGroupedByMethod`.
- `lib/actions/order.actions.ts` — `listUnsettledOrders` (canonical outstanding-balance math).
- `lib/actions/lessons.actions.ts` — `getOrCreateWallet`, `postWalletLedger`, `getUserLessonHoursBalance`, `getActiveLessonBundleProducts`, `createLessonSessionFromForm`, `addGuestToSession`, `chargeGuestForSession`.
- `lib/lesson-products.ts` — default lesson-type SKU map.
- `app/(root)/lessons/new/page.tsx` + `components/lessons/NewLessonForm.tsx` — bundle-on-the-fly during lesson booking.
- `components/lessons/LessonSessionEditSheet.tsx` — ad-hoc guest add (SERVICE charge).
- `components/products/` — product UI.
- `app/(root)/users/[id]/page.tsx` — per-user activity view.

## How to update this doc

Edit this file whenever you:
- Add a new entry point that adds a product or writes to a wallet.
- Add a new `WalletType`, `WalletUnit`, or `WalletLedgerReason`.
- Change the idempotency-key convention.
- Wire `consumeBundleUnit` into a new flow (beach visits, rentals, etc.).
- Move any of the files listed above.

Keep it short — this is a map, not a tutorial.
