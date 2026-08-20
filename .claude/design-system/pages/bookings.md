# Page Override: Bookings

> Overrides `MASTER.md` for `/bookings` and everything under it
> (`/bookings/date/*`, `/bookings/kitesurfing`, `/bookings/restaurant`,
> `/bookings/schedule`, `/bookings/payments`, …).
> Recorded 2026-08-20 to document the palette already in use across the whole
> section — it is a deliberate override, not drift.

## Palette — warm neutral, not the cool neumorphic base

The booking screens are a staff tool used all day on phones in bright sun. They
use a warm paper palette with flat white cards, not `MASTER.md`'s
`#E3EBF3` clay base. White cards on this ground are **allowed here** and are the
standard row/card surface.

| Role | Hex | Usage |
|------|-----|-------|
| Page ground | `#faf9f7` | Behind the content column |
| Surface | `#ffffff` | Rows, cards, filter bar, stat chips |
| Border | `#ece8e3` | Hairline separators, chip and pill outlines |
| Border (hover) | `#d6d0c8` | Hover state on interactive cards |
| Foreground | `#1a1614` | Headings, names, active pill fill |
| Muted foreground | `#6b6460` | All secondary text — **5.8:1 on white** |
| Icon-button ground | `#f5f2ef` | Neutral square actions |

**`#b0a89f` (2.3:1), `#a09890` (2.9:1), `#8a8480` (3.7:1) and `#c0b8b0` must not
be used for text.** They are below 4.5:1 on white. They are acceptable only for
decorative icons and hairlines. `#6b6460` is the muted text token.

## Status and service colours

Saturated status colours (`#f59e0b`, `#38bdf8`, `#22c55e`, …) drive **dots, left
strips and tinted backgrounds only**. Label text uses the darkened pair from
`STATUS_TEXT` / `SERVICE_META.text` in `components/kitesurfing/BookingComponent.tsx`
(`#b45309`, `#0369a1`, `#15803d`, `#6d28d9`, `#0f766e`, `#b91c1c`, `#4b5563`),
which all clear 4.5:1 on white. Never colour text with the dot colour.

## Density and depth

- Rows are flat: a single `0_1px_6px_rgba(26,22,20,0.08)` shadow, radius `1rem`.
  No neumorphic dual shadows and no depth on repeated rows (MASTER anti-pattern).
- Type scale is denser than MASTER: `0.6rem`–`0.75rem` labels are permitted
  **from `sm` up**. Below `sm` the floor is `0.72rem` — implemented as
  `text-[0.72rem] sm:text-[0.6rem]` pairs.
- Fonts: Raleway for labels and names, Roboto for tabular numbers
  (dates, times, amounts) — always with `tabular-nums`.

## Mobile rules (`< 640px`)

1. **No horizontal page scroll at 375px.** Overflowing pill rows become
   contained `overflow-x-auto` strips with hidden scrollbars, bled to the screen
   edge with `-mx-4 px-4`.
2. **Header actions collapse into one dropdown** rather than wrapping. See
   `components/bookings/BookingsHeaderActions.tsx`.
3. **Rows stack**: info block above, action block below (`flex-col sm:flex-row`).
4. **Tap targets ≥ 40px**: icon buttons `w-10 h-10 sm:w-9 sm:h-9`.
5. **Inputs and selects are 16px on mobile** (`text-base sm:text-[0.72rem]`) —
   anything smaller makes iOS Safari zoom the viewport on focus.
6. Tall stacked toolbars are **not** sticky on mobile — a pinned bar over
   ~120px steals too much of the viewport. Stick them from `sm` up instead.

## Always

- Visible focus: `focus-visible:ring-2 focus-visible:ring-[#1a1614] ring-offset-2`
  on every pill, icon button, chip and select.
- `appearance-none` selects carry their own `ChevronDown`.
- Lucide icons only; no emoji.
