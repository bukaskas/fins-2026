# Page Override: Day Use

> Overrides `MASTER.md` for `/day-use` and everything under it
> (`/day-use/booking`).
> Recorded 2026-08-29 during a critique pass on the booking form. This is a
> deliberate override, not drift — but note the conflict in "Standing tension"
> below, which is unresolved and needs a call from the owner.

## Why this page departs from MASTER

`MASTER.md`'s scope rule names `/day-use` as full-strength neumorphism on the
`#E3EBF3` clay base. The day-use landing page has never been built that way: it
is a deep-navy editorial page with sky accents, thin Raleway display type and
full-bleed photographic panels, and it is the strongest guest-facing surface on
the site.

The booking form used to be a third thing again — shadcn defaults plus warm
stone hexes borrowed from `pages/bookings.md`, which is the **staff** tool and
whose own scope statement excludes this route. A guest clicked a sky-blue
"Reserve Your Day" and landed on a near-black shadcn button. That break is what
this file exists to close.

The decision: **the landing page is the truth for this section.** The booking
form now carries the same palette, type and CTA treatment.

## Palette — navy ground, sky accent

| Role | Hex | Usage |
|------|-----|-------|
| Navy ground | `#0c1a2e` | Brand rail, all headings, primary text, CTA label |
| Sky accent | `#38bdf8` | Primary CTA fill, progress fill, focus ring, eyebrow text on navy |
| Page tint | `#f4f8fb` | Behind the form column and inside summary panels |
| Surface | `#ffffff` | Form cards, rate panel, policy block |
| Hairline | `#dbe3ec` | Borders, dividers, input outlines |
| Muted text | `#54657a` | All secondary text — **5.3:1 on white** |

**Secondary text is a navy-tinted slate, never a neutral grey.** `#54657a` is
the muted token. The warm stone values from `pages/bookings.md` (`#ece8e3`,
`#f5f2ef`, `#6b6460`, `#1a1614`) **must not appear on this route** — they belong
to the staff tool. `#a09890` is banned for text everywhere (2.9:1).

## Rate colours

Standard / Holiday / Discounted drive a dot and a tinted background; the label
always uses the darkened pair so it clears 4.5:1.

| Rate | Dot | Background | Label text |
|------|-----|------------|------------|
| Standard | `#0284c7` | `#f0f9ff` | `#0369a1` |
| Holiday | `#f59e0b` | `#fffbeb` | `#b45309` |
| Discounted | `#22c55e` | `#f0fdf4` | `#15803d` |

Standard deliberately uses the brand sky family rather than a generic blue — the
rate is a Fins concept, not a status badge. Never colour label text with the dot.

## Type

Raleway throughout (`--font-raleway`). One scale, no near-duplicates:

| Role | Size | Weight |
|------|------|--------|
| Rail display | `clamp(2rem, 6vw, 4rem)` | 100 / 800 paired |
| Total | `2.5rem` | 200, `tabular-nums`, `tracking-[-0.02em]` |
| Page heading (h1) | `1.5rem` | 600 |
| Field label / body emphasis | `0.9375rem` | 600 |
| Body | `0.875rem` | 400 |
| Secondary / help | `0.8125rem` | 400 |
| Eyebrow label | `0.7rem`, `tracking-[0.2em]`, uppercase | 700 |

**Floor is `0.8125rem` for body text and `0.7rem` for uppercase-tracked labels.**
Nothing smaller ships on this route — the previous `0.63rem` rate label was
below MASTER's own 12px floor.

The total is the largest element on the confirmation step. The price must never
get smaller as the guest gets closer to paying it.

## CTA

Primary action matches the landing page exactly: `background #38bdf8`,
`color #0c1a2e`, `rounded-full`, uppercase, `tracking-[0.2em]`, weight 700,
`min-h-12`. There is one primary action per step and it is full-width on this
surface.

## Controls and targets

- **Minimum 44px** on every interactive element (`min-h-11` / `size-11`).
  MASTER's 40px floor is treated as the absolute minimum, not the target.
- Guest counts use `−` / `+` steppers with a typeable, clamped field between
  them — not `input[type=number]` spinners, which are ~10px on a phone.
- Focus is a visible 2px sky ring (`#38bdf8`), never the default grey token.
- Inputs are `rounded-full` with a `#dbe3ec` outline.

## Rules this route learned the hard way

1. **No silent dead ends.** A control that blocks progress must say what is
   blocking and offer a way out. The house-policy checkbox states the policy,
   explains the consequence, and links WhatsApp for exceptions instead of just
   disabling the button.
2. **State the consequence before the commitment.** The step before Reserve
   says: no payment now, WhatsApp confirmation within 24 hours, payment link
   valid 24 hours. That last one is a real server behaviour
   (`waitingPaymentAt`) and guests must not meet it by surprise.
3. **Prices have one source.** Rates live in `lib/config/pricing.json` and are
   read by both the landing page's advertised figures and the form's
   calculation. The kids rate is half the adult rate for the same date
   (`kidsRateMultiplier`), computed once in `lib/pricing.ts` — a surface that
   derives or restates a figure produced a 600 vs 750 EGP contradiction between
   the ad and the checkout.
4. **The photograph is not decoration on mobile.** This route is reached by QR
   and Instagram link, so the brand rail stays visible at every breakpoint as a
   banner rather than being hidden below `md`.
5. **Never announce success with a machine string.** No ISO timestamps, no raw
   IDs in user-facing copy.

## Standing tension — needs a decision

`MASTER.md` still claims this route for neumorphism. Either:

- **amend MASTER's scope rule** to hand `/day-use` to this file (recommended —
  the landing page has been navy since it shipped and is the strongest surface
  on the site), or
- **rebuild both** the landing page and the booking form on the clay base.

Until one is chosen, MASTER and this file disagree about `/day-use`, and this
file wins for anything under that route.
