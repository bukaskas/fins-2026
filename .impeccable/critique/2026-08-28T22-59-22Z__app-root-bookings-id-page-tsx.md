---
target: bookings/[id]
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
timestamp: 2026-08-28T22-59-22Z
slug: app-root-bookings-id-page-tsx
---
Method: dual-agent (A: design review, isolated · B: detector + browser evidence, isolated)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | `getBookingById` cancels the booking as a side effect of the page read (`booking.actions.ts:1003-1010`) and never says so. `StatusEditDialog.tsx:113` checks only `res.success`, discarding the `warning` returned when the Flash link fails (`booking.actions.ts:1108`) — staff see "Status updated" and believe the guest can pay. Offset by an excellent countdown. |
| 2 | Match System / Real World | 2 | `page.tsx:278` hardcodes "Working time 9:30 am – 12 pm" on every CONFIRMED booking, contradicting 9:00 AM – 11:00 PM in the confirmation email (`emails/emailTemplate.tsx:103`) and the day-use page (`day-use/page.tsx:148,384`). Staff read the wrong hours to the guest off the screen. |
| 3 | User Control and Freedom | 2 | Dialogs cancel cleanly and Save disables when unchanged (`StatusEditDialog.tsx:204`), but no write here is reversible: `payBookingDeposit` inserts a ledger row and flips to CONFIRMED with no removal reachable from this page; CANCELED has no confirm and no undo. |
| 4 | Consistency and Standards | 1 | Two complete status colour systems for one enum (`page.tsx:36-44` pastel vs `BookingComponent.tsx:41-65` saturated + darkened text). Two interaction models for the same operation (optimistic dropdown on the list row vs modal-with-Save here). Label casing diverges ("Request sent" / "Request Sent"). 28 text uses of `#b0a89f` and `#8a8480`, both explicitly banned as text by `pages/bookings.md:26` — which the sibling list already honours. |
| 5 | Error Prevention | 1 | `PayDepositDialog` accepts any amount; `remainingAfter` clamps at 0 (`:74`) so an overpayment renders as a calm "0 EGP remaining after". Nine status rows are visually identical (`StatusEditDialog.tsx:180-188`) with destructive and constructive interleaved, no confirm step, and no disclosure that CONFIRMED can auto-close the whole date at 80 people (`booking.actions.ts:1096-1100`). |
| 6 | Recognition Rather Than Recall | 2 | Contact chips carry the real phone/email as their label — good. But no day context, no payment history, no contact log, no notes; `instructor`/`agent` render only when set (`page.tsx:441`), so "unassigned" and "not shown" are indistinguishable. |
| 7 | Flexibility and Efficiency | 2 | Three inline dialogs and `tel:`/`wa.me`/`mailto` deep links are right. But the list row is more capable than the detail page: `BookingComponent.tsx:379-397` has three copy-message actions this page lacks. No ARRIVED check-in button despite that being the daily desk action. Back link always drops to `/bookings`, discarding date/filter context. |
| 8 | Aesthetic and Minimalist Design | 3 | The page's real achievement — warm-paper ground, layered gradient wash, day-number date card, hairline dividers, one black CTA per zone. Loses a point for being a magazine hierarchy doing an operations job, and for the marketing `Header`/`Footer` and green WhatsApp FAB crashing into it. |
| 9 | Error Recovery | 2 | Dialogs stay open with values intact on failure — genuinely correct. But when the countdown expires, `getVariant` returns `null` for CANCELED (`NextStepCard.tsx:38,61`) and the entire next-step card vanishes: no timestamp, no reason, no extend, no re-open. `CopyButton.tsx:23` tells the user to "select manually" from text inside a `<button>`. |
| 10 | Help and Documentation | 1 | The guest gets policy inline (non-refundable, 24h window). Staff get nothing: no status definitions, no what-this-triggers, no policy text to read aloud. `booking-page-update.md` §3.4 specifies a "Say" tab for exactly this; unbuilt. |
| **Total** | | **18/40** | **Poor — core experience broken for the primary user** |

The score is not a verdict on craft. Heuristic 8 is a genuine 3 and `PaymentCountdown` is 4-quality work. It is a verdict on fit: a carefully made guest artifact is being asked to be a staff console, and the four heuristics that matter most for an operations surface (4, 5, 9, 10) fail on the things this page exists to do.

## Design Specificity Verdict

**LLM assessment — split, and the split runs exactly the wrong way.** The guest-facing half is genuinely authored to this business; the staff-facing half — the half under review — is generic and in places thinner than a stock CRM.

The cause is structural. `proxy.ts:34` makes `/bookings/<uuid>` a public URL — it is the link reception pastes into WhatsApp (`BookingComponent.tsx:100-113`). So one page serves a guest reading their own confirmation and a staff member working the desk, and it resolves that conflict by rendering the guest's page and bolting five staff affordances onto it. Staff read second-person guest copy about themselves: *"Your reservation is on hold. Pay the deposit securely online"* (`NextStepCard.tsx:285-291`).

**Most authored:** `NextStepCard`'s payment body plus `PaymentCountdown` — the 24h hold as a live clock that switches from `23h 41m` to `41m 05s` and amber to red in the final hour, and a bank-transfer disclosure ending in *"send a screenshot of the transaction"* over WhatsApp, with the account number as a 1.05rem mono copy target. That is Egypt, that is this market, that is how money actually arrives. No template produces it.

**Most generic:** the Party / Deposit-paid two-column grid (`page.tsx:323-428`) — big number, unit label, 3px progress bar, black pill. The analytics-tile idiom from every dashboard built since 2019, and nothing in it knows these are people arriving at a beach on a specific windy Saturday.

**Deterministic scan — 0 findings, exit 0, and the zero is real but nearly meaningless here.** The detector's per-file rules key on Tailwind palette classes (`text-gray-500`, `from-purple-500`), CSS-in-JS animation and `<img>`; this surface uses 100% arbitrary hex (207 `#RRGGBB` literals plus 24 inline `rgba()`), so it sits outside the tool's vocabulary. A second rule class only runs on full HTML documents, which App Router components are not. Assessment B verified this by grepping each rule's pattern manually — all zero. Treat the clean scan as "no known-bad idioms", not "no problems".

What the manual mechanical pass did find:
- **28 text uses of banned colours** — `text-[#b0a89f]` (2.3:1) on text in 14 places (`page.tsx:153,163,237,274,293,479,491`, `NextStepCard.tsx:113,137,356`, `PartyEditDialog.tsx:205,222`, `PaymentLinkCard.tsx:55`, `StatusEditDialog.tsx:170`) and `text-[#8a8480]` (3.7:1) in 14 (`page.tsx:341,365,384,408`, `NextStepCard.tsx:219,297,311,315,326,330`, `PartyEditDialog.tsx:28,215,220`, `PayDepositOnline.tsx:62`). `pages/bookings.md:26` bans both verbatim. Worse, `#b0a89f` at `page.tsx:237` sits on `#FBF8F3`, not white, so it is below even the failing on-white figure.
- **Token drift** — page ground `#FBF8F3` vs documented `#faf9f7`; icon ground `#f5f3f0` vs `#f5f2ef`; a third undocumented text grey `#5b5650` (19×, ~7.3:1, passes but is off-system); and `STATUS_TONE` is an independent 36-value palette that ignores the `STATUS_TEXT`/`SERVICE_META` set the brief mandates.
- **Type floor** — 59 sizes below 14px, **38 of them below 12px** (down to `0.58rem` ≈ 9.3px at `page.tsx:274,293`). The brief's mandated mobile pair `text-[0.72rem] sm:text-[0.6rem]` is used **zero times**.
- **11 tap targets under 44px**, including all four contact chips (~27px, `page.tsx:509`), the status pill trigger (~25px, `StatusEditDialog.tsx:128`), both `PaymentLinkCard` text actions with no padding at all (`:63,:72`), and the "Pay deposit" CTA (~33px, `page.tsx:419`).
- **6 unconditional `grid-cols-2`** with no breakpoint (`page.tsx:267,323,442`, `NextStepCard.tsx:304`, `PartyEditDialog.tsx:245`, `StatusEditDialog.tsx:191`).
- **1 unlabelled form control** — `BookingEditForm.tsx:420-427`, the Agent `SelectTrigger` has no `id` and its `FieldLabel` no `htmlFor`; every other field in that form is correctly paired.

Genuinely clean, and worth stating: **zero** missing accessible names (every icon-only control has an `aria-label` or visible text), **zero** images without `alt`, **zero** colour-only status signalling (every badge, countdown and progress bar carries text), and **zero** `console.log`, TODO, placeholder copy or dead markup across all nine files.

**Visual overlays — not available.** The dev server started clean (Next.js 16.0.10, 690ms), but `/bookings/test-id` returns `307 → /signin?callbackUrl=…`: the route is fully auth-gated and needs a real session plus a real booking id. No account creation, credential guessing or DB seeding was attempted. No overlay was injected and none is claimed. The server was killed and port 3000 verified free.

## Overall Impression

This is a beautiful page doing the wrong job. Someone with real taste built a guest-facing reservation artifact — the warm paper, the day-number date card, the countdown that changes register in the final hour — and it deserves to exist. Then the staff console was grafted onto it as five conditional branches, and the result is that the people who use this surface fifty times a day get the leftovers: guest copy written at them, two identical black pills that do opposite things, the balance they need in the smallest text on the page, and a Save button that on an iPhone SE is off-screen and unreachable.

The single biggest opportunity is to stop splitting the difference. `proxy.ts:34` already says this URL is the guest's. Let it be the guest's, keep it exactly as good as it is, and give staff their own dense, deliberately unbeautiful operate view at `/bookings/[id]/desk` — balance, clock, phone, four buttons, one screen. Every issue below except the mobile bugs dissolves the moment those two audiences stop sharing a layout.

## What's Working

**`PaymentCountdown` is the best-designed component in the repo.** It derives from the absolute deadline rather than a duration, so it survives refreshes and bfcache (`:11-14`); it changes *unit* under an hour, `23h 41m` → `41m 05s` (`:43-46`), so the last hour reads differently at a glance; and it changes *register* from amber to red at the same threshold (`:49-52`). It turns a cron-enforced business rule into something a human feels rather than reads. This is what design specificity looks like.

**The bank-transfer `<details>` block** (`NextStepCard.tsx:353-393`) is correct progressive disclosure of the fallback path — hidden until asked for, and it renders the account number as a large tabular-mono copy target (`CopyButton.tsx:34`) instead of a text field, because the real task is "get these digits into a banking app", not "read them". It ends on the WhatsApp screenshot handoff, which is how payment is actually proven in this market.

**`PartyEditDialog`'s live price preview** (`:219-224`) recomputes the total through the real `computeBookingTotalCents` before anything is written. Reception can answer *"what if my sister comes too?"* out loud, instantly, without committing. It is the one interaction on the page designed around a conversation rather than a record.

## Priority Issues

### [P0] RECEPTION — the page's primary user — is rendered the guest view
- **What**: `page.tsx:30` hardcodes `STAFF_ROLES = [ADMIN, STAFF, OWNER]`, checked at `:99`. `RECEPTION` is absent — while `lib/permissions.ts:13` grants it `bookings:manage` and `proxy.ts:13` admits it to the route. The same bug redirects them off the list at `bookings/page.tsx:23`.
- **Why it matters**: The person at the front desk gets no phone link, no WhatsApp, no email, no status control, no party edit, no Pay deposit, no payment link and no Edit — and is instead shown a guest checkout button and the club's own bank details. Every other issue here is invisible to them because they cannot reach the controls. `booking-page-update.md` §2.4a documented this on 2026-08-29 and it is still in the tree.
- **Fix**: Delete `STAFF_ROLES`; use `const isStaff = roleHasCapability(role, "bookings:manage")` from `@/lib/permissions`. Same one-line change in `bookings/page.tsx`. Then audit the section — nothing else may hardcode a role array.
- **Suggested command**: `/impeccable harden`

### [P0] The page breaks on the device it is used on
- **What**: (a) `StatusEditDialog.tsx:142` — `DialogPrimitive.Content` is `fixed top-1/2 -translate-y-1/2` with **no `max-h` and no `overflow-y-auto`**. Header ~90px + 9 rows × ~44px + padding + 44px buttons ≈ 620px. On an iPhone SE (568px viewport) the Save button is not below the fold, it is off-screen and there is nothing to scroll. (b) `page.tsx:323` never stacks: at 375px, `px-5` leaves 335px and `gap-x-8` leaves ~151px per column, while `page.tsx:362` sets the deposit figure to a fixed `text-[3.5rem]` weight 100. "12,500" at 56px Raleway is ~170px; a flex item with default `min-width:auto` cannot shrink, so any four- or five-figure amount pushes the page into horizontal scroll — the exact thing `pages/bookings.md` mobile rule 1 forbids. The read-only party figure got a responsive pair (`page.tsx:338`); the staff-facing one in `PartyEditDialog.tsx:25` did not, so the staff view is worse than the guest view.
- **Why it matters**: Reception works on a phone at the desk, in Red Sea sun, with a guest watching. This is the device, and the amounts are the content.
- **Fix**: Add `max-h-[85dvh] overflow-y-auto` to both dialog `Content` elements. `grid-cols-1 sm:grid-cols-2` on `page.tsx:267,323,442`. `text-[2.5rem] sm:text-[3.5rem]` on the deposit figure and in `PartyEditDialog`, plus `min-w-0` on the flex containers. Then a mechanical pass: `#b0a89f`/`#8a8480` text → `#6b6460`, and all 38 sub-12px sizes → the documented `text-[0.72rem] sm:text-[0.6rem]` pair.
- **Suggested command**: `/impeccable adapt`

### [P1] One page, two audiences — staff read the guest's copy and press the guest's buttons
- **What**: `NextStepCard` renders identically for both (`page.tsx:310-317`). A staff member on a WAITING_PAYMENT booking reads *"Pay a 50% deposit to confirm / Your reservation is on hold"* (`NextStepCard.tsx:285-288`) above a full-width black **"Pay deposit online"** that runs `window.location.href = paymentLink` (`PayDepositOnline.tsx:25`) — navigating reception's own browser out of the app to a card checkout, mid-conversation, with no return path. It sits ~100px above the staff **"Pay deposit"** pill (`page.tsx:419`): a near-identical black pill that records cash.
- **Why it matters**: The loudest element on the page is not staff's action, and the two loudest elements are visually indistinguishable while doing opposite things. New seasonal staff cannot tell them apart, and tapping the wrong one loses the page.
- **Fix**: Branch `NextStepCard` on an `isStaff` prop. The staff variant states the same facts in third person and offers the staff moves — `Deposit not received · 2,500 EGP due · 6h 12m left` with **Copy payment link · Send on WhatsApp · Record cash payment**. Keep every guest variant byte-for-byte; it is the best work on the page.
- **Suggested command**: `/impeccable clarify`

### [P1] The hierarchy answers the guest's question, not the operator's
- **What**: The largest type is the guest name at `clamp(2.1rem, 7vw, 3.25rem)` (`page.tsx:168`) and **amount already paid** at `3.5rem` weight 100 (`page.tsx:362`). Balance owed is `0.7rem` mono (`page.tsx:398`), status is a `0.65rem` pill (`page.tsx:230`), and the expiry countdown is `0.72rem` inside a card below it (`PaymentCountdown.tsx:61`).
- **Why it matters**: Reception opens this page to answer three questions — *are they confirmed, what do they still owe, how long have I got*. All three are the smallest text on screen, two of them in colours the section's own rules ban for text. "Deposit paid" is the number that has already stopped mattering.
- **Fix**: For `isStaff`, invert the deposit block: lead with **balance due** at `3rem` in `#1a1614`, with `2,500 of 5,000 EGP paid` at `0.9rem` beneath, and drop the 3px progress bar — it encodes one number already stated twice. Lift the countdown out of `NextStepCard` into the header row beside the status pill so it is visible without scrolling. Add one operational line under the name: `Day use · Sat 12 Sep · 4 people · 2,500 EGP due`.
- **Suggested command**: `/impeccable layout`

### [P1] Money and status writes are one-way doors with undisclosed consequences
- **What**: (a) "Confirm & pay" (`PayDepositDialog.tsx:228-235`) inserts a `BookingPayment` and flips the booking to CONFIRMED (`booking.actions.ts:1428`); the only statement of that consequence is `sr-only` (`PayDepositDialog.tsx:128-131`). Any amount is accepted and `remainingAfter` clamps at 0 (`:74`), so typing 5000 instead of 500 reads as a calm "0 EGP remaining after" and is unrecoverable from this page. (b) `StatusEditDialog.tsx:180-188` lists nine identical rows; CONFIRMED can auto-close the entire date at 80 people (`booking.actions.ts:1096-1100`), WAITING_PAYMENT starts an irreversible 24h auto-cancel clock, and `StatusEditDialog.tsx:113` **discards the `warning`** the action returns when the payment link fails to mint (`booking.actions.ts:1108`) — toasting "Status updated" while the guest has no way to pay. (c) `page.tsx:278` hardcodes "Working time 9:30 am – 12 pm" on every CONFIRMED booking, against 9:00 AM – 11:00 PM in the guest's own confirmation email (`emails/emailTemplate.tsx:103`) and on the day-use page (`day-use/page.tsx:148,384`).
- **Why it matters**: This is the money and the promises. Reception mistypes a deposit with no reversal; picks CONFIRMED and silently closes the date for the whole business; and reads the guest the wrong opening hours straight off the screen.
- **Fix**: Put the consequence in the button and in visible text — `Record 2,500 EGP cash — this confirms the booking`. Add a warning row when `amountCents + amountPaidCents > total`. Under "Deposit paid", render the actual ledger (`2,500 · Cash · Ahmed · 14:32`) with a remove action wired to the existing `deleteDepositPayment`. In `StatusEditDialog`, group the nine into In progress / Confirmed / Closed, require a second confirming tap on the three closing statuses, show a consequence line under the selection, and surface `res.warning` as `toast.warning`. Replace the hardcoded hours with the service's real hours from `lib/constants`.
- **Suggested command**: `/impeccable harden`

## Persona Red Flags

**Casey (distracted mobile user — weighted heaviest; this is reception's actual device)**
- `StatusEditDialog` Save is **off-screen and unreachable** on an iPhone SE — no `max-h`, no `overflow-y-auto` (`StatusEditDialog.tsx:142`), ~620px of content in a 568px viewport.
- Horizontal page scroll on any four-figure EGP amount (`page.tsx:323` + `:362`).
- The global green WhatsApp FAB (`WhatsAppButton.tsx:46`, `fixed bottom-6 right-6 z-50`, ~64px) floats over exactly where the right-aligned "Edit booking" pill lands (`page.tsx:465`). A guest-marketing widget occluding a staff control on a staff page.
- Marketing `Header` and `Footer` wrap this operations page (`app/(root)/layout.tsx:15,19`), and `min-h-screen` (`page.tsx:123`) guarantees dead scroll below the content.
- 9.3px labels in 2.2:1 grey (`page.tsx:274,293`) in bright sun.
- Credit where due: `PayDepositDialog.tsx:173` uses `text-[1rem]` on the amount input — no iOS zoom-on-focus. That rule was followed.

**Jordan (new seasonal staff, week one)**
- Nine status names, zero definitions (`StatusEditDialog.tsx:180-188`). Nothing says which to pick when a guest calls, or what each triggers — and three of them trigger significant machinery.
- Two black pills, opposite meanings: "Pay deposit online" sends *their own* browser to a card checkout; "Pay deposit" records cash. Same colour, same shape, adjacent.
- They will read the wrong opening hours aloud (`page.tsx:278` vs `emails/emailTemplate.tsx:103`).
- No answers for the follow-ups asked at the desk within 30 seconds — pets, refunds, kids' ages, last entry. `booking-page-update.md` §3.4 specifies the "Say" tab for this; it does not exist.

**Sam (accessibility-dependent)**
- Contrast, systematically: `#b0a89f` on `#FBF8F3` ≈ 2.2:1 for every eyebrow, the booking ref (`page.tsx:153`) and the footer (`:479`); `#8a8480` ≈ 3.5:1 for "person/people", "EGP", "of X EGP". Both banned as text by `pages/bookings.md:26` — and the sibling list already fixed this (`BookingComponent.tsx:68`, `MUTED = "#6b6460"`).
- Weight-100 display numerals (`page.tsx:241,338,362`, `PartyEditDialog.tsx:25`) — hairline strokes, against `MASTER.md`'s 400 minimum.
- **Focus rings absent on the entire money path**, despite `pages/bookings.md:64` mandating them on every pill: `ContactLink` (`page.tsx:512`), Edit booking (`:468`), the **Pay deposit pill** (`:421`), all three `PaymentLinkCard` controls (`:63,:72,:87`), `PayDepositOnline` (`:51`), `PayDepositDialog`'s four method buttons and Cancel/Save, all nine `StatusEditDialog` rows, and the `PartyEditDialog` steppers. Where a ring does exist it uses `ring-[#d6d0c8]` — a near-invisible warm grey, not the mandated `#1a1614`.
- The status list is nine unrelated `<button>`s (`StatusEditDialog.tsx:59-91`) — no `role="radiogroup"`, no `aria-checked`, no group label. A screen-reader user hears nine buttons and cannot tell which is current.
- The one consequence statement that matters is `sr-only` (`PayDepositDialog.tsx:128-131`) — sighted staff, the vast majority, never see it.
- `PaymentCountdown` re-renders every second (`:17-20`) with no `aria-live` and no announcement at the amber→red threshold.

## Minor Observations

- `fmtEGP` (`page.tsx:54`) rounds to whole EGP, so paid/total/remaining can disagree by 1 EGP on screen.
- `digits()` (`page.tsx:58`) never converts a legacy Egyptian `01…` number to `201…`, so `https://wa.me/01222…` (`:184`) opens nothing. `components/reception/ContactActions.tsx:34` already solves this and isn't reused.
- The booking ref is truncated to 8 characters (`page.tsx:154`) and isn't copyable — staff transcribe it by eye.
- The back link always targets `/bookings` (`:139`), discarding `/bookings/date/2026-09-12`, a primary entry point.
- `PaymentLinkCard.tsx:48` surfaces the raw gateway status to staff: `Not paid yet (status: ${res.status})`.
- The countdown renders only when `waitingPaymentAt` is set (`NextStepCard.tsx:66`) — older bookings show no deadline and no fallback copy.
- The gradient wash is `fixed inset-0 -z-10` (`page.tsx:127`), so the layout `Footer` renders over the beach gradient rather than the page ground.
- `SectionLabel` (`page.tsx:489`) is re-implemented inline in `PaymentLinkCard.tsx:55` instead of imported.
- `PayDepositDialog` resets `method` to `CASH` on every open (`:67`), even when a payment link is outstanding.
- `CopyButton`'s failure toast (`:23`) advises manually selecting text that lives inside a `<button>`. `booking-page-update.md` §3.6 already specifies the `execCommand` fallback; unbuilt.
- `BookingEditForm.tsx:420-427` — the Agent select is the one field in that form with no programmatic label.

## Questions to Consider

1. `proxy.ts:34` makes this URL public *on purpose* — it is the guest's link. So why is it also the staff console? What breaks if `/bookings/[id]` stays purely the guest artifact, and staff get `/bookings/[id]/desk`: dense, deliberately unbeautiful, one screen, balance + clock + phone + four buttons?
2. What is the *one* question reception is answering when they open this page? If it is "are they confirmed and what do they owe", why are those the two smallest pieces of text on screen while "amount already paid" is 3.5rem?
3. The most frequent desk action of the season is marking a guest ARRIVED. Right now that is: tap pill → scan nine rows → tap → Save. What would this page look like if **"Guest is here"** were one button and the other eight statuses lived behind "Change status"?
4. Every money write here is a one-way door with no visible record. If the deposit block showed the actual ledger — `2,500 · Cash · Ahmed · 14:32` — would you still want the 3px progress bar?
5. Reception's real interface is WhatsApp. The *list row* already has three copy-message actions this page lacks. Is the booking page a record to look at, or the place to compose the next message to this guest? `booking-page-update.md` §3 answers "the latter"; the shipped code answers "the former".
