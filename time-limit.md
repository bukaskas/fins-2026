# Feature: 24-Hour Payment Window for "Waiting Payment" Bookings

## Goal
When a booking is set to the **Waiting Payment** (`WAITING_PAYMENT`) status, start a
24-hour countdown. If payment is not completed within 24 hours, the booking is
automatically set to **Canceled** (`CANCELED`). While the booking is waiting, show
how much time remains before it is canceled.

## Requirements

### 1. Start the timer
- When a booking's status changes to `WAITING_PAYMENT`, record a timestamp
  (e.g. `waitingPaymentAt`) marking when the countdown started.
- The deadline is `waitingPaymentAt + 24 hours` (derived, not stored separately).
- The timer starts on the transition *into* `WAITING_PAYMENT`. If the booking is set
  to `WAITING_PAYMENT` again later, reset `waitingPaymentAt` to the new transition time.
- If the status changes away from `WAITING_PAYMENT` (e.g. payment completed → `CONFIRMED`,
  or moved to another status), the timer no longer applies.

### 2. Auto-cancel after expiry
- A booking still in `WAITING_PAYMENT` whose deadline has passed must be set to `CANCELED`.
- Handle this defensively in two places:
  - **On read**: when loading a booking (or a list of bookings), treat an expired
    `WAITING_PAYMENT` booking as canceled and persist the change.
  - **Scheduled sweep** (cron/job): periodically cancel expired bookings so they get
    canceled even if nobody opens the page.
- Cancellation must be idempotent (never run twice) and follow the existing cancel
  side effects (release held inventory/slots, ledger entries, notifications, etc.),
  consistent with how bookings are normally canceled.

### 3. Show remaining time
- For any booking in `WAITING_PAYMENT`, display a message with the time remaining
  until cancellation, e.g. **"Cancels in 23h 41m"** or
  **"Pay within 24 hours — cancels in 23:41:05"**.
- The countdown should update live (client-side) and read from the deadline so it stays
  correct after a refresh.
- If the deadline has already passed, show that the booking is being canceled (and the
  on-read logic should flip it to `CANCELED`).

## Implementation Notes
- Add the start timestamp as a nullable `DateTime` column (e.g. `waitingPaymentAt`) on
  the `Booking` model via a Prisma migration; the 24-hour window is derived in code.
- Status transitions and cancellation go through the existing
  `lib/actions/*.actions.ts` server actions (notably `updateBookingStatus`) — no REST layer.
- Surface the countdown in `NextStepCard` (the `WAITING_PAYMENT` variant) as a small
  client component that takes the deadline as a prop and renders a live "cancels in …"
  message.
- Keep money in integer cents and `WalletLedger` append-only, per project rules.

## Acceptance Criteria
- [ ] Setting a booking to `WAITING_PAYMENT` records the start time (`waitingPaymentAt`).
- [ ] The booking auto-cancels at start time + 24 hours.
- [ ] Staff and guests see a live "cancels in …" message while the booking is waiting.
- [ ] Leaving `WAITING_PAYMENT` (e.g. payment completed) stops the countdown.
- [ ] Expired bookings are canceled on read and/or by a scheduled sweep, with normal
      cancel side effects, and cancellation never runs twice.
