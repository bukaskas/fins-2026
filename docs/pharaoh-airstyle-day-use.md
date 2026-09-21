# Plan: Pharaoh Airstyle spectator registration (fixed-date day use)

**Date:** 2026-09-20
**Status:** Implemented 2026-09-20 — Stages 1–3 done, Stage 4 (entry points) open
**Route to build:** `/day-use/booking/pharaoh-airstyle`
**What this is:** a registration form for **spectators coming to watch the Pharaoh Airstyle day**. It is a day-use booking in every respect — same price, same service, same emails, same payment path. The only difference is that the date is fixed to **Friday 9 October 2026** and step 1 tells the guest what the day is instead of asking them to pick one.

---

## Handoff block

This adds a **second entry point to the existing day-use booking flow**. It differs from `/day-use/booking` in exactly two ways: step 1 shows a locked date plus four lines of event info instead of a calendar, and the brand rail names the event. Pricing, validation, `createBooking`, the `"day-use"` service slug, emails, payment link and every admin screen are unchanged and must stay unchanged — these bookings are counted as ordinary day use and are meant to be indistinguishable in reports. Do not add an events table, a new service slug, a date-override system, or a second price calculation. Start at Stage 1.

---

## Current reality (verified 2026-09-20)

- `app/(root)/day-use/booking/page.tsx` is **1,112 lines, one `"use client"` component**, nothing extracted. It holds: brand rail, 3-step progress, step 1 date popover + `RateDisplay`, step 2 `CountStepper` ×2 + `PriceBreakdown` + group-policy checkbox, step 3 name/email/phone/Instagram, sticky submit.
- Instagram is required on this route only, via a local `dayUseBookingFormSchema = bookingFormSchema.extend({ instagram: … })`.
- A fixed-date event form already exists for kitesurfing: `app/(root)/kitesurfing/booking/pharaoh/page.tsx` (483 lines, `PHARAOH_DATE`, 2 steps, `EVENT_HIGHLIGHTS` chips, its own flat `PHARAOH_*_PRICE_CENTS` and its own `pharaoh-airstyle` service slug). That page is **for event participants**; this one is **for spectators** and stays on day-use pricing. It is a reference for the fixed-date pattern, not a template — and nothing about it changes here.
- Pricing: `lib/pricing.ts` reads `lib/config/pricing.json`. **2026-10-09 is not in `holidayDates` or `discountedDates`**, so it resolves to `standard` → **1,500 EGP adult / 750 EGP child**. Under-5s free.
- `createBooking` (`lib/actions/booking.actions.ts:137`) recomputes the total server-side for `service === "day-use"`, rejects closed dates for non-staff, and routes returning customers straight to `WAITING_PAYMENT`. All of that applies here untouched.
- `app/(root)/day-use/booking/layout.tsx` only sets metadata and returns children, so a nested route inherits nothing that needs undoing. `error.tsx` and `loading.tsx` in that folder cover the nested route too.
- Design authority: `.claude/design-system/pages/day-use.md` (navy `#0c1a2e` / sky `#38bdf8`), which overrides `MASTER.md` for this route.

---

## Decisions

### D1 — Code reuse: extract a shared form, don't fork 1,112 lines *(recommended)*

Move the form body into `components/day-use/DayUseBookingForm.tsx`, taking a small config object:

```ts
type DayUseBookingVariant = {
  fixedDate?: Date;                // present → step 1 is locked
  eventHighlights?: string[];      // rendered under the date on step 1
  notice?: { title: string; body: string };  // postponement / weather banner
  rail: { eyebrow: string; titleTop: string; titleBottom: string; bullets: string[] };
  stepOneTitle: string;            // "When are you coming?" | "Pharaoh Airstyle · 9 October"
};
```

No `service` field — both variants are `"day-use"`. Both routes become ~30-line files passing a variant; `RateDisplay`, `PriceBreakdown`, `CountStepper` and the step-1/2/3 JSX are shared verbatim.

**Alternative rejected:** copy `page.tsx` and edit. Faster today, but it forks a live payments form — the next pricing, validation or accessibility fix has to be made twice and one copy will be missed. Only fall back to this if extraction turns up a blocker in Stage 1, and record why here.

### D2 — Service slug stays `"day-use"` *(settled by the owner, 2026-09-20)*

Spectators are day-use guests. Keeping the slug means **zero ripple**: no changes to `lib/pricing.ts`, `lib/bookings/status.ts`, the email subject/routing maps, `BookingsFilters`, agent stats, `/reception`, `/bookings/date/[date]`, or `BookingEditForm`. These registrations sit in the day-use numbers because that is what they are.

**Consequence, accepted:** an event registration is not distinguishable from a walk-in day-use booking in any report. If that is ever needed, the cheapest later fix is a nullable `source` column on `Booking` — not a second service slug, which would pull the booking out of every day-use total.

### D3 — The fixed date is `2026-10-09` (UTC midnight) *(confirmed by the owner)*

Stored the same way the calendar stores a selection — `new Date(Date.UTC(2026, 9, 9))` — so a late-night booker does not persist the 8th.

### D4 — Price is the standard day-use rate for that date *(confirmed by the owner, 2026-09-20)*

1,500 / 750 EGP, computed by `calculateDayUsePrice` exactly as the normal form does. **No spectator rate and no event surcharge.** If one is ever wanted it belongs in `pricing.json` (`holidayDates`, or a date override per `PLAN.md`), **never hardcoded in the page**.

### D5 — Capacity: the existing closed-date mechanism only *(confirmed by the owner, 2026-09-20)*

Spectators share the normal day-use cap. There is no separate spectator allowance and no ticket counter. When the day fills, staff mark 2026-10-09 closed exactly as they would any other day, and both `/day-use/booking` and this route stop taking bookings — which is what Stage 3's sold-out state handles.

---

## Step 1 content (as supplied)

Under the locked date:

- Best kitesurfing action
- Food worth savoring
- Day full of activities
- Great community

> ⚠️ **Flag for the owner:** `/day-use` is deliberately positioned as a beach club with kitesurfing kept out of the copy. Line 1 breaks that rule on purpose — which makes sense here, since the kitesurfing *is* what spectators are coming to watch. Confirm, then note the exception in `.claude/design-system/pages/day-use.md` so a later reviewer doesn't "fix" it.

---

## Stages

Each stage ends with something visible in the browser.

### Stage 1 — Extract the shared form (no behaviour change)

- [x] Create `components/day-use/DayUseBookingForm.tsx`; move everything from `app/(root)/day-use/booking/page.tsx` into it, unchanged, behind the `DayUseBookingVariant` prop.
- [x] Reduce `app/(root)/day-use/booking/page.tsx` to a thin wrapper passing the current rail copy and no `fixedDate`.
- [x] Keep `dayUseBookingFormSchema` (required Instagram) inside the shared component — both variants want it.
- **Verify:** `npm run build` and `npm run lint` clean. Walk `/day-use/booking` end to end: pick a date, see the rate panel, set 2 adults + 1 child, tick the policy box, submit, land on `/bookings/<id>`. Nothing on screen should have moved by a pixel.

### Stage 2 — The spectator route

- [x] `app/(root)/day-use/booking/pharaoh-airstyle/page.tsx` — wrapper passing `fixedDate`, `eventHighlights` and event rail copy.
- [x] `app/(root)/day-use/booking/pharaoh-airstyle/layout.tsx` — `buildMetadata` with its own title/description/`path`, mirroring the sibling layout.
- [x] In the shared component, when `fixedDate` is set:
  - render a locked date row (`CalendarDays` + `format(date, "EEEE d MMMM yyyy")`) in place of the `Popover` — a read-only panel, no button affordance, no `Pencil` hint;
  - render the four highlight lines directly beneath it, above `RateDisplay`;
  - seed `defaultValues.date` with `fixedDate` instead of `utcTomorrow()`;
  - skip the `getClosedDates()` fetch **for the picker**, but still check whether the fixed date is closed (Stage 3).
- [x] Keep the guest on step 1 rather than skipping to step 2 — the 3-step progress bar stays honest and step 1 becomes the "here's what you're registering for" screen. `RateDisplay` still shows the price before they commit.
- **Verify:** `/day-use/booking/pharaoh-airstyle` shows Friday 9 October 2026, the four lines, and 1,500 / 750 EGP. Submit a test registration; the row in Prisma Studio has `service = "day-use"` and `date = 2026-10-09T00:00:00Z`, and the confirmation email is the normal day-use one with correct line items.

### Stage 3 — Edge cases before it goes near a guest

- [x] **9 October is a closed date.** `createBooking` returns "Sorry, this date is fully booked" for non-staff. The form must check the fixed date against `getClosedDates()` on mount and, if closed, replace the whole form with a "This day is fully booked" panel + the WhatsApp link — not let the guest fill in three steps and hit a wall.
- [x] **The date has passed.** After 9 Oct 2026 the page still renders and `createBooking` would accept a past-date booking. Add a past-date guard showing "This event has finished" with a link back to `/day-use/booking`.
- [x] **Postponement.** The kitesurfing Pharaoh page needed a weather-postponement banner. The `notice` field in the variant makes switching one on a one-line edit rather than a redesign.
- [x] Re-check the group-policy checkbox copy still reads correctly for a spectator group.

### Stage 4 — Entry points

- [ ] Decide with the owner where the link lives. Candidates: a dated banner on `/day-use`, the `StickyReserveBar`, the footer, a link from `/kitesurfing/booking/pharaoh` ("coming to watch instead?"), or Instagram-only.
- [ ] Default assumption if nobody says otherwise: **Instagram-only, no in-site link** — nothing on `/day-use` changes and the event doesn't compete with regular day-use bookings.

---

## Explicitly out of scope

A new service slug; an events table or admin UI; a date-override pricing system (that's `PLAN.md`'s project); capacity limits or a spectator ticket counter (D5); a separate confirmation email design (reuse the day-use one); any change to `/kitesurfing/booking/pharaoh`.

## Open questions for the owner

1. Is "Best kitesurfing action" on a day-use page intentional, given the beach-club positioning? (Reads as yes for this page.)
2. Where does the link go — Instagram only (the current default), or on `/day-use` and/or the participant Pharaoh page too? **This is the last one blocking nothing — Stage 1 and 2 can start without it.**

---

## Implementation record — 2026-09-20

**Shipped:**

- `components/day-use/DayUseBookingForm.tsx` — the former booking page, moved with `git mv` so history follows it, now taking a `DayUseBookingVariant`. New pieces inside it: `FixedDatePanel`, `NoticeBanner`, `ClosedNotice`, a `dayKey` helper, and the two guard early-returns.
- `app/(root)/day-use/booking/page.tsx` — 21-line wrapper, current copy unchanged.
- `app/(root)/day-use/booking/pharaoh-airstyle/page.tsx` + `layout.tsx` — the spectator route.

**Decisions made during the build, not in the draft:**

- The brand-rail backdrop moved into the variant (`photo` + `photoClassName`) rather than staying hardcoded in the shared component. Each route now names its own photo and its own crop, because the right crop depends entirely on what the photo is of.

- `htmlFor` is dropped and the label becomes "Your day" when the date is fixed — pointing a label at a control that no longer exists is worse than no association.
- Step 3's "Edit" goes to step 2 on a fixed-date variant (`goToStep(fixedDate ? 2 : 1)`). Sending someone back to a step whose only control is read-only is a dead end.
- Closed dates are still fetched on the fixed-date route — not for a picker it no longer has, but to drive the sold-out guard.

**Verified in the browser (dev server, both routes):**

- `/day-use/booking` walks 1 → 2 → 3 unchanged: date defaults to tomorrow, standard rate 1,500 / 750, 1 adult + 1 child totals 2,250 EGP, policy gate works, step 3 summary and validation render as before.
- `/day-use/booking/pharaoh-airstyle` shows the locked "Friday 9 October 2026" panel, the four highlight lines, the standard rate, and carries 1,500 EGP through to step 3's summary.
- Past-date guard proved by temporarily pointing the variant at 2025-10-09: the form is replaced by "This day has passed". Reverted.
- `npx tsc --noEmit` clean; `npm run build` compiles both routes; `npm run lint` error count identical before and after (69 pre-existing, none new).

**Later copy/art changes (2026-09-21):**

- Rail headline is "Pharaoh Airstyle, / join the crowd"; third subtitle item is "Kite competition" (was "500m of shoreline").
- Backdrop is `public/images/kitesurfing/kite_booking_form_descktop.webp`, cropped `object-[center_28%]`. The day-use crop biases low (`center 72%`, below a horizon); this frame has the kiter high in it, so that crop would have cut the subject off — worst on mobile, where the rail is a short banner rather than a tall column.
- Share preview (`og:image`/`twitter:image`) is `public/images/og/pharaoh-airstyle.jpg` — the same kite shot, pre-cropped to 1200x630 from the 1400x1000 source, keeping the full kiter and the kite. Exported as JPEG rather than the source WebP because WhatsApp, which is where this link gets shared, is unreliable about WebP previews. Note `buildMetadata` hardcodes `width: 1200, height: 630` for every page, so any image not actually that size is declared wrong to crawlers — true of the existing `dayuse_intro.webp` (680x453) and the reason this one was pre-cropped rather than pointed at directly.
- Note: the subtitle row is `hidden sm:flex`, inherited from the day-use rail, so "Kite competition" does not appear on phones. Unchanged behaviour, flagged rather than fixed.

**Not done:**

- No booking was actually submitted. That writes a row to Neon and sends mail through Resend, which is a real side effect on live services — needs a go-ahead, or a throwaway record someone is happy to delete.
- Stage 4 (where the link lives) is untouched, per the Instagram-only default. Nothing links to the new route yet.

**Observed, pre-existing, not introduced here:** clicking Continue on step 2 lands on step 3 with "Some details still need fixing" already showing, before the guest has typed anything. It reproduces identically on the untouched `/day-use/booking`, so it predates this work — the footer button is the same DOM node across steps and swaps to `type="submit"` mid-click. Worth a separate fix.
