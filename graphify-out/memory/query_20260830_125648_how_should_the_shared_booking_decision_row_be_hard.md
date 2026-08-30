---
type: "query"
date: "2026-08-30T12:56:48.775630+00:00"
question: "How should the shared booking decision row be hardened around status, balance, messages, payments, contacts, and errors?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["BookingComponent.tsx", "booking.actions.ts", "buildBookingMessages()", "PayDepositDialog.tsx", "BookingStatusDialog.tsx"]
---

# Q: How should the shared booking decision row be hardened around status, balance, messages, payments, contacts, and errors?

## Answer

Expanded from original query via graph vocabulary: [booking, component, message, status, payment, contact, log, error, update, balance, action, dialog]. BookingComponent.tsx is the shared row used by the booking lists; it should calculate due from totalPriceCents minus amountPaidCents, reuse buildBookingMessages() for the next valid WhatsApp action, and fall back to neutral WhatsApp for arrived, closed, or contradictory waiting-payment states. BookingStatusDialog centralizes guarded status transitions with explicit confirmation for timers, promises, and closure. PayDepositDialog preserves input and reports actionable errors, while booking.actions.ts remains the server boundary for contact logs, payment recording, status changes, and agent assignment.

## Outcome

- Signal: useful

## Source Nodes

- BookingComponent.tsx
- booking.actions.ts
- buildBookingMessages()
- PayDepositDialog.tsx
- BookingStatusDialog.tsx