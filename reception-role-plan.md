# Plan: Reception role + reception landing page

**Date:** 2026-07-06
**Status:** ✅ All 4 phases implemented 2026-07-06 (decisions D1–D3 below). Pending: apply migration `20260706110000_add_reception_role` (`npx prisma migrate deploy`), then assign the RECEPTION role to staff via /users.
**Goal:** Introduce a `RECEPTION` staff role that can fully manage bookings and the front desk, but cannot touch accounting, products, users, or instructor payouts — and give reception their own landing page that surfaces "what needs doing next."

---

## Where the codebase stands today

- Authorization is a two-tier role list: `ADMIN_ROLES` (ADMIN, OWNER) and `STAFF_ROLES` (+ STAFF, ACCOUNTANT, INSTRUCTOR) in `lib/roles.ts`, enforced by `proxy.ts` (route prefixes) and `requireRole(...)` guards at the top of every server action (added in the security-hardening pass).
- Every staff member currently sees and can do *everything* under the staff tier — an INSTRUCTOR can settle payments, an ACCOUNTANT can edit lessons. Adding RECEPTION as "yet another STAFF_ROLES member" would repeat that mistake.
- Useful groundwork already exists: the role dropdown in `UserEditForm.tsx` renders `Object.values(Role)` (a new enum value appears automatically), the header menu (`components/shared/header/menu.tsx`) already branches on role, and `SignInForm.tsx` already handles a `callbackUrl` redirect.

**Core design decision:** move from *role lists* to a small *capability map*. Roles stay in the DB enum; what changes is that guards ask "can this role manage bookings?" instead of "is this role in the staff list?" This is a mechanical refactor of the existing guards and makes the next role (beach desk? bar staff?) a one-line change.

---

## Phase 1 — Permission foundation (no behavior change yet)

### 1.1 Add the role
- `prisma/schema.prisma`: add `RECEPTION` to the `Role` enum.
- Migration is additive (`ALTER TYPE "Role" ADD VALUE 'RECEPTION'`) — safe, no data touched.
- `lib/roles.ts`: add `"RECEPTION"` to the edge-safe string constants (see 1.2 for where it lands).

### 1.2 Capability map — new `lib/permissions.ts`
Edge-safe (plain strings, no Prisma imports) so `proxy.ts` can use it:

```ts
export const CAPABILITIES = {
  "bookings:manage":   ["ADMIN", "OWNER", "STAFF", "RECEPTION"],
  "desk:checkin":      ["ADMIN", "OWNER", "STAFF", "RECEPTION"],   // /register, beach visits
  "rentals:manage":    ["ADMIN", "OWNER", "STAFF"],                  // D1: reception excluded
  "lessons:manage":    ["ADMIN", "OWNER", "STAFF"],
  "lessons:view":      ["ADMIN", "OWNER", "STAFF", "ACCOUNTANT", "INSTRUCTOR", "RECEPTION"],
  "lessons:book":      ["ADMIN", "OWNER", "STAFF", "RECEPTION"],       // D3: add guest to a session
  "desk:collect":      ["ADMIN", "OWNER", "STAFF", "ACCOUNTANT", "RECEPTION"], // D2: walk-in payments
  "products:view":     ["ADMIN", "OWNER", "STAFF", "ACCOUNTANT", "RECEPTION"], // product pickers in desk/lesson flows
  "accounting:manage": ["ADMIN", "OWNER", "STAFF", "ACCOUNTANT"],
  "inventory:manage":  ["ADMIN", "OWNER", "STAFF"],
  "products:manage":   ["ADMIN", "OWNER", "STAFF"],
  "instructors:manage":["ADMIN", "OWNER", "STAFF", "ACCOUNTANT"],  // commissions/payouts
  "users:admin":       ["ADMIN", "OWNER"],
} as const;
export type Capability = keyof typeof CAPABILITIES;
```

### 1.3 Guard helpers — extend `lib/auth-guard.ts`
- `hasCapability(cap)` / `requireCapability(cap)`, built on the existing `currentRole()`.
- Keep `requireRole`/`STAFF_ROLES` working during the transition so the refactor can land incrementally.

### 1.4 Route protection — `proxy.ts`
Replace the prefix→tier mapping with prefix→capability:

| Prefix | Capability |
|---|---|
| `/users` | `users:admin` |
| `/bookings`, `/reception` | `bookings:manage` |
| `/register` | `desk:checkin` |
| `/rentals` | `rentals:manage` |
| `/lessons`, `/students` | `lessons:view` (page-level), mutations stay `lessons:manage` |
| `/accounting` | `accounting:manage` |
| `/inventory` | `inventory:manage` |
| `/products` | `products:manage` |
| `/instructors` | `instructors:manage` |

The public booking-detail regex and `/my-schedule` stay as they are.

**Estimated effort:** small — one new file, two edited files, one migration.

---

## Phase 2 — Re-scope the server-action guards

Mechanical sweep of the `requireRole(STAFF_ROLES)` guards added in the hardening pass, replacing each with the matching capability:

| Action file | New guard |
|---|---|
| `booking.actions.ts` (all staff actions incl. `payBookingDeposit`, `deleteDepositPayment`, `sendBulkEmails`) | `bookings:manage` |
| `closedDate.actions.ts` (`addClosedDate`, `removeClosedDate`) | `bookings:manage` |
| `settings.actions.ts` (`setAutoConfirmBookings`) | `bookings:manage` |
| `beach-visit.actions.ts` (`quickAddBeachUse`) | `desk:checkin` |
| `rental.actions.ts` | `rentals:manage` |
| `lessons.actions.ts` reads (`getLessonSessionsByDate`, `getAllLessons`, …) | `lessons:view` |
| `lessons.actions.ts` mutations (create/update/delete sessions, `addGuestToSession`) | `lessons:manage` |
| `payment.actions.ts`, `order.actions.ts`, `expense.actions.ts` | `accounting:manage` |
| `commission.actions.ts` | `instructors:manage` |
| `inventory.actions.ts` | `inventory:manage` |
| `product.actions.ts` | `products:manage` |
| `user.actions.ts` | keep as-is (`ADMIN_ROLES`), except `searchUser`/`createGuest`/`createStudent` → `desk:checkin` so reception can look up and register guests |

Two collision points to handle deliberately:
- **Reception + payments.** Reception records booking deposits (`payBookingDeposit` — part of `bookings:manage`) and needs the walk-in desk flow (`desk:checkin`), but should NOT get general accounting (`settleUserBalance`, `updatePayment`, expenses). If the desk needs to take walk-in order payments (D2 below), add a narrow `desk:collect` capability wrapping only `submitPaymentFromForm` rather than opening `accounting:manage`.
- **`getInstructorSessions`** keeps its custom "staff OR own schedule" check; add `lessons:view` as the staff side.

**Estimated effort:** medium — ~60 one-line changes plus a verification sweep (reuse the brace-matching checker from the hardening pass).

---

## Phase 3 — Reception landing page (`/reception`)

A server component at `app/(root)/reception/page.tsx` guarded by `bookings:manage`, backed by one new aggregate action `getReceptionDashboard()` in `booking.actions.ts` (one round of parallel Prisma queries — no client-side fetching):

**"Next steps" queue, in priority order:**

1. **Needs review** — `PENDING` bookings, oldest first, with one-click Confirm (→ WAITING_PAYMENT, generates the Flash link) / Decline. Count badge.
2. **Payment expiring** — `WAITING_PAYMENT` bookings sorted by time left in the 24h window (derived from `waitingPaymentAt`); rows under ~6h flagged for a chase call/WhatsApp. Includes the payment link for resending.
3. **Today's arrivals** — `CONFIRMED` bookings for today (UTC day) not yet `ARRIVED`: name, party size, service, **balance due** (`totalPriceCents − amountPaidCents`), and Mark-arrived + Record-deposit buttons (both actions already exist).
4. **Capacity meter** — today + next 7 days vs the 80-person auto-close threshold (data from `getBookingCountsByDate` + `getClosedDates`), so reception sees which dates are close to full before taking phone bookings.
~~5. Overdue rentals~~ — dropped per D1 (reception doesn't manage rentals).

Each widget is a small card component under `components/reception/`; the page composes them. Empty queues collapse to a "all clear ✓" row so the page reads as a to-do list, not a report.

**Estimated effort:** medium — one action, one page, 4–5 small components. All data already exists; no schema changes.

---

## Phase 4 — Getting reception *to* the page

1. **Role-based landing redirect.** New tiny route `app/(root)/dashboard/page.tsx` (server component): reads the session and redirects — RECEPTION → `/reception`, ACCOUNTANT → `/accounting/open-orders`, INSTRUCTOR → `/my-schedule`, ADMIN/OWNER/STAFF → `/bookings/dashboard`, everyone else → `/`. `SignInForm.tsx` changes one line: when no explicit `callbackUrl` was requested, push `/dashboard` instead of `/`.
2. **Header nav.** `menu.tsx` currently branches on `isAdmin`/`isInstructor`; refactor to capability checks so reception sees Bookings/Register/Reception links and nothing else. `adminLinks.tsx` gets the same treatment.
3. **Role dropdown** in `UserEditForm.tsx` — no change needed (it enumerates the Prisma enum), but verify RECEPTION appears after the migration.

**Estimated effort:** small.

---

## Rollout & testing

1. Land Phase 1+2 together (capability layer + guard sweep), typecheck + build + the unguarded-action checker.
2. Apply the enum migration (`npx prisma migrate deploy`), assign RECEPTION to one test account.
3. Manual matrix — for RECEPTION verify: ✅ /bookings, /register, /reception all work end-to-end (confirm booking, record deposit, mark arrived, quick-add beach use); ❌ /accounting, /products, /users, /inventory, /instructors all bounce at the proxy AND their server actions reject direct invocation (the proxy alone is not the security boundary — that was C1).
4. Verify existing roles lost nothing: STAFF keeps full access, ACCOUNTANT keeps accounting + instructors, INSTRUCTOR keeps my-schedule + lesson views.
5. Phases 3+4 can follow independently — the role is useful (scoped access) even before the landing page ships.

## Decisions (finalized 2026-07-06)

- **D1 — Rentals: NO.** Rentals stay with STAFF/ADMIN/OWNER; reception is excluded from `rentals:manage` and the overdue-rentals widget is dropped from the dashboard.
- **D2 — Walk-in payments: YES, via `desk:collect`.** A narrow capability (ADMIN, OWNER, STAFF, ACCOUNTANT, RECEPTION) covering `submitPaymentFromForm`/`settleUserBalance`/`listUnsettledOrders` and the `/accounting/new-payment` + `/accounting/open-orders` routes only. Payment editing, reports, and expenses stay `accounting:manage`.
- **D3 — Lessons: read + book guests.** Reception gets `lessons:view` (schedule board, session details) plus a `lessons:book` capability for `addGuestToSession`. Creating/editing/deleting sessions stays `lessons:manage` (STAFF+).
- **Scope: all 4 phases** implemented together.

## Risks / notes

- The capability sweep touches the same ~60 guard sites as the hardening pass; the per-function checker script from that pass should be re-run to prove nothing regressed to unguarded.
- `booking.actions.ts` still has a local `STAFF_ROLES` const used by the four originally-guarded functions — fold those into the capability map during Phase 2 so there's exactly one source of truth.
- Adding an enum value is forward-only in Postgres (dropping it later is painful) — name it carefully now (`RECEPTION` vs `FRONT_DESK`).
- The dashboard's "today" must use the same UTC day convention as the rest of booking math (`utcDayStart`).
