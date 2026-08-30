---
type: "query"
date: "2026-08-30T07:56:54.054454+00:00"
question: "How should the booking row combine status, balance due, and the next WhatsApp action using current data and actions?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["BookingComponent.tsx", "booking.actions.ts", "buildBookingMessages()", "MessageDeck.tsx"]
---

# Q: How should the booking row combine status, balance due, and the next WhatsApp action using current data and actions?

## Answer

Expanded from graph vocabulary: [booking, row, status, balance, paid, total, payment, deposit, message, action, confirmed, waiting]. The row can calculate balance from BookingRow.totalPriceCents minus amountPaidCents. BookingComponent.tsx owns the shared row across five list pages. lib/bookings/messages.ts already builds status-aware messages and WhatsApp URLs, while MessageDeck.tsx demonstrates contact logging and direct WhatsApp composition. The shaped direction should reuse those sources, make status, due balance, and one recommended WhatsApp action the decision rail, preserve secondary record actions under More, and provide neutral WhatsApp fallback where no valid suggested template exists.

## Outcome

- Signal: useful

## Source Nodes

- BookingComponent.tsx
- booking.actions.ts
- buildBookingMessages()
- MessageDeck.tsx