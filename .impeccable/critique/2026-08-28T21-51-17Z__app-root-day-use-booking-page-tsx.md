---
target: day-use/booking form
total_score: 12
max_score: 40
na_heuristics: 
p0_count: 3
p1_count: 2
timestamp: 2026-08-28T21-51-17Z
slug: app-root-day-use-booking-page-tsx
---
Method: dual-agent (A: design review · B: detector + browser evidence), synthesized with parent-side verification of all load-bearing claims.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | Step indicator inactive bars are `bg-muted` on `bg-card` ≈ 1.06:1 — invisible (page.tsx:209). No loading state for `getClosedDates`, no submit feedback at all. |
| 2 | Match System / Real World | 2 | Button says "Submit"; brand says "Reserve Your Day". Success toast prints `Booking created at 2026-08-30T00:00:00.000Z` (booking.actions.ts:174). |
| 3 | User Control and Freedom | 1 | Back preserves state — the one win. No cancel, no reset, step-3 summary is dead text, and step 2's Next is hard-disabled with no escape (page.tsx:622). |
| 4 | Consistency and Standards | 1 | Two public booking forms, zero shared language. Four palettes in play; none is MASTER.md's. |
| 5 | Error Prevention | 1 | No `max` on adults despite schema cap of 100. `autoComplete="off"` on name. Closed dates arrive after a client round-trip. Default date not UTC-normalized. |
| 6 | Recognition Rather Than Recall | 3 | RateDisplay + live PriceBreakdown + step-3 summary. Best heuristic on the page. Gap: rate badge vanishes on step 2. |
| 7 | Flexibility and Efficiency | 1 | Three forced steps for six fields. Server already recognizes returning customers; the form ignores it. |
| 8 | Aesthetic and Minimalist Design | 2 | RateDisplay chip is well-made. Card is white-on-white; photo deleted on mobile; required Instagram is pure friction. |
| 9 | Error Recovery | 0 | Verified live: Submit with all fields empty produces no alert, no toast, no invalid field, no navigation. Total silence. |
| 10 | Help and Documentation | 0 | No terms, no cancellation policy, no arrival info, no reason for Instagram or the mixed-group gate, no mention of the 24h payment window. |
| **Total** | | **12/40** | **Poor — major UX overhaul required** |

## Design Specificity Verdict

**Category-interchangeable.** Swap "Adults/Kids" for "Patients" and 1,500 EGP for a copay and a dental practice ships this unchanged. Nothing in the composition, interaction, or color is about the Red Sea, a beach, sun, or an Egyptian guest.

The brand does not survive the click. The landing page is navy `#0c1a2e` + sky `#38bdf8`, thin Raleway display type, editorial full-bleed panels. Neither hex appears once in `booking/page.tsx`. The CTA the guest just clicked was sky-blue "Reserve Your Day"; the CTA they land on is `oklch(0.205 0 0)` near-black — the shadcn factory default.

Every surface color is borrowed, not authored: either a shadcn default or a warm-stone hex lifted from the **staff** bookings tool (`#ece8e3`, `#f5f2ef`, `#6b6460`, `#1a1614`, `#a09890`). Those come from `pages/bookings.md`, whose own scope statement limits it to `/bookings` and its children. Internal admin styling has leaked onto a public conversion page.

**Deterministic scan:** `detect.mjs` returned `[]` (exit 0) on both the booking page and the day-use landing page. This is a true clean result, not a tool failure — but the registry targets ~40 AI-slop visual antipatterns (gradient-text, marquee, bounce-easing, radial-glow), none of which a data-entry form exhibits. The scan cannot see "this form has no identity." Treat the zero as scope, not absolution.

**Mechanical corroboration (independent of the design review):** 14 distinct hex literals in one 642-line file; 20 arbitrary Tailwind bracket values; 5 distinct font sizes including `text-[0.85rem]` sitting 1px from the `text-sm` already used in the same file; 5 distinct radius values; zero `shadow-*`; zero `role=`; zero `aria-live`; `aria-invalid` is the only aria attribute present.

**Design-system compliance:** fails 7 of MASTER.md's 10 pre-delivery checks — no neumorphic base, no dual shadows, white-on-white cards (named anti-pattern), CTA is not `#0EA5E9`, text at `text-[0.63rem]` ≈10px against a 12px floor, `#a09890` text at 2.9:1 banned by name in the project's own `pages/bookings.md:26`, focus states not visible.

**Browser evidence:** desktop (1440px) captured and inspected live at `localhost:3000`. Mobile viewport capture failed — `resize_window` reported success but `window.innerWidth` never changed across three attempts. Mobile claims below are derived from source and measured element geometry, not screenshots. Dev server was stopped; port 3000 confirmed free.

## Overall Impression

The pricing logic is the most thoughtful thing here and the form around it is unfinished. Someone built a genuinely good idea — show the per-head rate the moment a date is picked, then show the arithmetic live — and then wrapped it in the shadcn multi-step card demo with the fields renamed.

The single biggest opportunity is not visual. **The form cannot report an error to anyone, for any reason.** Everything else is downstream of that.

## What's Working

1. **Progressive price disclosure is real craft.** `RateDisplay` (page.tsx:54–87) shows the per-head price at date-selection time, before any commitment — most booking forms hide the number until checkout. The rate chip correctly follows the project's own status-color rule: saturated dot, tinted background, darkened text (`#1d4ed8` on `#eff6ff`), all clearing 4.5:1. `PriceBreakdown` then shows the arithmetic live as quantities change.
2. **Server-authoritative pricing, done properly.** `createBooking` recomputes the total server-side and treats the client value as a display hint (booking.actions.ts:93–102), and independently re-checks closed dates for non-staff. The UI is free to be optimistic without being exploitable.
3. **Step state survives Back.** One persistent `useForm` plus `form.Subscribe` means Back never loses typed data. The most common multi-step failure, correctly avoided.

## Priority Issues

### [P0] Validation is structurally undisplayable — Submit silently does nothing
**Why it matters:** Every user who mistypes an email, leaves Instagram blank, or enters >100 adults hits a dead button with zero feedback. They cannot self-recover because there is nothing to recover from. This is the largest single source of lost bookings on the page.

Two stacked bugs, both verified in source:
1. `page.tsx:161–166` returns `result.error.flatten().fieldErrors` — a flat map with no `fields` key. `isGlobalFormValidationError` (form-core/utils.js:186) requires `"fields" in error`, so TanStack files the whole object as a **form-level** error. No field ever receives `meta.errors`; `isValid` goes false; `_handleSubmit` returns before `onSubmit` runs. `onSubmitInvalid` is not configured.
2. Even if fixed, `FieldError` expects `Array<{message?: string}>` and reads `error?.message` (field.tsx:186–231). Zod hands it plain strings, so `content` is null and it renders nothing.

**Fix:** Return `{ fields: fieldErrors }`; map Zod's string arrays to `{ message }` objects. Add `onSubmitInvalid` that focuses the first invalid field and fires `toast.error`. The kitesurfing form has the same validator shape and is broken the same way.

### [P0] The "mixed group" checkbox is an unexplained dead end that collects nothing
**Why it matters:** `disabled={step === 2 && !isMixedGroup}` (page.tsx:622). A solo traveller, three male friends, or a group of women cannot proceed — no message, no tooltip, no `aria-describedby`, no alternative path. They abandon, or check a box they know is false and risk refusal at the gate. Your actual house rule (`bookings/guide/page.tsx:129`) is "Mixed groups & families only", which **permits** all-female families — the checkbox wording is narrower than the policy it enforces.

`isMixedGroup` appears at exactly three lines — 133, 408, 622 — and is never added to `normalizedValue`. It gates the funnel and captures zero data, so there is no record anyone attested to anything.

**Fix:** If it's a real door policy, state it as policy with the real wording, send it to the server, and give the false case a WhatsApp escape instead of a dead button. If it isn't, deleting it is free conversion.

### [P0] Advertised kids price (600 EGP) contradicts the charged price (750 EGP)
**Why it matters:** `day-use/page.tsx:369–378` advertises "Ages 5 – 8 → 600 EGP" and "Under 5 → Free". `lib/pricing.ts:55` computes `kidsUnitCents = adultUnitCents * 0.5` = **750 EGP**, which the form displays. A parent with two children sees a 300 EGP gap between the ad and the checkout, at the exact moment they decide whether to trust you. The form has no under-5 concept at all, so parents of toddlers have no correct way to fill it.

**Fix:** Decide the real number and give it one source of truth in `lib/config/pricing.json`, read by both pages. Add "Children under 5 — free, no ticket needed" to the kids field.

### [P1] The page is effectively unusable with a screen reader
**Why it matters:** `document.querySelectorAll('h1,h2,h3')` returns an **empty array** — `CardTitle` renders a `<div>` (card.tsx:31). Heading navigation, the primary screen-reader mode, returns nothing. The step indicator is three unlabelled `div`s. Pressing Next swaps the entire `CardContent` with no `aria-live` and no focus move. Buttons and inputs measure 36px against the project's own 40px mobile floor and WCAG's 44px. Focus ring is mid-grey at 50% opacity on white.

Combined with the P0 above, this is not a degraded experience — it is a non-functional one.

**Fix:** `<CardTitle asChild><h1>`; `role="progressbar"` plus visible "Step 2 of 3"; wrap the step body in `aria-live="polite"` and move focus on change; `min-h-11` on footer buttons; project-token focus ring.

### [P1] Zero disclosure at commitment, zero payoff after it
**Why it matters:** No terms, no cancellation policy, no "what happens next", and no mention that the server may drop the booking into `WAITING_PAYMENT` with a **24-hour auto-cancel** (booking.actions.ts:36,134–138). The same Submit button produces two entirely different outcomes — `PENDING` + email for new customers, straight-to-payment for returning ones — neither previewed. Success is announced as a raw ISO timestamp. Failures use neutral `toast()` (page.tsx:193,197), so a failure looks identical to a success.

The reassuring copy already exists — on `/bookings/guide`, a page the booker never sees: *"Our team will be in touch shortly to confirm your booking… This helps us keep our community the way we love it 🤍"*

**Fix:** Put a reassurance block above Submit: "No payment now. We'll confirm on WhatsApp within 24 hours." Rename the button "Reserve My Day". Replace the ISO toast with human copy.

## Persona Red Flags

**Jordan (first-timer, non-native English, from an Instagram bio link, mobile):** Taps a photo-driven post and lands where `hidden md:block` (page.tsx:222) has deleted the photo — no hero, no price, no Fins mark inside the card. The only identifying text, "Day Use booking", is 16px and not a heading. The kids label reads *"Kids (5 to 8 years old) above 8 count as adult"* — two clauses jammed together with no punctuation; the second parses as a broken sentence. Their 3-year-old was advertised as free and has no field. Travelling with two male friends, they hit the grey Next with no message, tap it four times, then lie or leave. If they mistype their email, Submit does nothing — they conclude the site is broken and tap the WhatsApp FAB, so the club now manually handles exactly what the form exists to automate.

**Sam (screen reader + keyboard):** Zero headings on the page. The step indicator is three bare `div`s — never learns there are three steps or which one they're on. Next swaps the content with nothing announced; the changed fields are now behind them in tab order. The disabled Next has no `aria-describedby` pointing at the checkbox that unlocks it, and in many SR modes disabled buttons are skipped entirely — Sam may never learn it exists. On submit failure there is no `role="alert"` in the DOM and no signal of any kind. The phone country trigger contains only a flag `<span>` and a chevron — an unlabeled button controlling ~240 options.

**Casey (one hand, bright sun, spotty 3G):** `getClosedDates()` fires on mount with no loading state; for several seconds every date is selectable, and the step-1 guard tests against an empty array. If the fetch fails, `if (r.success)` swallows it silently — no retry, ever. The WhatsApp FAB is `fixed bottom-6 right-6 z-50` at 64px; the card is `m-2` so on a 390px phone the right-aligned Submit lands under it — occlusion of the Instagram input was confirmed visually on desktop. Tap targets are 36px in the hardest corner for a thumb. `#a09890` at 2.9:1 and `text-[0.63rem]` ≈10px are unreadable in sun. No autofill anywhere: `autoComplete="off"` on name and Instagram, and no token at all on email or phone — four fields thumb-typed from scratch.

## Minor Observations

- **[P1, correctness] The default date can be priced and booked a day early.** `new Date(Date.now() + 86400000)` (page.tsx:149) is not UTC-midnight-normalized, unlike calendar selections. `format` renders local; `getDateRate` reads `getUTCDate()`. In Cairo, a guest booking between 00:30–02:59 who never opens the calendar sees "August 30th" but stores the 29th, at the 29th's rate.
- **The rate machinery is currently dead.** `pricing.json` holds five holiday dates, all in May 2026 (past), and an empty `discountedDates`. Every date today resolves to "Standard" — the holiday/discount design is invisible in production.
- **Clearing the Adults field desyncs display from state** — `onChange` only commits when `n >= 1`, so an emptied input still prices as 1 adult until blur.
- **Instagram is required here but optional in the shared schema**, with no explanation and no "I don't have Instagram" escape.
- **No `loading.tsx` or `error.tsx` anywhere in `app/`.**
- **`<Image>` has no `sizes` prop** despite `md:w-1/2 lg:w-2/3`, on a 3G-first surface.
- **The step-3 summary is dead text** — fixing a wrong date takes two Back presses.
- **Card and image columns are height-mismatched on desktop**, leaving a visible white void below the footer.

## Questions to Consider

1. **Why is this a form at all?** You know the date, the party size, and the price. Why isn't it three taps — "Tomorrow / This weekend / Pick a date" → a −/+ stepper → confirm — with contact details collected after the sunbed is held?
2. **Why does the price get smaller the closer the guest gets to paying it?** 4rem on the landing page, 14px grey at the moment of commitment.
3. **What does the guest hold in their hand at the gate?** Nothing in this flow produces a QR, a reference, a map, or a calendar entry. If frictionless arrival is the product, why does the flow end at a database log line?
4. **`QR-partnership.md` assumes a coffee-shop scan completing this form on a phone.** On that exact surface the photo is hidden, the kids price contradicts the ad, and Submit fails silently. Should the partnership ship before the form works?
5. **`pages/bookings.md` reclassified staff-tool palette drift as "a deliberate override, not drift."** That palette has now leaked onto a public page it explicitly excludes. Does this surface need a `pages/day-use.md` that actually authors it — or does MASTER.md need enforcing rather than documenting around?
