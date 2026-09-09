# Plan: guest self-service on a booking

**Date:** 2026-09-02
**Status:** Not started. Stage 0 is a standalone bug fix and should ship first regardless.
**Scope:** `app/(root)/bookings/manage/[token]/` (new), `lib/actions/booking.actions.ts`,
`lib/routes.ts`, `proxy.ts`, `prisma/schema.prisma`.
**Design reference:** `.claude/design-system/pages/bookings.md` (warm-paper override for
everything under `/bookings`). The manage page is a *guest* surface — it inherits the gradient
ambience of `/bookings/[id]`, not the flat tool chrome of `/bookings/[id]/desk`.

**Goal:** let a guest change their party size, fix their contact details, or cancel — from the
link reception already sends them — without an account and without a WhatsApp round-trip.

Prior art: `app/(root)/day-use/booking/booking-editing-feature.md` describes the equivalent
feature built for competition entries in another project. This plan deliberately diverges from
it in four places; each divergence is argued below rather than assumed.

---

## Where the codebase stands today

Most of the machinery already exists, because `/bookings/[id]` is *already* a public guest page.

| Capability | Where it lives |
|---|---|
| Public unauthenticated booking page | `PUBLIC_BOOKING_DETAIL` in `lib/routes.ts:44`, short-circuited in `proxy.ts:12` |
| Expire a lapsed payment window on read | `getBookingById` in `lib/actions/booking.actions.ts:1052` |
| Table-wide expiry sweep | `/api/cron/cancel-expired-bookings`, hourly (`vercel.json`) |
| Staff twin of the same booking | `/bookings/[id]/desk` |
| Status-derived guest instructions | `NextStepCard.tsx` |
| 24h payment window + countdown | `waitingPaymentAt` + `PaymentCountdown.tsx` |
| Flash link creation, reuse, re-issue | `createBookingPaymentLink` (`:1184`), `paymentLinkAttempt` |
| Server-side pricing as pure functions | `computeBookingTotalCents` (`lib/pricing.ts:110`), `calculateDayUsePrice` (`:52`) |
| Token generate + SHA-256 hash | `lib/tokens.ts` (already used by password reset) |
| Staff-logged contact history | `BookingContact` |

Three things are genuinely missing:

1. **No write credential.** The booking UUID is the only thing standing between a visitor and
   the booking. That is adequate for reading status; it is not adequate for mutations.
2. **No audit trail for guest-initiated change.** `BookingContact` records *staff reaching out*
   — a fixed `channel` / `outcome` enum. It is the wrong shape for "the guest changed something."
3. **No concurrency guard.** `applyBookingStatusChange` (`:1119`) and `updateBookingParty`
   (`:1480`) are bare `prisma.booking.update` calls. A double-submitted form or a stale tab
   applies twice.

---

## Four divergences from the competition-entry design

### D1 — Tiered credential, not one capability token

The competition build made a hashed token the *whole* credential: no token, no page. Fins cannot
copy that, because `/bookings/<uuid>` links are already in guests' WhatsApp history and the UUID
is the primary key — it appears in staff URLs, in `flashAggregatorId(booking.id, attempt)` sent
to Flash, and in every `revalidatePath` call. It can never be rotated and never be revoked.

So split the credential in two:

- **UUID → read + pay.** `/bookings/<uuid>` is unchanged. Old links keep working, and
  `PayDepositOnline` keeps creating payment links from the bare id (already documented as
  intentional at `booking.actions.ts:1181`).
- **Hashed token → edit + cancel.** A new route, a new nullable column, issued lazily the first
  time someone sends a manage link.

One consequence worth stating plainly: a guest who only has the old link can still *pay*, but
cannot *change*. That is the correct split — the old link was only ever advertised as a status page.

### D2 — Party size is editable here; the competition build forbade it

The competition entry banned party edits because headcount fed both pricing and per-discipline
capacity, so changing it after a payment window opened meant re-pricing an attempt.

Fins should allow it anyway, because for a beach club "we're four now, not two" *is* the request,
and routing it through WhatsApp is the cost being paid today. The building blocks are already
right: pricing is a pure server function, and `updateBookingParty` already recomputes
`totalPriceCents` rather than trusting a client value.

The price of allowing it is Stage 0. See "The hazard" below.

### D3 — Conditional `updateMany`, not `Serializable` + `FOR UPDATE`

The competition build took capacity row locks at serializable isolation with caller-supplied
optimistic guards (`expectedStatus`, `replaceAttemptId`).

This file already has the cheaper idiom, twice: `cancelExpiredWaitingPayments` and the
single-row expiry inside `getBookingById` both put the expected state in the `WHERE` clause and
let Postgres arbitrate. Follow it. Every guest mutation becomes:

```ts
const { count } = await prisma.booking.updateMany({
  where: { id, /* the state the page was rendered with */ },
  data: { /* … */ },
});
if (count === 0) return { success: false, message: "This booking changed. Refresh and try again." };
```

Same stale-tab protection, no isolation change, no long-running transactions against Neon.

### D4 — Reuse `UNDER_REVIEW`; skip the rate-limiter library

The competition build added a `REVIEW_REQUIRED` state and a general `rateLimit()` helper used on
every action. Fins already has `UNDER_REVIEW`, and `/desk` already renders it — that is the
review state.

On rate limiting: there is no limiter in this codebase at all, and only one endpoint here really
needs one (staff link resend). A `manageTokenIssuedAt` column with a 60-second check covers it,
which is what the competition build's own recovery path does underneath the limiter.
`createBookingPaymentLink` already self-limits by handing back a live link instead of minting a
second Flash order. Build the general limiter when a second caller needs it, not before.

---

## The hazard: a payment link cannot be recalled

`applyFlashPayment` (`:1370`) confirms the booking on any successful payment, without comparing
the amount against what is owed:

```ts
await applyBookingStatusChange(bookingId, BookingStatus.CONFIRMED);
```

Today that is latent — the link is minted for the correct amount and nothing changes it between
mint and settlement. The moment party size becomes editable it is live:

> Guest opens a checkout link for 2 people → changes the booking to 6 → pays the old, smaller
> deposit → booking goes `CONFIRMED` at the wrong amount.

And it cannot be closed from our side: `lib/flash.ts` exposes `createPaymentOrder` and
`getFlashOrder`, but **no cancel-order call**. Expiring `paymentLinkExpiresAt` only stops *our*
page from reusing the link; Flash still honours the URL a guest already has open.

Therefore the guard has to live at settlement, not at issue. That is Stage 0, and it must ship
before any editing.

---

## Stage 0 — Amount guard on settlement

Ships alone. No new feature, no schema change, no UI.

In `applyFlashPayment`, read the booking inside the same transaction and compare the settled
amount against the deposit still owed:

```ts
const expected = Math.round(booking.totalPriceCents / 2) - booking.amountPaidCents;
const short = amountCents + TOLERANCE_CENTS < expected;

await applyBookingStatusChange(
  bookingId,
  short ? BookingStatus.UNDER_REVIEW : BookingStatus.CONFIRMED,
);
```

Record the `BookingPayment` row either way — the money arrived, and the ledger must say so. Only
the *status* branches.

**Open decision (D0):** `TOLERANCE_CENTS`. Everything here is whole EGP and
`createBookingPaymentLink` sends an exact integer, so 0 is defensible; a small tolerance guards
against a Flash-side rounding surprise at the cost of accepting a genuinely short payment. Start
at 0 and watch `UNDER_REVIEW` volume.

**Verify:** replay a webhook payload with an amount below the expected deposit and confirm the
booking lands `UNDER_REVIEW` with the payment recorded, then one at the exact amount and confirm
`CONFIRMED`. Both must stay idempotent on redelivery (the `flashTransactionId` unique index).

---

## Stage 1 — The credential and the audit trail

### 1.1 Schema

```prisma
model Booking {
  // … existing fields
  manageTokenHash     String?   @unique
  manageTokenIssuedAt DateTime?
}

model BookingEvent {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  bookingId String   @db.Uuid
  booking   Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  /// GUEST_PARTY_CHANGED | GUEST_CONTACT_CHANGED | GUEST_CANCELED
  /// | MANAGE_LINK_ISSUED | PAYMENT_LINK_VOIDED
  type      String
  /// "guest" | "staff:<userId>" | "system"
  actor     String
  metadata  Json?
  createdAt DateTime @default(now()) @db.Timestamp(6)

  @@index([bookingId, createdAt])
}
```

A new table rather than extending `BookingContact`: that model answers "did we reach them, on
what channel, when do we chase again." This one answers "what changed, who changed it, from what
to what." Collapsing them would force a meaningless `channel` on every guest edit.

Append-only, same posture as `WalletLedger`. Metadata carries ids, amounts and timestamps —
**never the raw manage token**.

### 1.2 Route and access

`/bookings/manage/[token]` — no booking id in the path, so the lookup is a single
`findUnique({ where: { manageTokenHash } })` and there is nothing to cross-check.

`generateToken()` returns 64 hex characters, so the shape check is exact and cheap. In
`lib/routes.ts`:

```ts
export const PUBLIC_BOOKING_MANAGE = /^\/bookings\/manage\/[a-f0-9]{64}\/?$/i;
```

Short-circuit it in `ruleForPath` alongside `PUBLIC_BOOKING_DETAIL`, and in `proxy.ts` before
`getToken`. No `matcher` change is needed — `/bookings/:path*` already covers it. `isStaffPath`
then returns false for the route automatically, so the page keeps the full site chrome, exactly
like the guest booking page.

`force-dynamic`, `robots: { index: false, follow: false }`.

An unknown token and a token on a deleted booking must be indistinguishable: `notFound()` for both.

### 1.3 Ship read-only

Stage 1 ends with the manage page rendering *the same content* as `/bookings/<uuid>` and nothing
editable. That proves issue → email → resolve → render end to end before any mutation exists.

---

## Stage 2 — Contact edits and cancellation

The two safe actions. Both take the raw token, both resolve it themselves, both write a
`BookingEvent`, both return `{ success: boolean; message?: string }` to match the file's
existing convention.

### 2.1 Contact

Name, email, phone, Instagram. Validate through `lib/validators.ts` — reuse the field schemas
`bookingFormSchema` already applies so the manage page cannot accept what the public form rejects.

The competition build needed an advisory lock and an anti-merge check here, because contact
lived on a shared `User` row. Fins does not: `Booking` carries its own `name` / `email` / `phone`
/ `instagram`, so there is no other person's record to collide with. Skip that machinery.

**Keep one rule from it:** on an email change, send to **both** the old and the new address. A
stolen link must not be able to silently redirect a booking to someone else's inbox. Delivery
failure is logged, never rolled back.

### 2.2 Cancel

`TERMINAL_STATUSES` does not exist yet — define it next to `CAPACITY_STATUSES`
(`booking.actions.ts:74`) as `[CANCELED, DECLINED, NO_RESPONSE_EXPIRED, ARRIVED]`.

```ts
const { count } = await prisma.booking.updateMany({
  where: { id, bookingStatus: { notIn: TERMINAL_STATUSES } },
  data: { bookingStatus: BookingStatus.CANCELED },
});
```

Idempotent by construction — cancelling twice is a no-op that still returns success.

It releases the date's capacity, and it does **not** touch `amountPaidCents` or any
`BookingPayment` row. A guest who paid a deposit can cancel; no refund is issued automatically.
Refunds stay a desk action.

---

## Stage 3 — Party size

The payoff, and the only stage with real ordering constraints.

Allowed while `PENDING` / `REQUEST_SENT` / `UNDER_REVIEW` / `WAITING_PAYMENT`, and only before
the booking date. Refuse once `CONFIRMED` or `ARRIVED` — money has settled and that is a desk
conversation.

1. **Recompute.** `computeBookingTotalCents(service, date, adults, kids)`. Never trust a client
   total; the form shows a preview, the server decides.
2. **Gate increases only.** If headcount goes up: refuse if a `ClosedDate` exists for the day,
   and sum `CAPACITY_STATUSES` (`booking.actions.ts:74`) for that date *excluding this booking*
   against `DAILY_CAPACITY` (80). Decreases skip both checks — shrinking a party can never breach capacity.
3. **Apply conditionally**, keyed on the party size *and* status the page was rendered with:

   ```ts
   const { count } = await prisma.booking.updateMany({
     where: { id, numberOfPeople: seenAdults, numberOfKids: seenKids, bookingStatus: seenStatus },
     data: { numberOfPeople: adults, numberOfKids: kids, ...(newTotal !== null && { totalPriceCents: newTotal }) },
   });
   ```

4. **Void the stale link.** If the total changed and `paymentLink` is set: stamp
   `paymentLinkExpiresAt` to now, write `PAYMENT_LINK_VOIDED`, and let the next
   `createBookingPaymentLink` mint a fresh order under `attempt + 1`. The old URL stays live on
   Flash's side — Stage 0 is what makes that safe.
5. **Record.** `GUEST_PARTY_CHANGED` with `{ from, to, oldTotalCents, newTotalCents }`.

**Date changes are out of scope for v1.** Same closed-date and capacity surface as party size,
but with a second date to reconcile and an interaction with the 24h payment window. The
competition build excluded them too.

### Open decisions

- **D3a — Reducing party size after a deposit.** Shrinking from 6 to 2 can leave
  `amountPaidCents` above the new deposit, and there is no credit concept on `Booking`. Options:
  refuse reductions once `amountPaidCents > 0`, or allow and let the surplus sit as an overpay
  the desk resolves. Refusing is the smaller v1.
- **D3b — Increases past capacity.** Hard refuse ("that date is full, message us"), or accept and
  drop to `UNDER_REVIEW` for the desk to judge. Refusing is honest; reviewing captures demand.

---

## Stage 4 — Issuing and reading the links

- `issueBookingManageLink(bookingId)` — generate, store the hash, stamp `manageTokenIssuedAt`,
  write `MANAGE_LINK_ISSUED`. Rotation invalidates the previous link; one hash column means one
  live token per booking. Support should expect "the link stopped working" after a resend.
- `resendBookingManageLink(bookingId)` behind `requireCapability("bookings:manage")`, refusing
  inside 60 seconds of `manageTokenIssuedAt`.
- Add the manage link to `sendBookingEmail` so a guest gets it without asking.
- Render the `BookingEvent` timeline on `/bookings/[id]/desk`, beside `ContactLog` — the desk
  should be able to read back the whole story of what a guest changed.

---

## Verifying it

No test runner is configured, so this is a manual pass. Run it end to end before the first link
goes out:

1. Book as a new guest → land on `/bookings/<uuid>` → confirm the old link still renders and
   still offers "Pay deposit online."
2. Issue a manage link from the desk → open it → change the phone number → confirm `/desk` shows
   the change and a `GUEST_CONTACT_CHANGED` event.
3. Change the email → confirm **both** inboxes receive notice.
4. With a live payment link open in a second tab, change party size in the first → confirm the
   link is voided, a new one mints under `attempt + 1`, and paying the *old* tab lands
   `UNDER_REVIEW` rather than `CONFIRMED` (this is the Stage 0 guard doing its job).
5. Submit the same party change twice from a stale tab → the second returns "This booking
   changed."
6. Cancel → confirm the date's capacity frees up, `amountPaidCents` is untouched, and a second
   cancel still succeeds.
7. Resend the link → confirm the previous URL now 404s, and that a resend inside 60 seconds is
   refused.
8. Grep the logs: the raw manage token must appear nowhere.

---

## Known limits (accepted)

- **A voided payment link is only voided here.** Flash has no cancel-order call, so the guard is
  the settlement-time amount check, not link revocation.
- **One live manage link per booking.** Rotating on resend breaks the link already in the guest's
  inbox. Intended — a leaked old link dies — but it generates support contacts.
- **Old UUID links cannot edit.** By design (D1); a guest who wants to change something needs the
  manage link, which the desk can send in one click.
- **No refunds.** Cancelling never moves money. Deliberate v1 boundary.
- **Email is best-effort.** A send failure is logged and never rolls back a change.
