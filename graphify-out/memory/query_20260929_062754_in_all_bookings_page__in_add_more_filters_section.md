---
type: "query"
date: "2026-09-29T06:27:54.944459+00:00"
question: "in all bookings page: In add more filters section I want to add checkboxes for booking status so the agent filter multiple status at one filter"
contributor: "graphify"
outcome: "useful"
source_nodes: ["BookingsFilters()", "bookings/page.tsx", "booking.actions.ts"]
---

# Q: in all bookings page: In add more filters section I want to add checkboxes for booking status so the agent filter multiple status at one filter

## Answer

Expanded from original query via graph vocab: [all, bookings, booking, filters, filter, status, statuses, agent, page, component, actions, search]. BookingsFilters owns the URL-backed controls; bookings/page passes the status query through BookingsQuery; booking.actions applies it in bookingsWhere. Implemented comma-separated multi-status values, accessible checkbox controls inside More filters, and a Prisma in-filter so all matching rows and Copy guests use the same selection.

## Outcome

- Signal: useful

## Source Nodes

- BookingsFilters()
- bookings/page.tsx
- booking.actions.ts