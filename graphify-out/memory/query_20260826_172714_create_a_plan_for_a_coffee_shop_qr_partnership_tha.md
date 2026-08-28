---
type: "query"
date: "2026-08-26T17:27:14.836520+00:00"
question: "Create a plan for a coffee shop QR partnership that gives day-use bookings a 25% discount and stores a coffee-shop reference"
contributor: "graphify"
outcome: "useful"
source_nodes: ["DayUseBookingForm()", "createBooking()", "calculateDayUsePrice()", "getDayUseMonthlyReport()"]
---

# Q: Create a plan for a coffee shop QR partnership that gives day-use bookings a 25% discount and stores a coffee-shop reference

## Answer

Expanded from the original request via graph vocabulary: [day, use, booking, bookings, reference, pricing]. The existing DayUseBookingForm calculates client prices with calculateDayUsePrice, while createBooking recomputes prices on the server through computeBookingTotalCents. Booking currently has no referral-source field, and the day-use report groups only by status/date/agent. The implementation plan therefore adds a reusable BookingPartnership campaign, immutable booking attribution and discount snapshots, non-stackable server-side pricing, partner UI states, email/detail visibility, and partner reporting. It also calls out updateBookingParty and the independently recalculated email breakdown so later edits and messages retain the same discounted total. The plan was written to app/(root)/day-use/QR-partnership.md.

## Outcome

- Signal: useful

## Source Nodes

- DayUseBookingForm()
- createBooking()
- calculateDayUsePrice()
- getDayUseMonthlyReport()