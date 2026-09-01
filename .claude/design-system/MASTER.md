# Design System Master File — Fins (Neumorphism / Soft UI)

> **LOGIC:** When building a specific page, first check `.claude/design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Fins — kitesurf school & beach club (Sokhna, Red Sea)
**Style:** Neumorphism (Soft UI), accessibility-corrected
**Stack:** Next.js App Router · Tailwind v4 · shadcn/ui · Raleway
**Updated:** 2026-07-06

---

## Scope rule (important)

Neumorphism applies at **full strength on guest-facing pages** (`/`, `/kitesurfing`, `/day-use`, `/restaurant`, course pages, booking flows).

On **data-heavy admin pages** (`/dashboard`, `/reception`, `/accounting`, `/inventory`, `/users`) use the **toned-down variant**: same palette and radii, but flatter shadows (`--shadow-raised-sm` max), denser spacing, and standard shadcn table/form styling. Pure neumorphism is an anti-pattern for dense data UIs — depth effects on every row destroy scanability.

---

## Global Rules

### Color Palette

Neumorphism needs a single mid-tone base so both light and dark shadows are visible. Never use pure white or pure black surfaces.

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Base / Background | `#E3EBF3` | `--color-background` |
| Surface (same as base) | `#E3EBF3` | `--color-surface` |
| Inset background | `#D6E0EA` | `--color-inset` |
| Primary fill / decoration | `#0EA5E9` | `--color-neu-primary` |
| Primary **as text** | `#075985` | `--color-neu-primary-ink` |
| On Primary (text on a `#0EA5E9` fill) | `#22303F` | `--color-neu-fg` |
| Accent light (decoration only) | `#38BDF8` | `--color-neu-accent` |
| Foreground (text) | `#22303F` | `--color-foreground` |
| Muted text | `#526070` | `--color-neu-muted` |
| Shadow dark | `rgba(136,152,170,0.55)` | `--shadow-dark` |
| Shadow light | `rgba(255,255,255,0.85)` | `--shadow-light` |
| Destructive | `#DC2626` | `--color-destructive` |
| Focus ring | `#0C4A6E` | `--color-neu-focus` |

**Color notes:**
- The base `#E3EBF3` is a cool blue-grey clay — it carries the existing Fins sky/sea identity into the neumorphic base instead of the generic grey `#E0E5EC`.
- **`#0EA5E9` is a fill, never a text colour.** This line previously read that `#0EA5E9` "is the primary for text/CTAs" because `#38BDF8` fails contrast. The premise was right and the conclusion was wrong: `#0EA5E9` fails too. It measures **2.30:1 on the base** and **2.07:1 on the inset** — below AA (4.5:1) and below even the 3:1 large-text bar, so it fails as display type as well.
- **Accent text is `#075985`** (`--color-neu-primary-ink`, sky-800): 6.28:1 on the base, 5.66:1 on the inset. One value for every accent text role — eyebrows, links, table headers, display headings — so no per-surface exception has to be remembered. Table headers sit on the inset, which is why the value has to clear both surfaces; `#0B6FA4` clears the base at 4.56:1 but only reaches 4.11:1 on the inset.
- **Text on a `#0EA5E9` fill is `#22303F` at full opacity** (4.85:1). It is the only passing choice: white is 2.77:1, and dark text falls below AA as soon as any transparency is applied (`/90` = 4.17:1). Filled surfaces therefore carry solid navy labels and build hierarchy from size, weight and tracking rather than tint.
- `#38BDF8` stays decoration-only: rules, badges on dark, and non-text accents.
- Body text is `#22303F` on `#E3EBF3` ≈ 10:1 contrast. **Muted text is `#526070`** — 5.34:1 on the base, 4.81:1 on the inset, 4.82:1 on a `bg-neu-inset/45` chip. This line previously specified `#5B6B7C` and quoted "≈ 4.6:1", which was the base figure only: on the inset it was 4.09:1 and failed AA. Any muted value must be checked against the inset, not the base, because that is the darker of the two.
- **Focus ring is `#0B4A6F`, not the primary.** `#0EA5E9` measures 2.30:1 on the base and 2.07:1 on the inset, so a ring drawn in it fails WCAG 2.4.11 (non-text contrast, 3:1). `#0C4A6E` (sky-900) clears 3:1 on every surface in the system — base 7.86:1, inset 7.08:1, and 3.41:1 on a `#0EA5E9` fill — so one token works everywhere with no per-surface exception.

### Typography

- **Heading font:** Raleway (already loaded as `--font-raleway`) — keep it; don't introduce a new display font.
- **Body font:** Raleway, weights 400–600. **Minimum body weight is 400** — the current site's 100/300 weights are too thin against a low-contrast neumorphic base.
- **Sizes:** Display `clamp(2.2rem, 5vw, 4rem)`, H2 `1.5rem`, body `1rem/0.95rem`, caption `0.8rem`. **Nothing below 0.75rem (12px).**
- Uppercase-tracked eyebrow labels: keep, but at ≥ `0.75rem` and weight 600. (This previously read `0.7rem`, which is 11.2px and contradicts the 12px floor two lines above; the floor wins.)

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight gaps |
| `--space-sm` | `8px` | Icon gaps, inline spacing |
| `--space-md` | `16px` | Standard padding |
| `--space-lg` | `24px` | Card padding |
| `--space-xl` | `32px` | Large gaps |
| `--space-2xl` | `48px` | Section margins |
| `--space-3xl` | `80px` | Marketing section padding |

Admin pages: cap at `--space-xl` and halve section margins (see scope rule).

### Radii

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `10px` | Inputs, small controls |
| `--radius-md` | `16px` | Buttons, table cards |
| `--radius-lg` | `24px` | Cards, dialogs |
| `--radius-pill` | `999px` | Pills, toggles |

### Shadows (the core of the style)

Every elevated element gets a **dual shadow**: dark bottom-right + light top-left. Every "carved-in" element (inputs, wells, pressed states) gets the **inset pair**.

```css
/* Raised (resting cards, buttons) */
--shadow-raised:    -6px -6px 14px var(--shadow-light), 6px 6px 14px var(--shadow-dark);
--shadow-raised-sm: -3px -3px 7px  var(--shadow-light), 3px 3px 7px  var(--shadow-dark);
/* Inset (inputs, pressed, wells) */
--shadow-inset:     inset -4px -4px 8px var(--shadow-light), inset 4px 4px 8px var(--shadow-dark);
--shadow-inset-sm:  inset -2px -2px 4px var(--shadow-light), inset 2px 2px 4px var(--shadow-dark);
```

Rules:
- Light source is fixed top-left. **Never mix shadow directions on one page.**
- Elements sit on the base color — a raised element has `background: var(--color-background)` (or a subtle `linear-gradient(145deg, #EAF1F8, #DCE5EF)` for convex feel). No white cards on the base.
- Max two nesting levels: raised card → inset slot. Never raised-inside-raised-inside-raised.

### Tailwind v4 wiring

Declare all of the above inside `@theme` in `app/globals.css` so utilities exist (`bg-background`, `shadow-raised` via `--shadow-*`, `rounded-[--radius-lg]`, etc.). Add two component classes:

```css
.neu-raised {
  background: var(--color-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-raised);
}
.neu-inset {
  background: var(--color-inset);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-inset);
}
```

---

## Component Specs

### Buttons

```css
/* Primary CTA — filled, NOT neumorphic-ghost. CTAs must not blend into the base. */
.btn-primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
  padding: 14px 28px;
  border-radius: var(--radius-md);
  font-weight: 600;
  box-shadow: var(--shadow-raised-sm);
  transition: box-shadow 150ms ease, transform 150ms ease;
  cursor: pointer;
}
.btn-primary:active { box-shadow: var(--shadow-inset-sm); transform: scale(0.98); }

/* Secondary — raised soft button */
.btn-secondary {
  background: var(--color-background);
  color: var(--color-foreground);
  padding: 14px 28px;
  border-radius: var(--radius-md);
  font-weight: 600;
  box-shadow: var(--shadow-raised-sm);
  transition: box-shadow 150ms ease;
  cursor: pointer;
}
.btn-secondary:active { box-shadow: var(--shadow-inset-sm); }
```

Press feedback is always **raised → inset** (150ms), never opacity fades.

### Cards

Raised (`.neu-raised`), padding `--space-lg`, radius `--radius-lg`. Hover: deepen to `--shadow-raised` from `-sm` — **no translateY lifts** (breaks the "molded from the surface" metaphor).

### Inputs

Inset (`.neu-inset`), height 48px, padding `12px 16px`, font-size 16px (prevents iOS zoom), **background `--color-inset`, never white**. Focus: keep inset shadow + `outline: 2px solid var(--color-ring); outline-offset: 2px`. Focus must always be visible — inset-only focus states are invisible to keyboard users.

### Dialogs / Modals

Raised, radius `--radius-lg`, padding `--space-xl`, overlay `rgba(34,48,63,0.4)` + `backdrop-filter: blur(4px)`. Dialog surface is the base color, not white and not dark navy.

### Tables (price lists, admin data)

Use semantic `<table>`. The table sits in one inset well (`.neu-inset` wrapper); rows are flat with `1px solid rgba(136,152,170,0.25)` separators. Never shadow individual rows.

### Toggles / pills / badges

Pill radius, inset track + raised thumb for switches. Active nav pill = inset; resting = flat text.

---

## Motion

- Transitions 150–250ms `cubic-bezier(0.4, 0, 0.2, 1)`; press states 150ms.
- Scroll reveals (existing `Reveal` pattern): keep subtle fade+rise, but content must be visible without JS.
- Respect `prefers-reduced-motion` (already handled in `globals.css` — keep it that way for new animation classes).

---

## Anti-Patterns (Do NOT Use)

- ❌ Pure white or dark-navy surfaces inside neumorphic sections (breaks the single-base rule)
- ❌ Dark mode for neumorphic sections — the style doesn't survive inversion; admin pages may keep their own styling instead
- ❌ Neumorphic-ghost primary CTAs — primary actions are always filled `--color-primary`
- ❌ Black/hard shadows (`rgba(0,0,0,…)` > 0.15) or single-direction shadows
- ❌ Text below 4.5:1 contrast, font weights below 400 for body text, sizes below 12px
- ❌ translateY/scale hovers that shift layout
- ❌ Emojis as icons — Lucide only (already the project standard via shadcn)
- ❌ Depth effects on table rows, list items, or any repeated dense element
- ❌ Missing `cursor: pointer` on clickable elements
- ❌ Invisible focus states

---

## Pre-Delivery Checklist

- [ ] One base color per section; no white cards on the base
- [ ] All shadows use the dual light/dark pair, light source top-left everywhere
- [ ] Pressed states switch raised → inset (150ms)
- [ ] Inputs are inset with visible 2px focus outline
- [ ] Primary CTAs filled with `--color-neu-primary`, label `--color-neu-fg` at full opacity (4.85:1); accent text uses `--color-neu-primary-ink`
- [ ] Body text ≥ 400 weight, ≥ 12px, contrast ≥ 4.5:1
- [ ] Icons from Lucide, no emojis
- [ ] `prefers-reduced-motion` respected; content visible without JS
- [ ] Responsive at 375 / 768 / 1024 / 1440px, no horizontal scroll
- [ ] Admin pages use the toned-down variant (scope rule at top)
