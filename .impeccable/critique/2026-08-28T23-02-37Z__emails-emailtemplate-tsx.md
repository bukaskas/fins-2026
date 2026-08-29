---
target: emailTemplate
total_score: 12
max_score: 40
na_heuristics: 
p0_count: 3
p1_count: 3
timestamp: 2026-08-28T23-02-37Z
slug: emails-emailtemplate-tsx
---
Method: dual-agent (A: design review, isolated · B: detector + browser evidence, isolated)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | States the *wrong* status. `booking.actions.ts:148` sends this email only when `!goToPayment` — i.e. `BookingStatus.PENDING` (`:134-136`) — yet the template says "confirmed". No reference number, no "next step by when". |
| 2 | Match System / Real World | 2 | Copy voice is warm and human, but `date.toDateString()` yields `"Sat Sep 05 2026"` while the same date is formatted "Saturday, 5 September" elsewhere. Currency is "EGP" on `:88` and "LE" on `:101`. |
| 3 | User Control and Freedom | 1 | No cancel, no reschedule, no change-party-size, no "not you?". The only escape hatch is an Instagram DM. |
| 4 | Consistency and Standards | 1 | Seven of eight siblings use a WhatsApp button; this one uses Instagram. `Hello {username},` is guarded in `fullyBookedEmail.tsx:33` and `bulkEmail.tsx:34`, unguarded here (`:149`). Site says "Children · 5–8 years"; email says "Kids". |
| 5 | Error Prevention | 1 | No guard against undefined `username`, unmapped `bookingType`, absent `bookingDateISO`, or line items that don't sum to the stated total. |
| 6 | Recognition Rather Than Recall | 2 | Day-use restates date/price/hours/inclusions well. Kitesurfing and restaurant restate only the date — no party size, no time, no address, no reference to quote back. `LOCATION_ADDRESS` exists in constants, used by zero templates. |
| 7 | Flexibility and Efficiency | 1 | No `.ics`, no Add-to-Calendar, no map link, no Wallet pass. For a *dated* booking this is the single highest-value missing element. |
| 8 | Aesthetic and Minimalist Design | 1 | Absence of design, not restraint: five identical hairlines in ~200px, two lists collapsed to run-on prose, an invisible sign-off, zero brand assets. |
| 9 | Error Recovery | 1 | `verifyEmail.tsx:57` and `passwordResetEmail.tsx:56` both carry an "if you didn't request this" line. A confirmation for a booking you didn't make (mistyped email) offers only an unsignposted Instagram link. |
| 10 | Help and Documentation | 1 | One Instagram DM link. No phone (`WHATSAPP_PHONE` exists, unused here), no address, no directions, no arrival instructions. |
| **Total** | | **12/40** | **Poor — major UX overhaul required** |

No heuristic scored `n/a`; all ten apply to a transactional email.

## Design Specificity Verdict

**LLM assessment: category-interchangeable. Not "mostly" — literally.** Swap `serviceContent` for dentist appointments and the file needs zero other edits. This is the React Email starter with the copy swapped, and the fingerprints are unmistakable:

- `max-w-[465px]` (`:145`) — the starter's exact container width, verbatim in all eight templates.
- `text-2xl font-normal text-center p-0 my-8 mx-0` (`:146`) — the starter's heading class string, character for character, in six sibling files.
- `bg-[#1a1614]` (`:161`) — a warm near-black that exists **nowhere** in this product. Not in `MASTER.md`, not in `globals.css`.

Distance from the incumbent system is total. `MASTER.md` specifies base `#E3EBF3`, primary `#0EA5E9`, foreground `#22303F`, Raleway 400–600, radii 10/16/24px. The rendered email emits: no background color at all, `#1a1614` primary, `rgb(106,114,130)` grey text, `border-radius:0.375rem`, and `ui-sans-serif, system-ui, sans-serif` with Raleway nowhere in it. `@react-email/font` is installed and unused in every template.

The guest's actual sequence: a soft blue-grey neumorphic booking form with a live rate-badged price card → **a white 465px starter email in a system font sharing not one token with what they just used.** The handoff reads as a different company.

The missed opportunity is the painful part, because the good design already exists in this repo. `app/(root)/day-use/booking/page.tsx:110–142` renders a rate card with a coloured status dot, a "Standard rate · 5 Sep" eyebrow, `Adult` / `Child · 5–8 years` rows, and "Children under 5 join free — no ticket needed." The email discards all of it and prints `Kids: 1 × 600 EGP` — no age bracket, no rate label, no under-5 note. It even computes `breakdown.rateType` (`:73`) and never uses it.

**Deterministic scan: 0 findings, and that is itself the finding.** `detect.mjs --json emails/emailTemplate.tsx` → `[]`, exit 0. Same across `emails/`. The CLI detector runs 47 rules statically against `.tsx` source and does not resolve Tailwind classes to computed colors. Run against the *rendered HTML* in a browser, the same detector found 4 anti-patterns — including `low-contrast: 1.0:1 (need 4.5:1) — text #ffffff on #ffffff`. The clean CLI result reflects the scanner's blindness to Tailwind→computed-style resolution, not a clean bill of health.

**Browser overlay: injection succeeded**, but on a fallback static server (`python3 -m http.server`), not the skill's live-server — `live-server.mjs` is a variant-mode server with no generic static route and returned 404 for the rendered files. The tab has since been closed and both servers stopped, so **no user-visible overlay is currently live in your browser.** Console output on the rendered kitesurfing permutation:

```
[impeccable] 4 anti-patterns found
  tight-leading — line-height 0.06x   [div, isHidden:true]   ← FALSE POSITIVE
  tight-leading — line-height 0.06x   [div, isHidden:true]   ← FALSE POSITIVE
  low-contrast — 1.0:1 (need 4.5:1) — text #ffffff on #ffffff   [p]   ← REAL
  flat-type-hierarchy — Sizes: 14px, 16px, 24px (ratio 1.7:1)   [body]   ← REAL
```

The two `tight-leading` hits are React Email's hidden `<Preview>` preheader (`line-height:1px; opacity:0; max-height:0`) — a deliberate, standard technique on never-visible content. Discount them.

**Where the two assessments converged:** both independently computed the sign-off at 1.0:1 and both independently verified that `{"\n"}` collapses. That is the strongest evidence in this report.

**Mobile at a true 375px was not verified** — `resize_window` reported success but `window.innerWidth` read back 500. Compensating fact: the rendered HTML contains **zero `@media` queries and zero `<style>` tags**; every rule is inline with a hard `max-width:465px`. There is no responsive behavior to test.

## Overall Impression

This email is not under-designed. It is **factually wrong**, and that outranks everything aesthetic.

It tells guests their booking is "confirmed" when the database row says `PENDING`. It can print a price that contradicts its own arithmetic four lines above. It ends on white text on a white background. Two of its blocks — the ones carrying contractual house rules — render as unreadable run-on sentences. Every one of these was reproduced in rendered output, not inferred.

The biggest opportunity is not a redesign. It is **making the email tell the truth**, then giving it the brand and the arrival-day utility it currently has none of. Fix the four factual defects and this goes from a liability to merely plain. Then make it look like Fins.

## What's Working

1. **The day-use copy voice is genuinely good — and it's the only place the brand exists.** "Thanks for reaching out!", "If your account is private, a screenshot works just fine", "This helps us keep our community the way we love it" (`:38`, `:123–128`). This is a real human at a real beach club. Crucially, the day-use heading says **"We've received your day-use request!"** rather than "confirmed" — it is the one variant that tells the truth about the underlying `PENDING` state. Whoever wrote that line understood the system; the other two variants didn't get the memo.

2. **Zero images means zero image-blocking failure.** Gmail's default blocking, Outlook's blocked-content bar, and slow Sokhna 3G all leave this email fully functional. Largest render is 8.5KB raw — about 8% of Gmail's ~102KB clip threshold. The plaintext export is coherent end to end. That robustness is real; it's just being paid for with the entire visual identity rather than chosen as a strategy.

3. **The price breakdown structure is the right idea.** Showing `2 × 1,500 EGP = 3,000 EGP` then a total is exactly how you pre-empt a "why am I being charged this?" WhatsApp message. Every problem with it is in the sourcing of the numbers, not the concept.

## Priority Issues

### [P0] The email says "confirmed" for bookings the system has flagged PENDING

**What.** Verified in source: `booking.actions.ts:134-136` sets `goToPayment ? WAITING_PAYMENT : PENDING`, and `:148` gates `sendBookingEmail` behind `if (!goToPayment)`. This email fires **only** on `PENDING`. Yet `emailTemplate.tsx:32` says *"Your kitesurfing booking is confirmed!"* and `:42` says *"Your restaurant reservation is confirmed!"*. Only the day-use branch (`:37`) tells the truth.

**Why it matters.** A guest drives from Cairo to Sokhna on a "confirmed" reservation the club never accepted. The "View your booking" button lands them on `/bookings/[id]`, which renders a **Pending** status chip — the email contradicts its own destination page. This is a refund, a review, and a gate argument.

**Fix.** Change the two headings to match the PENDING truth ("We've received your kitesurfing booking request"). Reserve "confirmed" for a separate email fired on the `PENDING → CONFIRMED` transition — which currently sends no email at all. Better: pass `bookingStatus` into the template and key the heading off it, so the email can never outrun the row.

**Suggested command:** `/impeccable clarify`

### [P0] Wrong price in the fallback, and line items that don't sum to the total

**What.** Two distinct defects in `DayUseDetails`.

(a) When `totalPriceCents` is undefined, `:101` prints a hardcoded **`💰 1,500 LE / per person`**. Wrong on holiday dates (`lib/pricing.ts` → 1,600), wrong on discounted dates (1,125), wrong for children (600). Reproduced: a 3-adult + 2-child holiday booking renders "1,500 LE / per person" — the guest computes 7,500 EGP against a real total of 6,200 EGP, and the two children vanish from the email entirely. It also introduces "LE" as a second currency notation 13 lines below "EGP".

(b) Line items are **recomputed** (`:73`, from `bookingDateISO`) while the total is the **passed prop** (`:97`). `bookingDateISO` is optional (`:19`) and falls back to `new Date()` (`:72`). Reproduced: with `bookingDateISO` omitted on a holiday booking, the email prints `Adults: 2 × 1,500 EGP = 3,000 EGP` followed by `Total: 3,200 EGP`. **The email's own arithmetic contradicts itself.**

**Why it matters.** A transactional email stating a wrong price is a chargeback and a gate argument. In a price-sensitive market, a self-contradicting invoice makes Fins look incompetent or dishonest.

**Fix.** Never compute prices in the template. Have the action return the full `PriceBreakdown` and pass `adultUnitCents`, `kidsUnitCents`, `adultTotalCents`, `kidsTotalCents`, `totalCents`, and `rateType` as props. Delete the `calculateDayUsePrice` import at `:14`. Delete the `1,500 LE` fallback entirely — render nothing rather than a guess.

**Suggested command:** `/impeccable harden`

### [P0] The sign-off is white text on a white background

**What.** `:177` — `className="text-start text-sm text-white"`. Rendered: `color:rgb(255,255,255)` on a `<body style="margin:0">` with **no `background-color` declared anywhere** in the document (the only two background declarations in the entire render are on the two buttons). Contrast **1.00:1**, computed manually and independently confirmed by the browser detector. A zoomed screenshot of that region is pure white with zero visible text. Copied verbatim into `registrationEmail.tsx:46`, so it's broken in two shipped templates.

**Why it matters.** Peak-end rule: the email's final impression is a blank gap after a paragraph about being socially vetted. In dark-mode clients it inverts and becomes the *only* fully legible element — so the bug is invisible to anyone testing in dark mode. It's also a classic hidden-text spam signal.

**Fix.** Delete `text-white` from `emailTemplate.tsx:177` and `registrationEmail.tsx:46`. Set explicit `bg-white` on `<Body>` and explicit `text-[#22303F]` (the `MASTER.md` foreground) so nothing inherits an undeclared color.

**Suggested command:** `/impeccable polish`

### [P1] Two lists render as run-on sentences; every size and space breaks in Outlook desktop

**What.** (a) `{"\n"}` at `:109` and `:117` emits a literal newline inside a `<p>` with no `white-space` rule. Raw render:

```
<p style="font-size:0.875rem;line-height:1.625;...">• Beach entrance<!-- -->
<!-- -->• Swimming pool<!-- -->...
```

HTML collapses it. Browser-confirmed: **"• Beach entrance • Swimming pool • Showers & lounges • Lockers (no rooms available)"** flows as one paragraph. Neither list is a list. The same bug destroys the seven-slot event schedule in `pharaohEmail.tsx:63–71`.

(b) Every size and space emits as `rem` (`font-size:0.875rem`, `padding:1.25rem`, `margin-bottom:2.5rem`), which the Outlook Word engine ignores, while the font stack leads with `ui-sans-serif, system-ui`, which it can't parse. Outlook desktop gets a **serif email at default size with no container padding.**

**Why it matters.** House Rules are contractual — "Mixed groups & families only" can get a group turned away at the gate — delivered as an unscannable 60-word sentence. Outlook is heavily used by the corporate Cairo segment booking company beach days.

**Fix.** Replace each `{"\n"}` run with one `<Text className="text-sm m-0">` per bullet, max 4 per group; split House Rules into "Please leave at home" (pets, icebox, speakers, outside food) and a separately weighted admissions note. Wrap in `<Tailwind config={{ presets: [pixelBasedPreset] }}` — the preset ships in the installed `@react-email/tailwind@2.0.3` — and add `<Font fallbackFontFamily="Arial">` so Raleway loads where supported and Arial catches Outlook.

**Suggested command:** `/impeccable layout`

### [P1] Subject line is wrong, identical for every booking, and identical to the signup email

**What.** `index.tsx:38` — `` subject: `Welcome to ${APP_NAME}!` `` → "Welcome to Fins kitesurfing center!" for a day-use beach request, a restaurant table, and a kitesurf course alike. **Byte-identical** to `sendRegistrationEmail`'s subject (`index.tsx:127`). Sender is a bare `info@finskitesurfing.com` with no display name; no `reply_to` is set on any send, while `pharaohEmail.tsx:77` promises "just reply to this email." Preview text (`:137`) then wastes the recovery slot by repeating the H1 verbatim — and with `username` undefined renders **`Your kitesurfing booking is confirmed! — undefined`** in the inbox row (reproduced).

**Why it matters.** Gmail threads identical subjects: the confirmation collapses under the welcome email and every repeat booking stacks into one thread. A guest searching "day use" or "5 September" finds nothing. It reads as marketing, so it gets archived or reported — and spam reports on a transactional stream damage deliverability for *all* Fins mail.

**Fix.** `subject: \`Day-use request received — ${formatted}\`` using the `en-GB` weekday/day/month format already used at `booking.actions.ts:173`. Set `from: 'Fins Kitesurfing <info@finskitesurfing.com>'` and `reply_to`. Rewrite preview text to carry what the subject can't: `"Saturday 5 September · 2 adults, 1 child · 3,600 EGP · we'll confirm within 24h"`.

**Suggested command:** `/impeccable clarify`

### [P1] Unmapped `bookingType` silently sends a kitesurfing confirmation

**What.** `service` is validated as `z.string().min(1)` — any string passes. `:135` falls back to `defaultContent = serviceContent["kitesurfing-course"]`. Reproduced: `bookingType: "corporate"` renders *"Your kitesurfing booking is confirmed!"* with wind-forecast copy.

**Correction to Assessment A, which filed this as P0:** I traced `createCorporateBooking` (`booking.actions.ts:1602–1621`) and it does **not** call `sendBookingEmail`. No live service value currently reaches this template unmapped, so nothing is misfiring today. This is a loaded trap for the next service added, not an active fault — P1, not P0.

**Why it matters.** Add one service (SUP session, kids camp, corporate day that does email) and every guest silently receives a confirmation for a **different product**. No error, no log, no symptom until a customer replies confused.

**Fix.** Make the fallback service-agnostic — heading "We've received your booking request", body without the wind copy — and `console.error` on an unmapped `bookingType`. Ideally promote `service` to a Zod enum.

**Suggested command:** `/impeccable harden`

## Persona Red Flags

*Selected Riley, Sam, and Casey: Riley because eight rendered prop permutations produced four distinct factual failures; Sam because the sign-off is literally invisible and the document has one heading for eight sections; Casey because a Sokhna day-use guest opens this one-handed on a phone with a run-on rulebook and 36.8px tap targets.*

**Riley (Deliberate Stress Tester)** — 4 reproduced failures:
- `username` undefined → `:149` renders **`Hello ,`** (raw: `Hello<!-- -->,`) and the inbox preview reads **`— undefined`**. `fullyBookedEmail.tsx:33` and `bulkEmail.tsx:34` both guard this; this file doesn't.
- `bookingDateISO` omitted → self-contradicting invoice: `Adults: 2 × 1,500 EGP = 3,000 EGP` above `Total: 3,200 EGP`.
- `numberOfPeople: 0, numberOfKids: 2` → `hasBreakdown` is false (`:63–66`), so the email states `💰 1,500 LE / per person` to a party of two children whose rate is 600.
- **Arabic names work — with one papercut.** `محمد عبد الرحمن السيد` renders correctly, no mojibake. But `<Html dir="ltr">` plus `text-align:start` (`:149`) resolves the greeting LTR, putting the comma on the wrong visual side of the name. Nothing detects an RTL name to flip `dir`. Permanent small papercut for a majority-Egyptian audience.

**Sam (Accessibility-Dependent)**:
- `:177` — **1.0:1**. Sighted users see nothing; a screen reader announces "Cheers, The Fins Team" from a blank region. Worst of both.
- The rendered document has exactly **one `<h1>` and zero other headings**. The six section labels — `💰 Price breakdown:`, `⏰`, `✅ Includes:`, `🚫 House Rules:` (`:85, :103, :107, :115`) — are all `<p style="font-weight:600">`. Heading navigation gives one landmark for an eight-section document. The detector's `flat-type-hierarchy` finding (14/16/24px, 1.7:1) is the mechanical shadow of the same problem.
- **Emoji is the only iconography, and it carries semantic load** — 🚫 is the sole signal that the following text is prohibitive. Screen readers announce "prohibited sign House Rules". On older Windows Outlook builds, 🤍 (U+1F90D, Emoji 12.0) predates the installed Segoe UI Emoji and renders as tofu, killing the one warm note in the vetting paragraph.
- Secondary button border `rgb(209,213,220)` on white = **2.40:1**, failing WCAG 1.4.11's 3:1 for non-text UI boundaries. That border is the button's only affordance.
- The price breakdown is four sibling `<p>`s, not a semantic table — no row/column relationships for a guest checking their charges.

**Casey (Distracted Mobile User)**:
- Both buttons compute to **36.8px** tall (`padding:10px` + `line-height:120%` on 14px, verified in rendered CSS) — below the 44pt floor, centered, stacked 16px apart. A mis-tap on the Cairo–Sokhna drive opens Instagram instead of the booking status page.
- The House Rules "list" is one 60-word run-on line at 14px. The five constraints that determine whether Casey gets through the gate cannot be skimmed one-handed.
- **No `.ics`, no Add-to-Calendar, no map link.** `LOCATION_ADDRESS` — a full Maps pin for FINS KITESURFING CENTER — sits in `lib/constants/index.ts:21` and is used by **zero** templates.
- The primary CTA is `https://ig.me/m/finskitesurfing`. Tapped without the Instagram app, or logged out, it dumps Casey on a login wall — a dead end from a booking confirmation. Every other template uses `wa.me`, and `staffNotificationEmail.tsx:50` has staff contacting this very customer on **WhatsApp**. Two channels, opposite directions.

## Minor Observations

- `serviceContent["pharaoh-airstyle"]` (`:46–50`) is **dead code** — `index.tsx:23` intercepts that type and returns before `BookingEmail` is constructed. Forty-five words of unreachable copy a future editor will update and wonder why nothing changed.
- No `PreviewProps` export. `verifyEmail.tsx:73` and `passwordResetEmail.tsx:73` both have one. Without it, `npm run email` renders this template in its all-undefined broken state — which is precisely why the `Hello ,` and `1,500 LE` bugs survived. **The broken state is the default state a developer sees.**
- `cta` is `"Message us on Instagram"` in all four `serviceContent` entries — a per-service field where every service has the same value.
- `fmt` (`:77`) duplicates the exported `formatEGP` in `lib/pricing.ts:74`, and `staffNotificationEmail.tsx:41` duplicates it a third time. Three copies of one currency formatter.
- `⏰ 9:00 AM – 11:00 PM` (`:103`) is hardcoded with no seasonal or day-of-week variation, no timezone — and sits *inside* the price group with no rule before it, so operating hours visually belong to the invoice.
- Five `<Hr className="my-4 border-gray-200" />` (`:81, :105, :113, :121`) give price, hours, inclusions, prohibitions, and the vetting warning identical separator weight. Five peers, no ranking.
- No footer at all: no postal address, no phone, no preference link. Transactional mail doesn't need unsubscribe, but an address and phone materially help both deliverability and gate-day panic.
- `text-align:start` (`:149, :150, :177`) is unsupported by the Outlook Word engine — harmless (falls back to left), but it's a logical property leaking into a medium with no concept of one.
- `:74–75` has a misaligned assignment (`const kidsPrice  =`) and `:62`/`:133` run to 140+ columns while the rest of the directory wraps — the tell that this section was hand-patched rather than designed.

## Questions to Consider

1. **Why is this called a confirmation email when nothing is confirmed?** The `PENDING → CONFIRMED` transition is the moment the guest actually cares about, and Fins currently sends **no email at all** for it. What if this template were renamed to what it is — a *request receipt* — and the effort went into the confirmation email that doesn't yet exist?

2. **The form already requires the guest's Instagram handle** (`app/(root)/day-use/booking/page.tsx:40` — `"Instagram account is required"`). **So why does the email ask for it again?** If the vetting paragraph is live policy it deserves to be the most prominent block, not the greyest. If it's a fossil from before the field existed, deleting it removes the single biggest emotional valley in the experience at zero cost.

3. **What is the one thing a guest does with this email on the day they arrive?** Right now: show it to a gate attendant on a phone. What if the email were designed around *that* moment — name, party size, date, a QR or reference, a map pin — with price and policy demoted below it?

4. **The booking form renders a rate card with a coloured rate badge, age brackets, and "Children under 5 join free." The email renders none of it. Why is the email allowed to be a different product?** What if it imported the *same* breakdown structure the form uses, so the two could never drift?

5. **Seven of eight templates put the customer on WhatsApp. This one uses Instagram. The staff email tells staff to WhatsApp the customer.** Which channel is Fins actually on? Picking one — and making every email and staff instruction agree — is a one-line change with more impact on reply rate than any visual work here.

6. **This is the only Fins surface that lands in someone's pocket unprompted, days after they've forgotten the site — and it's the only one carrying no brand at all.** What is the cheapest version of this email a guest would recognise as Fins with the logo cropped off?
