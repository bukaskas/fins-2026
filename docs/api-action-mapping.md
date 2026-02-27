# API / Server Action Mapping

This document maps server actions to database tables they **write** (and key reads when relevant).

## `lib/actions/user.actions.ts`

### `createUser(data)`

**Writes**

- `User`
- `Account`

**Also**

- Sends registration email (external provider, not DB)

---

### `updateUser(id, data)`

**Writes**

- `User`

---

### `getUserById(id)`, `listUsers(query)`, `searchUser(query)`

**Writes**

- none (read-only)

---

## `lib/actions/payment.actions.ts`

### `createOrderForUser({ userId, items })`

**Writes**

- `Order`
- `OrderLine`
- legacy: `UserCreditGrant` (for `BUNDLE_CREDIT` products)

**Planned/target (wallet cutover)**

- `UserWallet` (create/find)
- `WalletLedger` (`reason = PURCHASE`, positive `delta`, refs to `orderId/orderLineId`)

---

### `settleUserBalance({ userId, amountCents, method, reference })`

**Writes**

- `Payment`
- `PaymentAllocation`
- `Order` (status updates: `OPEN/PARTIAL/PAID`)

---

### `submitPaymentFromForm(formData)`

**Writes (indirect)**

- Calls `settleUserBalance(...)` one or two times
  - payment amount
  - optional discount entry (as method `DISCOUNT` in current implementation)

---

### `consumeBundleUnit({ userId, ... })`

**Writes**

- legacy: `UserCreditGrant` (decrement `remainingUnits`)
- legacy: `UserCreditUsage`

**Planned/target (wallet cutover)**

- `UserWallet` (balance update)
- `WalletLedger` (`reason = CONSUMPTION`, negative `delta`)

---

## `lib/actions/beach-visit.actions.ts`

### `quickAddBeachUse(formData)` (current flow discussed)

**Writes (depending on branch)**

- `BeachVisit`
- May consume legacy credit:
  - `UserCreditGrant`
  - `UserCreditUsage`
- May create charge:
  - `Order`
  - `OrderLine` (via product line in order path)

**Planned/target (wallet cutover)**

- `WalletLedger` with `beachVisitId` reference for consumption entries

---

## `lib/actions/order.actions.ts`

### `listUnsettledOrders()`

**Writes**

- none (read-only)
- Reads `Order`, `PaymentAllocation` (via allocations), `User`

---

## Booking / Lesson actions (file-dependent)

Any action that confirms attendance/consumption should write:

**Planned/target**

- `WalletLedger` with:
  - `lessonBookingId` for lesson usage
  - negative `delta`
  - `reason = CONSUMPTION`

---

## Wallet helper actions (recommended)

Create shared helpers and use everywhere:

1. `getOrCreateWallet(userId, type, unit)`
   - **Writes:** `UserWallet` (when missing)

2. `postWalletLedger({ walletId, userId, actorId?, delta, reason, refs... })`
   - **Writes:** `WalletLedger`
   - **Writes:** `UserWallet.balance` (atomic update)
   - Enforce idempotency via `idempotencyKey`

---

## Cutover note

During migration period:

- Keep dual-write for old credit tables and new wallet tables.
- After verification, remove writes to:
  - `UserCreditGrant`
  - `UserCreditUsage`
