# Feature: 12-Hour Payment Window for "Waiting Payment" Bookings

## Goal
When a booking is set to the **Waiting Payment** status, start a 12-hour countdown.
If payment is not completed within 12 hours, the booking is automatically set to
**Canceled**. While the booking is waiting, show how much time remains before it is canceled.

## Requirements

### 1. Start the timer
- When staff changes a booking's status to `WAITING_PAYMENT`, record a timestamp
  (e.g. `waitingPaymentAt`) marking when the countdown started.
- The deadline is `waitingPaymentAt + 12 hours`.
- If the status is later changed away from `WAITING_PAYMENT` (e.g. paid, or back to
  another status), clear/ignore the timer so it no longer counts down.

### 2. Auto-cancel after expiry
- A booking still in `WAITING_PAYMENT` whose deadline has passed must be set to
  `CANCELED`.
- Do this defensively in two places:
  - **On read**: when loading a booking (or list of bookings), treat an expired
    `WAITING_PAYMENT` booking as canceled and persist the change.
  - **Optionally** via a scheduled job/cron that sweeps expired bookings, so they
    get canceled even if nobody opens the page.
- Cancellation must not run twice and must follow existing cancel side effects
  (release held inventory/slots, ledger entries, notifications, etc.) consistent
  with how bookings are normally canceled.

### 3. Show remaining time
- For any booking in `WAITING_PAYMENT`, display a message with the time remaining
  until cancellation, e.g. **"Cancels in 11h 23m"** or
  **"Payment due within 12 hours — cancels in 11:23:45"**.
- The remaining time should update live (client-side countdown) and read directly
  from the deadline so it stays correct after a refresh.
- If the deadline has already passed, show that the booking is being canceled.

## Implementation Notes
- Store the timestamp as a `DateTime` column on the booking model; the 12-hour
  window is derived, not hardcoded into a second column.
- Keep all money in integer cents and the `WalletLedger` append-only, per project rules.
- Status transitions and cancellation logic go through the existing
  `lib/actions/*.actions.ts` server actions — do not add a REST layer.
- Add the countdown as a small client component that takes the deadline as a prop.

## Acceptance Criteria
- [ ] Setting a booking to `WAITING_PAYMENT` records the start time.
- [ ] The booking auto-cancels at exactly start time + 12 hours.
- [ ] Staff/users see a live "cancels in …" message while waiting.
- [ ] Leaving `WAITING_PAYMENT` (e.g. payment completed) stops the timer.
- [ ] Expired bookings are canceled on read and/or by a scheduled sweep.
