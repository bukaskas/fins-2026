# `/bookings/[id]` — Update Plan

**Date:** 2026-08-29
**Scope:** `app/(root)/bookings/[id]/page.tsx` and its client components.
**Design reference:** `.claude/design-system/pages/bookings.md` (warm-paper override; it
supersedes `MASTER.md` for everything under `/bookings`).

Two features:

1. **Edit the booking in place** — staff never leave `/bookings/[id]`.
2. **Copy message for the guest** — one button that produces the message reception sends,
   plus the answers reception has to give over the phone.

---

## 1. Where the page stands today

| Already inline (no navigation) | Component |
|---|---|
| Status change | `StatusEditDialog.tsx` |
| Adults / kids (with live price preview) | `PartyEditDialog.tsx` |
| Record a deposit | `components/bookings/PayDepositDialog.tsx` |
| Create / copy / re-check payment link | `PaymentLinkCard.tsx` |

| Still forces a page change | Where |
|---|---|
| Name, email, phone, Instagram | `/bookings/[id]/edit` |
| Date, time, service, instructor | `/bookings/[id]/edit` |
| Agent assignment | `/bookings/[id]/edit` |
| Amount paid (raw override) | `/bookings/[id]/edit` |
| Delete booking | `/bookings/[id]/edit` |

The "Edit booking" pill at `page.tsx:462` is a `<Link>` to that route. `BookingEditForm.tsx`
(491 lines) renders a full-screen card with a hero photo — heavy for changing a phone number,
and `router.back()` on save means the detail page re-renders from a stale bfcache entry often
enough to be noticed.

**Nothing exists for guest messaging.** Reception currently retypes the same WhatsApp text, or
copies it out of `emails/emailTemplate.tsx` mentally. The only prefilled message in the codebase
is the one-liner in `components/reception/ContactActions.tsx:57`.

---

## 2. Feature A — inline editing

### 2.1 Approach

Add **`BookingEditSheet.tsx`** in `app/(root)/bookings/[id]/`, a client component using the
existing `components/ui/sheet.tsx` (`side="bottom"` under `sm`, `side="right"` from `sm` up).
Precedent already in the repo: `components/bookings/LessonBookingEditSheet.tsx`.

The "Edit booking" pill becomes a `<button>` that opens the sheet. `page.tsx` stays a server
component; it passes plain serialisable props (booking fields, `instructors`, `agents`).

Keep the existing per-field dialogs. They are better than a form row for what they do (status
list with tone dots, party stepper with price preview, deposit with payment method). The sheet
owns only the fields that have no inline affordance yet.

Rejected alternatives:

- *Click-to-edit on every field.* Six more dialogs, six more save paths, no dirty-state guard.
- *Reuse `BookingEditForm` inside the sheet.* Its layout (hero image, `Card`, `md:w-1/2`) fights
  the sheet, and its two-call save has the atomicity bug described in 2.3.

### 2.2 Fields in the sheet

| Field | Control | Notes |
|---|---|---|
| Name | `Input` | `min(2)` |
| Phone | `PhoneInput` (`defaultCountry="EG"`) | `phoneSchema` demands a country code |
| Email | `Input type=email` | nullable — empty string → `null` |
| Instagram | `Input` | **new** — column exists, no UI writes it today (see 2.3) |
| Date | `Calendar` in `Popover` | keep the existing `Date.UTC(y,m,d)` normalisation |
| Time | `Select` | same option list as `BookingEditForm` |
| Service | `Select` | 4 services |
| Instructor | `Select` | only when service is `kitesurfing-course`; cleared otherwise |
| Agent | `Select` | "Unassigned" → `null` |
| — | — | **Amount paid is deliberately absent.** See 2.4. |

Footer: `Delete` (left, red, `confirm` on the guest name — same guard as
`BookingEditForm.tsx:451`) · `Cancel` · `Save`.

Behaviour:

- Prefill from props; reset to props on every open (the `useEffect(..., [open])` pattern from
  `PartyEditDialog.tsx:129`).
- Disable Save while clean; disable every control while pending.
- Warn on close with unsaved changes (`onOpenChange` intercept), matching how the delete
  `confirm()` already blocks accidental loss.
- On success: `toast.success("Booking updated")` → `router.refresh()` → close. No navigation,
  so the status pill, next-step card and totals all re-render with the new values.
- On failure: keep the sheet open, show the server `message`, do not clear the form.

Live price line at the bottom of the sheet when service is `day-use` or `pharaoh-airstyle`:
`computeBookingTotalCents(service, date, adults, kids)` — same call `PartyEditDialog` makes.
Changing the **date** can move a day-use booking between standard / holiday / discounted rates
(`lib/pricing.ts:16`), so the guest's total silently changes. The preview must show
`old → new` when they differ, so reception sees it before saving.

### 2.3 Server change: one atomic action

`BookingEditForm` currently fires `updateBooking` and `assignBookingAgent` in a
`Promise.all` — two writes, two `revalidatePath`s, and if the second rejects the UI still shows
the first one's error path. `updateBookingSchema` also has no `instagram`, so the field is
write-only from the public booking form.

Extend rather than add a parallel path:

```ts
// lib/validators.ts — updateBookingSchema
instagram: z.string().trim().nullable().default(null),
agentId:   z.string().uuid().nullable().default(null),
```

```ts
// lib/actions/booking.actions.ts — updateBooking()
data: { …existing, instagram: v.instagram, agentId: v.agentId }
```

One `prisma.booking.update`, one revalidate. `assignBookingAgent` stays (the bookings list uses
it standalone) and `BookingEditForm` keeps working — the two new fields default, so its existing
payload still parses.

`revalidatePath('/bookings', 'layout')` already covers `/bookings/[id]`; no extra call needed.

### 2.4 Two correctness issues to fix while in here

**a. RECEPTION staff see the guest view.**
`page.tsx:29` hardcodes `STAFF_ROLES = [ADMIN, STAFF, OWNER]`, but
`lib/permissions.ts:13` grants `bookings:manage` to `["ADMIN","OWNER","STAFF","RECEPTION"]`.
A reception user gets the read-only page while the server would happily accept their writes —
and reception is exactly who this feature is for. Replace the local array with
`roleHasCapability(role, "bookings:manage")`.

**b. `amountPaidCents` has two writers that disagree.**
Deposits go through `payBookingDeposit`, which inserts a `BookingPayment` row and sets
`amountPaidCents` to the **aggregate** of those rows. `updateBooking` and
`updateBookingAmountPaid` set the column directly. So a manual override survives only until the
next `payBookingDeposit` or `deleteDepositPayment`, both of which re-aggregate and wipe it
(`booking.actions.ts:960`). Keeping the raw field out of the new sheet means the drift can't be
introduced from the page reception uses all day. If a correction path is genuinely needed, it
belongs in `PayDepositDialog` as a negative/adjusting `BookingPayment`, not as a column write.

Out of scope but worth recording: changing date or service does not re-check `ClosedDate` or the
`DAILY_CAPACITY = 80` ceiling that `createBooking` enforces. A non-blocking warning in the sheet
("12 Sep already has 78 confirmed people") is a follow-up, not part of this change.

### 2.5 What happens to `/bookings/[id]/edit`

Keep it. It is a valid deep link and the fallback if the sheet misbehaves on an old phone.
Once the sheet has been in use for a while, `BookingEditForm.tsx` and its route can be deleted —
track that separately rather than doing it in the same commit.

---

## 3. Feature B — "Copy message for the guest"

### 3.1 What reception actually needs

Two different things, both currently living in people's heads:

- **Send** — a ready message to paste into WhatsApp / Instagram DM, already filled with this
  guest's name, date, party, price and payment link.
- **Say** — the answers to the questions that come back thirty seconds later: what's included,
  what the rules are, can they bring the dog, what time can they arrive.

One dialog, two tabs. Trigger: a `MessageCircle` pill labelled **"Message guest"** sitting next
to "Edit booking" in the staff action row.

### 3.2 `lib/guest-messages.ts` — one source of truth

Plain module, no `"use server"`, importable from client components and from `emails/`.

```ts
export type GuestMessageId =
  | "request-received" | "instagram-check" | "payment-instructions"
  | "confirmed-day-use" | "confirmed-kitesurfing" | "directions"
  | "house-rules" | "balance-on-arrival" | "day-before-reminder"
  | "fully-booked" | "custom";

export type GuestMessageContext = {
  name: string; service: string; date: Date; time: string | null;
  adults: number; kids: number;
  totalCents: number | null; paidCents: number;
  paymentLink: string | null; bookingUrl: string;
  paymentDeadline: Date | null;
};

export function buildGuestMessage(id: GuestMessageId, ctx: GuestMessageContext): string;
export function defaultMessageFor(status: BookingStatus, service: string): GuestMessageId;
export const RECEPTION_FAQ: { question: string; answer: string; appliesTo?: string[] }[];
```

Every fact these templates state already exists somewhere in the codebase — the module
consolidates, it does not invent:

| Fact | Current home |
|---|---|
| Day-use hours 9:00 AM – 11:00 PM | `emails/emailTemplate.tsx:105`, `app/(root)/day-use/page.tsx:148` |
| Includes: beach entrance, pool, showers & lounges, lockers (no rooms) | `emails/emailTemplate.tsx:110` |
| House rules: no pets, no icebox, no speakers, no outside food/drink, mixed groups & families only | `emails/emailTemplate.tsx:117` |
| Price breakdown, adult / kid unit prices, holiday & discount rates | `lib/pricing.ts` |
| Bank: Arab African International Bank · Fins Kite Surfing · 1105202510010201 | `NextStepCard.tsx:13` |
| WhatsApp `+201222144388`, Instagram `@finskitesurfing` | `NextStepCard.tsx:11`, `lib/constants/index.ts:8` |
| Google Maps link | `LOCATION_ADDRESS`, `lib/constants/index.ts:21` |
| 24h payment window | `WAITING_PAYMENT_WINDOW_MS`, `booking.actions.ts:36` |
| Social-account check wording | `emails/emailTemplate.tsx:124` |
| Kitesurfing "we confirm the time a day before, weather depending" | `emails/emailTemplate.tsx:33` |

Move the bank constants out of `NextStepCard.tsx` into `lib/constants/index.ts` so the card and
the messages read the same values.

### 3.3 Template catalogue

| Id | Reception uses it when | Contains |
|---|---|---|
| `request-received` | PENDING | Thanks, request logged for {date}, we reply shortly, booking link |
| `instagram-check` | REQUEST_SENT / UNDER_REVIEW | Asks for the social handle, screenshot fine if private, explains why |
| `payment-instructions` | WAITING_PAYMENT | Amount due, payment link **or** bank details, deadline as a real date/time |
| `confirmed-day-use` | CONFIRMED · day-use | Date, party, total, hours, includes, rules, maps link, balance on arrival |
| `confirmed-kitesurfing` | CONFIRMED · kitesurfing | Date, exact time confirmed a day before, what to bring, maps link |
| `directions` | any | Maps link + landmark line, "call this number at the gate" |
| `house-rules` | any | Rules block on its own — the most-asked follow-up |
| `balance-on-arrival` | CONFIRMED with balance > 0 | Paid X of Y, Z due on arrival, accepted methods |
| `day-before-reminder` | CONFIRMED, date is tomorrow | Short nudge + arrival time + rules one-liner |
| `fully-booked` | DECLINED | Mirrors `emails/fullyBookedEmail.tsx` so email and WhatsApp say the same thing |

`defaultMessageFor(status, service)` preselects one so the common case is *open → copy*, two
taps. Formatting is WhatsApp-flavoured plain text (`*bold*`, `•` bullets, real line breaks) —
no markdown that pastes badly.

### 3.4 Dialog UI — `GuestMessageDialog.tsx`

Same Radix sheet surface as `PartyEditDialog` / `StatusEditDialog` (`#FDFBF7 → #F4EFE6`
gradient, `rounded-[28px]`, radial wash) so it doesn't read as a foreign component.

**Send tab**
- Left / top: template list, the default one preselected and marked.
- Below: the rendered message in an **editable** `textarea` — reception edits before sending far
  more often than not, and a read-only preview would push them back to WhatsApp to fix it.
- Actions: **Copy** · **Open WhatsApp** (`wa.me/<digits>?text=<encoded>`, the *edited* text) ·
  **Copy for email** when `booking.email` exists.
- Language toggle **EN / AR**. Ship EN first, with `RECEPTION_FAQ` and templates keyed by
  locale so Arabic drops in without a rewrite. Arabic copy needs a native pass — see §6.

**Say tab**
- `RECEPTION_FAQ` as an accordion (`components/ui/accordion.tsx` is present), filtered to the
  booking's service. Question in Raleway 600, answer in `#6b6460`, tap-to-expand, ≥40px rows —
  readable one-handed while on the phone.
- Seed questions: what's included · house rules · kids' price and age · pool and lagoon ·
  pets · outside food · arrival and last entry time · payment methods · deposit and refund ·
  parking · what to bring · lockers and changing · wind/weather for kitesurfing.

### 3.5 Contact logging

`logBookingContact(bookingId, WHATSAPP | EMAIL | OTHER, ATTEMPTED)` already exists
(`booking.actions.ts:1851`) and the reception dashboard reads those rows. Fire it when **Open
WhatsApp** is used; fire it on **Copy** only behind a small "log this contact" checkbox
(defaulting on) — a copy is not proof a message was sent, and silently inflating the contact
history would make the reception queue lie.

### 3.6 Two small shared helpers

- **`lib/phone.ts`** — `toDigits`, `toWhatsAppDigits` (the `0…` → `20…` fix currently living in
  `ContactActions.tsx:34`), `toTelHref`. `page.tsx:59` has its own `digits()`; the two should not
  drift.
- **`useCopyToClipboard`** — `navigator.clipboard` needs a secure context, and the existing
  `CopyButton` just toasts "couldn't copy" when it isn't there. Add a hidden-textarea +
  `execCommand` fallback and select-the-text-for-manual-copy as the last resort. Reception on an
  old Android over http would otherwise be stuck.

---

## 4. Files

**New**
```
app/(root)/bookings/[id]/BookingEditSheet.tsx
app/(root)/bookings/[id]/GuestMessageDialog.tsx
lib/guest-messages.ts
lib/phone.ts
```

**Changed**
```
app/(root)/bookings/[id]/page.tsx      staff-gate via capability; fetch instructors + agents;
                                       Edit link → sheet trigger; add Message guest pill
lib/validators.ts                      updateBookingSchema += instagram, agentId
lib/actions/booking.actions.ts         updateBooking writes both new fields
lib/constants/index.ts                 bank details, working hours, includes, house rules
app/(root)/bookings/[id]/NextStepCard.tsx   read bank details from constants
app/(root)/bookings/[id]/CopyButton.tsx     use the shared clipboard hook
```

**Untouched:** `PartyEditDialog`, `StatusEditDialog`, `PaymentLinkCard`, `PayDepositDialog`,
`/bookings/[id]/edit`.

---

## 5. Order of work

1. `lib/phone.ts` + clipboard hook — no UI change, unblocks both features.
2. Capability gate fix in `page.tsx` (one line, unblocks reception entirely).
3. `updateBookingSchema` + `updateBooking` extension; confirm `BookingEditForm` still saves.
4. `BookingEditSheet` — fields, dirty guard, delete, price-delta preview.
5. `lib/constants` consolidation + `lib/guest-messages.ts` (EN templates + FAQ).
6. `GuestMessageDialog` — Send tab, then Say tab.
7. Contact logging + WhatsApp deep link.
8. Arabic templates once the EN copy is signed off.

Steps 1–4 and 5–7 are independent; either can ship first.

---

## 6. Needs a decision before the copy is final

The templates state things to guests, so these have to be confirmed rather than guessed:

1. **Cancellation / refund policy** — nothing in the codebase states one. Reception is asked this
   constantly. Without it, `balance-on-arrival` and `payment-instructions` stay silent on refunds.
2. **Kids' age range** — `BookingEditForm.tsx:236` labels the field "Kids (ages 5–8)", while
   pricing charges 50% for any kid. Which is the rule?
3. **Accepted payment methods on arrival** — cash only, or card / Instapay too?
4. **Last entry time** — hours are 9:00 AM – 11:00 PM; is there a cutoff after which a day-use
   guest is turned away?
5. **Arabic** — machine-translated templates are worse than none. Ship EN and add AR when someone
   can write it.
6. **Kitesurfing course details** — price and duration are not in `lib/pricing.ts`
   (`computeBookingTotalCents` returns `null` for that service), so no kitesurfing template can
   quote a price. Confirm whether it should.

---

## 7. Done when

**Editing**
- [ ] Name, phone, email, Instagram, date, time, service, instructor and agent all change from
      `/bookings/[id]` with no navigation; the page reflects them without a manual reload.
- [ ] One server round trip per save; a failed save leaves the form filled and open.
- [ ] Closing with unsaved changes warns; Save is disabled when nothing changed.
- [ ] Delete still confirms on the guest name and lands on `/bookings`.
- [ ] Changing a day-use date across a holiday/discount boundary shows `old → new` total.
- [ ] A `RECEPTION` user sees the staff view.
- [ ] `/bookings/[id]/edit` still works.

**Messaging**
- [ ] "Message guest" opens with the right template already selected for the booking's status.
- [ ] Copy puts the edited text on the clipboard, with a working fallback on an insecure origin.
- [ ] "Open WhatsApp" opens a chat with the correct international number and the text prefilled,
      for a `+20…` number and a legacy `01…` number alike.
- [ ] Every fact in every template matches the email templates and `lib/pricing.ts`.
- [ ] Contact logging appears on the reception dashboard and is not fired silently on copy.

**Design (per `pages/bookings.md`)**
- [ ] No horizontal scroll at 375px; the sheet is bottom-anchored on mobile.
- [ ] Tap targets ≥ 40px; sheet inputs 16px on mobile (no iOS zoom-on-focus).
- [ ] Secondary text uses `#6b6460`, never `#8a8480` / `#b0a89f` (those stay decorative).
      Note: the existing page violates this in several places — fix the new components, and
      correct the old ones opportunistically rather than as part of this work.
- [ ] Visible `focus-visible` ring on every new pill, row and control.
- [ ] Lucide icons only in the UI. Emoji is fine *inside* the copied message text — the email
      templates already use it and guests expect it on WhatsApp.
