---
target: bookings/date/[date] page
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/audrius/Documents/fins-2026/app/(root)/bookings/date/[date]/page.tsx"
target_fingerprint: "sha256:d595a03d41ed80ab9b89b36560a2303de3976dafb1326e70999fc16cadaad9b9"
target_path: /Users/audrius/Documents/fins-2026/app/(root)/bookings/date/[date]/page.tsx
timestamp: 2026-10-05T07-43-01Z
slug: app-root-bookings-date-date-page-tsx
---
# Critique: /bookings/date/[date] — 18/40 (Poor)
Method: dual-agent (A: design review · B: detector/browser)

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | No N/80 capacity or closed-date state; search/agent filter discard isPending |
| 2 | Match System / Real World | 2 | "Fully booked" reads as status, actually emails + cancels; "76p" shorthand |
| 3 | User Control and Freedom | 2 | Bulk cancel irreversible; no prev/next day |
| 4 | Consistency and Standards | 1 | Chips vs tabs use different status groupings; dialog says Declined, action sets CANCELED; mixed button shapes |
| 5 | Error Prevention | 2 | Confirm dialog misdescribes outcome; count ≠ Pending tab |
| 6 | Recognition Rather Than Recall | 2 | Status pill opens dialog but looks like a badge |
| 7 | Flexibility and Efficiency | 2 | URL filters good; no date nav; New Booking hardwired to Day Use |
| 8 | Aesthetic and Minimalist Design | 2 | ~520px before first row; dead bookings in default view |
| 9 | Error Recovery | 1 | Raw error div; toast reports wrong count |
| 10 | Help and Documentation | 2 | Dialog explains; page has no guidance |

Detector: CLI clean (exit 0). Browser overlay 18: 14 undersized-ui-text (page.tsx:167,175,236,361,366; CopySummaryButton.tsx:22; BookingComponent.tsx:259,341), low-contrast #8a8480 3.7:1 (page.tsx:175 + :167,:298,:342), hero-eyebrow-chip (page.tsx:175), 2 false positives (BookingComponent.tsx:309 truncate; body height transition).

## Priority Issues
- [P0] Fully booked bulk action contradicts itself: dialog "Declined" vs action CANCELED (booking.actions.ts:1002); toast `declined ${res.sent}` (SendFullyBookedButton.tsx:33); no-email guests stay PENDING; button counts PENDING only (page.tsx:107) vs Pending tab incl. REQUEST_SENT/UNDER_REVIEW; first in header with neutral weight. → clarify + action fix
- [P1] No capacity indicator; Confirmed chip adults-only (page.tsx:125) vs capacity adults+kids; ARRIVED double-counted in "Other" (page.tsx:128). → shape, layout
- [P1] Header breaks mobile/a11y floor: non-wrapping shrink-0 action row (page.tsx:194) overflows at 390px; #8a8480/#b0a89f text; 0.58–0.65rem sizes; text-sm inputs w/ focus:outline-none; ~28px tabs; no aria-current/FOCUS_RING; glyph ← and +. → adapt, harden
- [P2] Default "All" view mixes dead rows; cancelled rows show "EGP due" + Open WhatsApp; unstable service order. → distill
- [P2] Raw error div (page.tsx:83), no loading/pending state, undebounced search, no prev/next day. → harden

## Persona Red Flags
- Receptionist mid-WhatsApp: can't answer "is Saturday full?"; can't jump to tomorrow; no reload feedback; "Confirm the booking" on CONFIRMED row causes hesitation.
- Casey: horizontal scroll; ~500px chrome before rows; thin headline in sun.
- Sam: ~9 sub-4.5:1 text spots; no focus on inputs/select; active tab colour-only; no aria-live on Copied.
- Alex: no date nav/shortcuts; undebounced search; Copy summary no fallback, reports Copied on failure.

## Minor Observations
- Service eyebrow uses saturated accent as text; SERVICE_LABELS/ACCENT duplicate SERVICE_META.
- "Total deposit paid" sums amountPaidCents.
- getBookingsByDate fetched twice per filtered view.
- new Date("YYYY-MM-DD") UTC parse.
- Redundant per-row date; empty state has no next step; 🪁 in messages.ts:129,142.

## Questions to Consider
- Why is the headline "October" and not "41 / 80"?
- Work queue vs inventory?
- Should bulk email-and-cancel appear only at capacity?
