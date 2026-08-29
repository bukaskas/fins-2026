---
version: 1
slug: "app-root-bookings-id-desk-page-tsx"
primary_target: "app/(root)/bookings/[id]/desk/page.tsx"
related_targets: ["app/(root)/bookings/[id]/page.tsx"]
---

## Scope and mode

`app/(root)/bookings/[id]/desk` — the staff view of one booking. Mode: **Operate**.

Its sibling `app/(root)/bookings/[id]` is a separate surface with a separate
brief-worthy job: it is the guest's private link, public by design via
`proxy.ts`, and reception sends it over WhatsApp. The two must never share a
layout or a voice again. They share only product truth and the bookings visual
system.

## Audience, job, task

Front-desk staff (`bookings:manage` — `RECEPTION`, `STAFF`, `ADMIN`, `OWNER`),
mid-conversation, with a guest at the counter or on the phone. Phone and desk
computer are both first-class.

The desk's most frequent job on a single booking is **composing the next
message to that guest**, so the surface leads with ready-to-send messages
rather than a record to read. Confirmed with the user 2026-08-29.

Must be answerable without scrolling: guest name, service · date · party,
status, and balance due, plus a reachable action bar.

## Chosen direction

**Split command bar.** A summary band carries identity, status and balance;
a fixed one-row bar holds the thumb actions; the message deck, payment ledger,
party, assignment and contact history scroll between them.

The summary band is sticky only from `sm` up — the bookings brief forbids
pinning a stacked toolbar this tall on a phone.

Memorable moment: every message renders with this booking's real name and
amounts, so the desk sends rather than writes. Sending records a
`BookingContact`, which is what finally makes the history section non-empty.

## Constraints carried in

- Ask for a capability, never a role. `STAFF_ROLES` arrays are banned here.
- Consequences are visible before the tap: status changes state what they
  trigger, closing statuses need a second tap, `res.warning` is surfaced.
- Money is reversible in the UI: the payment ledger is shown with a remove
  action, because `payBookingDeposit` has no undo of its own.
- Status colour comes only from `lib/bookings/status.ts`. Text uses the
  darkened `STATUS_TEXT` pairs; `#b0a89f` and `#8a8480` are never text.

## Unresolved

- `VISIT_WORKING_HOURS` in `lib/constants` is `9:30 am - 12 pm`, preserved
  verbatim from the old booking page. It contradicts `9:00 AM - 11:00 PM` in
  the confirmation email and on `/day-use`. Not changed without a decision.
- The marketing `Header`/`Footer` and the global WhatsApp FAB from
  `app/(root)/layout.tsx` still wrap this operations surface; the FAB overlaps
  the fixed command bar's right edge.
