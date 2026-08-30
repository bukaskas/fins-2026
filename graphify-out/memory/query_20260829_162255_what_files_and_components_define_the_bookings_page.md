---
type: "query"
date: "2026-08-29T16:22:55.383311+00:00"
question: "What files and components define the bookings page and its UI flows?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["bookings/page.tsx", "BookingsHeaderActions()", "BookingsFilters()", "BookingComponent.tsx", "booking.actions.ts"]
---

# Q: What files and components define the bookings page and its UI flows?

## Answer

Expanded from original query via graph vocab: [booking, bookings, page, calendar, filter, search, status, header, action, table]. The graph identifies app/(root)/bookings/page.tsx as the orchestration surface; components/bookings/BookingsHeaderActions.tsx and BookingsFilters.tsx own header actions and filtering; components/kitesurfing/BookingComponent.tsx owns booking rows; lib/actions/booking.actions.ts owns page data and status mutations. These nodes support the critique focus on page hierarchy, filtering, row actions, and status safety.

## Outcome

- Signal: useful

## Source Nodes

- bookings/page.tsx
- BookingsHeaderActions()
- BookingsFilters()
- BookingComponent.tsx
- booking.actions.ts