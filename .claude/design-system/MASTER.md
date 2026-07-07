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
| Primary / Accent (CTA) | `#0EA5E9` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Accent light (decoration only) | `#38BDF8` | `--color-accent` |
| Foreground (text) | `#22303F` | `--color-foreground` |
| Muted text | `#5B6B7C` | `--color-muted-foreground` |
| Shadow dark | `rgba(136,152,170,0.55)` | `--shadow-dark` |
| Shadow light | `rgba(255,255,255,0.85)` | `--shadow-light` |
| Destructive | `#DC2626` | `--color-destructive` |
| Focus ring | `#0EA5E9` | `--color-ring` |

**Color notes:**
- The base `#E3EBF3` is a cool blue-grey clay — it carries the existing Fins sky/sea identity into the neumorphic base instead of the generic grey `#E0E5EC`.
- `#0EA5E9` (not `#38BDF8`) is the primary for text/CTAs: `#38BDF8` on the light base fails WCAG contrast for text. Use `#38BDF8` only for decorative rules, badges on dark, and large display type.
- Body text is `#22303F` on `#E3EBF3` ≈ 10:1 contrast. Muted text `#5B6B7C` ≈ 4.6:1 — do not go lighter for anything smaller than 18px.

### Typography

- **Heading font:** Raleway (already loaded as `--font-raleway`) — keep it; don't introduce a new display font.
- **Body font:** Raleway, weights 400–600. **Minimum body weight is 400** — the current site's 100/300 weights are too thin against a low-contrast neumorphic base.
- **Sizes:** Display `clamp(2.2rem, 5vw, 4rem)`, H2 `1.5rem`, body `1rem/0.95rem`, caption `0.8rem`. **Nothing below 0.75rem (12px).**
- Uppercase-tracked eyebrow labels: keep, but at ≥ `0.7rem` and weight 600.

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
- [ ] Primary CTAs filled with `--color-primary`, contrast ≥ 4.5:1
- [ ] Body text ≥ 400 weight, ≥ 12px, contrast ≥ 4.5:1
- [ ] Icons from Lucide, no emojis
- [ ] `prefers-reduced-motion` respected; content visible without JS
- [ ] Responsive at 375 / 768 / 1024 / 1440px, no horizontal scroll
- [ ] Admin pages use the toned-down variant (scope rule at top)
