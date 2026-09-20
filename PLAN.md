# Plan: Guest date-rate calendar for Day Use

**Date:** 2026-09-20  
**Status:** Draft for grilling — no implementation has started  
**Owner-visible outcome:** On `/day-use/booking`, every available calendar day shows its adult per-person price before the guest selects it. Selecting a day highlights it and opens a clear summary of that date, rate type, adult price, and child price before the guest continues through the existing booking flow.

## Handoff block

This project upgrades the first step of the existing Day Use guest booking flow from a date picker that reveals a rate only after selection into an inline, price-bearing calendar like the supplied reference. The chosen v1 approach is **configuration-backed exact date overrides with the existing pricing module remaining the single source of truth**. This is the smallest useful version because Fins already calculates standard, holiday, and discounted Day Use prices in `lib/pricing.ts`, persists the server-recomputed booking total, and colors those rate types in the Day Use design system. Do not add a pricing database, admin editor, occupancy pricing, or a second price calculation inside the calendar. Start with Stage 1 below. Update this status and the stage checkboxes after every implementation session; if a decision changes during grilling, record the replacement and its reason under “Decisions to grill” before touching code.

## Scope and working assumptions

This draft deliberately assumes:

- The feature applies only to the guest route `/day-use/booking`.
- The price shown in each calendar cell is the **adult, per-person rate in EGP**. The selected-date card also shows the child rate; children under five remain free.
- Fins needs exact date prices as well as the existing standard/holiday/discounted categories. Exact overrides are authored in `lib/config/pricing.json` and therefore require a deploy.
- If no exact override exists, the current standard/holiday/discounted calculation remains the fallback.
- Rate colors keep the existing Day Use meanings: standard/sky, holiday/amber, discounted/green. Color is supportive, never the only label.
- The current six-month availability window becomes the visible booking horizon so the UI does not present dates for which it has not loaded closed-date data.
- The server remains authoritative. A browser-submitted total is only a display hint; `createBooking`, `updateBooking`, and `updateBookingParty` continue to recalculate through the shared pricing module.
- A Day Use booking stores the quoted adult and child unit prices alongside `totalPriceCents`. A later party-size edit uses those snapshots, so a configuration change cannot silently reprice the existing party.

## Current codebase reality

- `app/(root)/day-use/booking/page.tsx` is a client-side, three-step booking form. Step 1 currently opens the shared calendar in a popover, then renders `RateDisplay` below it after a date is picked.
- `lib/config/pricing.json` contains the base adult price, child multiplier, holiday surcharge, discount multiplier, and date lists.
- `lib/pricing.ts` owns `getDateRate`, `calculateDayUsePrice`, `getDayUseRates`, and `computeBookingTotalCents`. The guest landing page, booking page, booking server actions, staff edit flows, and beach desk all depend on it.
- `createBooking` ignores the client’s quoted total for known services and calculates it again on the server. This invariant must survive the calendar redesign.
- `components/ui/calendar.tsx` already supports a custom `DayButton`; `components/bookings/BookingCalendar.tsx` proves the project can render a second line of data in a day cell.
- Closed dates are loaded through `getClosedDates()` and checked again on the server before a guest booking is created.
- `.claude/design-system/pages/day-use.md` governs this route. Its navy/sky guest design overrides the global neumorphic system and already defines accessible standard, holiday, and discounted rate colors.
- There is no test runner configured today.

## Chosen approach

### Configuration-backed exact date overrides, rendered by a dedicated Day Use calendar

Extend the existing pricing configuration with explicit date overrides, for example:

```json
{
  "dateOverrides": {
    "2026-10-11": {
      "adultPriceCents": 170000,
      "rateType": "holiday"
    },
    "2026-10-18": {
      "adultPriceCents": 125000,
      "rateType": "discounted"
    }
  }
}
```

The exact schema can change during implementation, but the behavior may not: an exact date override wins; otherwise the existing holiday/discounted rules apply; otherwise the base standard rate applies. Child price remains derived from the adult price using `kidsRateMultiplier`, rounded by the existing whole-EGP rule.

Create a route-specific `DayUseRateCalendar` that composes the shared shadcn/React DayPicker calendar with a custom day button. It must call the shared pricing resolver for each visible date rather than reimplementing price rules. Keep `components/ui/calendar.tsx` generic because staff calendars depend on it.

Why this option: it delivers the reference interaction, preserves the current trusted price path, supports arbitrary date prices, and avoids a database/admin project before Fins has proved that staff need self-service rate management.

## Alternatives considered and rejected for v1

1. **Presentation-only calendar using today’s existing three formulas.** Fastest, but it cannot represent arbitrary date prices like the reference and leaves future pricing requests blocked on code changes anyway.
2. **Database-backed rates plus a staff pricing console.** Best if rates change frequently without deployments, but it adds a Prisma model, migration, authorization, public month queries, admin UX, cache/revalidation rules, conflict handling, and operational training. That is a separate product slice and should be justified by real editing frequency.
3. **Automatic dynamic pricing from occupancy, weekday, or lead time.** Potentially powerful, but it changes the commercial policy rather than merely presenting rates. It also creates explainability and price-stability problems and is explicitly outside this build.

## Decisions to grill before implementation

These are the questions most likely to change the build. Replace each assumption with a dated decision and reason.

1. **Service scope — decided 2026-09-20:** Day Use only for v1. Do not generalize the component or pricing contract for rentals or courses before those services have a proven shared requirement.
2. **Authoring — decided 2026-09-20:** Keep rates in `lib/config/pricing.json` for v1. Rate changes require a code deployment; no reception/management pricing editor is included.
3. **Rate model — decided 2026-09-20:** A configured date carries its own exact adult price. Dates without an override use the current standard adult rate. Holiday/discounted remains metadata for labeling and color, not a surcharge or multiplier applied to the override.
4. **Calendar price — decided 2026-09-20:** Each day cell shows the adult per-person price. Party totals remain in Step 2; the selected-date card shows both adult and child prices.
5. **Initial selection — decided 2026-09-20:** Start with no date selected. Require a deliberate click before showing the selected-date card or enabling Continue; do not silently default to tomorrow.
6. **Terminology — decided 2026-09-20:** Use the guest-facing labels **Regular / Peak / Best value**. An unlisted date is Regular; an exact override explicitly carries Peak, Best value, or Regular metadata.
7. **Booking horizon — decided 2026-09-20:** Six months. Calendar navigation and server validation must enforce the same rolling boundary; dates beyond it are not bookable.
8. **Party-size edits — decided 2026-09-20:** Preserve the originally booked adult and child unit rates when staff changes party size. Add immutable-at-booking unit-price snapshots to the booking record; do not recalculate the existing booking from the latest config for a party-only edit.
9. **Date edits — decided 2026-09-20:** Reprice using the destination date’s current configured rate and atomically replace the adult and child unit-price snapshots. An original Best value rate cannot be carried onto a different Peak/Regular date.
10. **Calendar presentation — decided 2026-09-20:** The price calendar is permanently visible inline on Step 1. Remove the guest flow’s date-input popover; comparing dates is the primary task.
11. **Closed dates — decided 2026-09-20:** A known closed date displays **Full** instead of a price and is disabled. Do not advertise a price for an unavailable day.
12. **Availability-read failure — decided 2026-09-20:** Keep dates selectable, show a prominent warning with a Retry action, and rely on the existing server check to reject a genuinely closed date at submission. A transient read failure must not disable the entire booking flow.
13. **Cell price format — decided 2026-09-20:** Show a compact number such as `1,500` in each cell, with one nearby label stating **EGP per adult**. The selected-date card spells out `1,500 EGP / adult`.

## Non-negotiable invariants

- Money remains integer cents everywhere.
- The calendar never becomes a pricing authority; it displays the result of `lib/pricing.ts`.
- The server recalculates before writing a booking.
- Closed and past dates are disabled and cannot be submitted by bypassing the UI.
- Date keys use one explicit `YYYY-MM-DD`/UTC-midnight convention. A DayPicker local-midnight `Date` must not silently resolve to the previous UTC date.
- Existing staff calendars keep their present density and behavior.
- The guest flow keeps one primary action per step and the current three-step form semantics.
- The Day Use page override controls colors, type, focus rings, and minimum 44px targets.
- The UI does not promise availability merely because a price is visible; final availability is still validated on submit.

## Stage 1 — Make date pricing explicit and provable

**Visible endpoint:** With sample overrides in local development, the existing selected-date rate panel shows the exact configured price for an overridden date and the unchanged standard price for an ordinary date. Booking submission stores the same server-calculated total.

### 1.1 Add a minimal pricing test harness

- **Goal:** Make precedence, rounding, and timezone behavior executable before changing the UI.
- **Where:** `package.json`, `package-lock.json`, new `lib/pricing.test.ts`; add Vitest as a development dependency and an `npm test` script.
- **Verify:** Run `npm test -- --run`. Tests must cover standard fallback, holiday fallback, discounted fallback, exact override precedence, child multiplier/whole-EGP rounding, and dates at UTC/local-day boundaries.
- **Fence:** Do not add browser/component testing in this step and do not refactor unrelated pricing such as Pharaoh tickets or lessons.

### 1.2 Define and validate exact date overrides

- **Goal:** Allow one date to carry an explicit adult price and presentation rate type without creating a second price source.
- **Where:** `lib/config/pricing.json`, `lib/pricing.ts`; optionally a small `lib/pricing-config.ts` if runtime schema validation keeps `pricing.ts` clearer.
- **Verify:** Run `npm test -- --run` and `npx tsc --noEmit`. A malformed date, negative/non-integer cents value, or unknown rate type must fail loudly during development/build rather than silently falling back.
- **Fence:** Do not add Prisma models, server actions, environment variables, or per-child override fields. Child price stays derived.

### 1.3 Centralize calendar-day key conversion

- **Goal:** Ensure a day clicked in Cairo resolves to the same pricing key in the browser, server action, email, and desk flow.
- **Where:** `lib/pricing.ts` or a focused date utility used by it; update pricing callers only where required by the new API.
- **Verify:** Run `npm test -- --run`; include cases around Cairo midnight and a browser timezone west of UTC. Then run `rg -n "holidayDates|discountedDates|dateOverrides" app components lib` and confirm pricing rules are not duplicated outside the config/parser.
- **Fence:** Do not perform a repo-wide date rewrite. Preserve the existing UTC-midnight database convention.

### 1.4 Prove every recalculation path agrees

- **Goal:** Confirm guest create, staff booking edit, party edit, confirmation email fallback, landing-page advertised price, and beach-desk charge all consume the same resolved rate.
- **Where:** `lib/actions/booking.actions.ts`, `lib/actions/beach-visit.actions.ts`, `app/(root)/day-use/page.tsx`, `app/(root)/day-use/booking/page.tsx`, and `emails/` only if a caller cannot use the revised pricing API unchanged.
- **Verify:** Run `rg -n "calculateDayUsePrice|computeBookingTotalCents|getDayUseRates" app components lib emails` and account for every result; run `npm test -- --run`, `npx tsc --noEmit`, and `npm run lint`.
- **Fence:** Do not change payment, status, email-delivery, or booking-edit policy. This is a consistency pass, not a workflow redesign.

## Stage 2 — Ship the price-bearing calendar interaction

**Visible endpoint:** Step 1 of `/day-use/booking` shows a responsive inline month where each selectable day includes its adult EGP rate. Selecting a day produces a reference-style selected-date card and allows the guest to continue.

### 2.1 Build `DayUseRateCalendar`

- **Goal:** Render date number, compact adult price, rate cue, disabled state, today state, focus state, and selected state in a dedicated component.
- **Where:** New `components/day-use/DayUseRateCalendar.tsx`, composing `components/ui/calendar.tsx` with a custom `DayButton` as demonstrated by `components/bookings/BookingCalendar.tsx`.
- **Verify:** Start `npm run dev`, open `/day-use/booking`, and inspect a month containing at least one override, one holiday, one discounted date, one ordinary date, one past date, and one closed date. Each state must be visually distinct and the displayed values must match `lib/pricing.ts`.
- **Fence:** Do not modify the generic shared calendar’s default sizing or styles. Staff calendars must not grow or acquire prices.

### 2.2 Replace the popover with the inline selection surface

- **Goal:** Make comparing dates the main Step 1 task instead of hiding it behind an input popover.
- **Where:** `app/(root)/day-use/booking/page.tsx`; remove the Step 1 popover/trigger, keep the form field as the selected-date state, and wire month/date changes into `DayUseRateCalendar`.
- **Verify:** In the browser, select dates across different rate types, navigate months, go to Step 2, return with Edit, and confirm the same date remains selected and priced. Run `npx tsc --noEmit` and `npm run lint`.
- **Fence:** Do not change Steps 2–3 fields, validation, submission, routing, or booking status behavior.

### 2.3 Add the selected-date summary card

- **Goal:** After selection, show weekday/full date, a textual rate badge, adult price, child price, under-five note, and the existing Continue action in one clear card below the calendar.
- **Where:** `components/day-use/DayUseRateCalendar.tsx` or a sibling `SelectedDayRateCard.tsx`; retire or reshape the current `RateDisplay` so there is one summary, not two competing blocks.
- **Verify:** Compare the summary against the selected cell and the Step 2 party total for standard, holiday, discounted, and exact-override days. All amounts must reconcile for 1 adult/0 children, then for a mixed party.
- **Fence:** Do not call the Step 1 action “Reserve” if it only advances to party details; copy must describe what the action really does.

### 2.4 Handle availability and loading honestly

- **Goal:** Integrate past dates, the six-month horizon, closed dates, closed-date loading, and fetch failure without showing a selectable price for a known-unavailable day.
- **Where:** `DayUseRateCalendar`, the existing `loadClosedDates` logic in the booking page, and `lib/actions/closedDate.actions.ts` only if the six-month boundaries must be made explicit.
- **Verify:** Throttle/fail the closed-date request in browser devtools and confirm the warning and retry remain usable; select a date that becomes closed in another session and confirm server submission still rejects it politely. Verify the first and last allowed dates.
- **Fence:** Do not invent live capacity or “only N left” messaging. Closed/open is the only availability claim in v1.

## Stage 3 — Make it trustworthy on real devices

**Visible endpoint:** A guest can compare and select prices with touch, keyboard, or a screen reader at phone and desktop sizes without clipping, ambiguous color-only states, or date/price mismatches.

### 3.1 Finish responsive layout

- **Goal:** Fit seven usable columns at 375px while keeping date and compact numeric price legible; use the full currency phrase in the legend/summary rather than squeezing “EGP” into every cell.
- **Where:** `components/day-use/DayUseRateCalendar.tsx`, following `.claude/design-system/pages/day-use.md`.
- **Verify:** Inspect at 375, 768, 1024, and 1440px. There must be no horizontal scroll, every day target must be at least 44px, month controls must remain reachable, and 4-digit prices must not collide.
- **Fence:** Do not shrink meaningful text below the Day Use design-system floor. Abbreviate presentation, not the actual amount.

### 3.2 Complete keyboard and screen-reader behavior

- **Goal:** Make rate and availability understandable without relying on color or visual proximity.
- **Where:** `DayUseRateCalendar.tsx`; use DayPicker’s button semantics and add concise accessible names/descriptions such as “Friday 25 September, 1,500 EGP per adult, standard rate”.
- **Verify:** Keyboard-only: move through dates, change month, select, and continue with visible focus. Screen-reader pass: the selected date, price, rate type, closed state, and step change are announced once and in a useful order. Run an automated accessibility scan in browser devtools with no serious calendar violations.
- **Fence:** Do not replace native buttons with clickable `div` elements or create a second hidden interactive calendar.

### 3.3 Preserve visual hierarchy and rate meaning

- **Goal:** Match the spirit of the reference while staying inside Fins’ navy/sky visual language and existing rate palette.
- **Where:** `DayUseRateCalendar.tsx`, `SelectedDayRateCard.tsx` if extracted, and `.claude/design-system/pages/day-use.md` only if implementation uncovers a genuinely missing rule.
- **Verify:** Confirm selected, focused, today, disabled, standard, holiday, and discounted combinations all remain legible. Check text and non-text contrast, including the selected dark-navy cell and sky focus ring.
- **Fence:** Do not copy the reference’s black/red/yellow branding. Do not add a fourth rate color without a named business meaning.

## Stage 4 — Regression proof and release

**Visible endpoint:** The full guest booking can be completed at each rate type, and staff sees the exact same stored totals and price breakdowns expected from the calendar.

### 4.1 Run the end-to-end pricing matrix

- **Goal:** Prove the displayed quote and stored server total agree across important combinations.
- **Where:** No production code unless a failure is found; record results in this plan under a dated implementation note.
- **Verify:** For standard, holiday, discounted, and exact-override dates, complete bookings for: 1 adult/0 children, 2 adults/1 child, and a closed-date rejection. Check guest summary, Step 2 total, stored booking total, staff booking detail, and email preview. Use a non-production database/account.
- **Fence:** Do not “fix” discrepancies by trusting or persisting the client total. Correct the shared resolver/caller.

### 4.2 Run repository checks and regression routes

- **Goal:** Ensure the route-specific calendar did not alter shared staff calendars or unrelated booking services.
- **Where:** Whole repository for verification only.
- **Verify:** Run `npm test -- --run`, `npx tsc --noEmit`, `npm run lint`, and `npm run build` in an environment with the expected database configuration. Smoke-test `/day-use`, `/day-use/booking`, `/bookings/dashboard`, `/bookings/day-use/new`, and a lesson date picker.
- **Fence:** Do not fold unrelated lint/build failures into this feature. Record pre-existing failures separately with evidence.

### 4.3 Release with reversible pricing data

- **Goal:** Make rollout safe even if a configured override is wrong.
- **Where:** `lib/config/pricing.json`, deployment notes, and this plan’s status block.
- **Verify:** Review the complete upcoming override table in whole EGP and date order, deploy, then compare at least three production calendar dates with the approved rate sheet. Confirm removing/correcting one override and redeploying restores the expected quote without a data migration.
- **Fence:** Do not edit old booking totals during rollout. Configuration controls future calculations; stored bookings are records, not a cache to rewrite.

## Acceptance criteria

- Every selectable date in the visible month shows a compact adult price.
- Standard, holiday, discounted, and exact-override dates resolve through one tested function.
- A selected day has an obvious visual state and a textual selected-date summary.
- The selected summary shows full date, rate label, adult rate, child rate, and under-five rule.
- Past, out-of-horizon, and closed dates cannot be selected.
- Price, closed state, focus, and selection remain understandable without color alone.
- All interactive targets are at least 44px and the calendar fits at 375px.
- Step 2 totals, server-created booking totals, staff views, and email line items agree with the selected rate.
- Manipulating `totalPriceCents` in the browser does not change the server-calculated stored total.
- Shared staff calendars and non-Day-Use booking services are unchanged.

## Risks, tripwires, and fallbacks

### 1. Seven columns become unreadable on small phones

- **Tripwire:** A 4-digit price wraps, clips, or forces a target below 44px at 375px during Stage 2.
- **Fallback:** Show only the formatted number in each cell, state “EGP per adult” once above the grid, and keep the full amount/currency in the accessible name and selected summary. Do not solve it with sub-minimum text.

### 2. Local dates select the previous or next pricing day

- **Tripwire:** A timezone test or a browser outside Cairo shows one date selected but another date’s rate/booking key.
- **Fallback:** Stop UI work and make the date-key API string-based at the pricing boundary. Never patch individual callers with ad hoc timezone offsets.

### 3. Frequent rate edits make deploy-based configuration painful

- **Tripwire:** Management needs unscheduled price changes more than roughly monthly, or non-developers must own them.
- **Fallback:** Start a separate plan for `DayUseRate` persistence and a capability-guarded staff rate calendar. Keep the guest component contract (`date key -> resolved public rate`) so the source can change without redesigning the UI.

### 4. Calendar quote and server total diverge

- **Tripwire:** Any end-to-end matrix row differs by even 1 cent, or a client bundle contains a parallel calculation.
- **Fallback:** Block release. Route both through the shared resolver and add a regression test for the exact case before continuing.

### 5. Updating rates changes an existing booking unexpectedly

- **Tripwire:** Staff edits only party size and the booking is repriced to a newly configured date rate when the business expected the original unit rate.
- **Fallback:** Pause the release decision and choose a snapshot policy. If original rates must persist, plan additive booking fields for adult/kid unit-price snapshots rather than inferring history from the current config.

## Explicitly out of scope

- Staff rate editor or pricing dashboard.
- Occupancy-, weather-, lead-time-, member-, referral-, or demand-based pricing.
- Multiple currencies or currency conversion.
- Range selection or multi-day bookings.
- Changing child age bands or the child multiplier.
- Redesigning Steps 2–3, payment behavior, booking status automation, or emails beyond keeping existing price output consistent.
- Reworking the general shadcn calendar for every route.

## Progress log

- 2026-09-20 — Draft plan created from the current code and the supplied calendar reference. Awaiting grilling and owner decisions; implementation has not started.
