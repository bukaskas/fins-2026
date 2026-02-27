This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Database Documentation

## Overview

This database supports:

- User auth and roles
- Sales (`Order`, `OrderLine`)
- Settlement (`Payment`, `PaymentAllocation`)
- Credit accounting with **Wallet + Ledger** (`UserWallet`, `WalletLedger`)
- Operations: lessons, beach visits, rentals, inventory

---

## Core Domains

## 1) Identity & Access

### `User`

Main account record.

Key fields:

- `email` (unique)
- `password`
- `role` (`ADMIN`, `STAFF`, `ACCOUNTANT`, `INSTRUCTOR`, `KITER`, `OWNER`, `MEMBER`)

Relations:

- auth (`Account`, `Session`)
- commerce (`orders`, `payments`)
- operations (`lessonBookings`, `beachVisits`, `rentals`)
- wallet (`wallets`, `walletLedgerOwned`, `walletLedgerActor`)

### `Account`, `Session`, `VerificationToken`

Auth/session infrastructure (NextAuth-style).

---

## 2) Membership

### `Member`

Membership validity per user (`validUntil`, `membershipType`).

Used by beach check-in logic:

- If active membership => no charge / member flow.

---

## 3) Products, Orders, Payments

### `Product`

Sellable items.

- `type`: `SERVICE` or `BUNDLE_CREDIT`
- `creditUnits`, `creditValidDays` used for credit-like products

### `Order`

Commercial charge container.

- `status`: `OPEN | PARTIAL | PAID | CANCELED`
- `totalCents`

### `OrderLine`

Line-level sold item.

- snapshot pricing: `unitPriceCents`, `lineTotalCents`
- optional `creditUnitsEach` snapshot for bundle products

### `Payment`

Incoming money event (`method`, `amountCents`, `reference`).

### `PaymentAllocation`

Maps payment amounts to specific orders.

- enables partial settlement and order-level paid tracking

---

## 4) Wallet + Ledger (Credit Accounting)

## Why

Replaces mutable credit counters with append-only events.

### `UserWallet`

Current balance bucket per user and wallet type.

- unique per (`userId`, `type`)
- `type`: `BEACH_USE` | `LESSON_HOURS`
- `unit`: `ENTRY` | `HOUR`
- `balance`: cached current balance

### `WalletLedger`

Immutable movement log (audit trail).

Fields:

- `delta` (signed): `+` credit, `-` consumption
- `balanceAfter`
- `reason`: `PURCHASE`, `CONSUMPTION`, `ADJUSTMENT`, `REFUND`, `EXPIRY`, `MIGRATION`
- optional refs:
  - `orderId`, `orderLineId`, `paymentId`
  - `lessonBookingId`, `beachVisitId`, `rentalId`
- `userId` = wallet owner
- `actorId` = who performed action (staff/admin/system)

### Semantic migration

- old `totalUnits / unitsUsed / remainingUnits`
- now:
  - movements in `WalletLedger.delta`
  - current value in `UserWallet.balance` (derived from ledger, cached in wallet)

---

## 5) Lessons

### `LessonSession`

Scheduled slot:

- `startsAt`, `endsAt`, `lessonType`, `capacity`, `instructorId`

### `LessonBooking`

Guest reservation in a session:

- status lifecycle (`RESERVED`, `CONFIRMED`, `COMPLETED`, etc.)
- wallet consumption is linked via `WalletLedger.lessonBookingId`

---

## 6) Beach Use

### `BeachVisit`

Visit/check-in record:

- `type` (`REGULAR`, `LOCAL`, `MEMBER_FREE`)
- `status` (`OPEN`, `COMPLETED`, `CANCELED`)
- wallet consumption linked via `WalletLedger.beachVisitId`

---

## 7) Rentals & Inventory

### `Rental`, `RentalLine`

Rental transaction and rented items with pricing.

### `InventoryItem`

Stock and availability by category/condition.

### `InventoryMovement`

Stock movement audit (`IN`, `OUT`, `ADJUSTMENT`, etc.), optional actor.

---

## Main Business Flows

## A) Product purchase

1. Create `Order` + `OrderLine`.
2. If product grants credits:
   - create/find `UserWallet`
   - post `WalletLedger` with `delta > 0`, `reason = PURCHASE`, refs to `order/orderLine`
   - update wallet `balance`

## B) Payment settlement

1. Create `Payment`.
2. Allocate to oldest open orders via `PaymentAllocation`.
3. Update `Order.status` to `OPEN/PARTIAL/PAID`.

## C) Credit consumption (lesson/beach/rental)

1. Validate sufficient wallet balance.
2. Post `WalletLedger` with `delta < 0`, `reason = CONSUMPTION`, link activity id.
3. Update `UserWallet.balance`.

---

## Conventions

- Money is stored in integer cents (`*Cents`).
- Wallet units are decimal (`ENTRY` / `HOUR`) for fractional consumption support.
- Ledger is append-only; avoid in-place edits for auditability.
- Use idempotency keys when posting ledger entries from retryable operations.

---

## Operational Notes

- Keep old credit tables only during migration/cutover.
- After full cutover, use wallet/ledger as single source of truth for credit balances.
- Add DB constraints/indexes for fast lookups on `userId`, `walletId`, `occurredAt`.
