# Page Override: Restaurant Menu

> Overrides `MASTER.md` for `/restaurant/menu`.
> Recorded 2026-10-28. Deliberate override, not drift.

## Why this page departs from MASTER

The web menu should read as the same object as the printed Fins food menu
(`docs/fins_food_menu.pdf`): watercolor beach, handwritten type, warm paper. A
neumorphic cream card layout didn't. Three restyles were prototyped
(`prototype/food-menu-variants` branch); the "Illustrated board" layout won,
**with the real dish photos in the tiles instead of the PDF's watercolor dish
illustrations.**

## Palette

Tokens are scoped under `.menu-board` in `app/globals.css`. Use them via
`bg-(--menu-*)` / `text-(--menu-*)`; don't hard-code hexes in the page.

| Token | Hex | Usage |
|-------|-----|-------|
| `--menu-paper` | `#f5ede0` | Page ground, sticky chapter bar |
| `--menu-cream` | `#efe6d6` | Dish tiles, list cards, CTA panel |
| `--menu-navy` | `#1b3a5c` | Dish names, prices, chapter links, primary CTA fill |
| `--menu-brown` | `#8a4a1f` | Page and chapter titles (brush script), add-on lines |
| `--menu-ink` | `#2a2420` | Body text |
| `--menu-muted` | `#5c5348` | Descriptions, options |
| `--menu-eyebrow` | `#85603f` | Letterspaced eyebrow on the watercolor hero |
| `--menu-line` | brown @ 25% | Chapter rule, nav borders |

## Type

- **Caveat Brush**: the page `h1` and category `h2`s only.
- **Caveat 500/700**: dish names, prices, chapter links, list-card titles.
- **Raleway** (site default): descriptions, list rows, notes, buttons.
- Prices print as bare numbers; the currency and the tax/service note show
  once, above the first category.

## Structure

1. Watercolor beach hero (`beach-banner.webp`), the only illustration left on the page.
2. Sticky chapter bar under the site header (`top-24` / `md:top-[118px]`),
   scrolling sideways on phones.
3. Per category: brush title + hairline rule, then a 1/2/3-column grid of photo
   tiles for items with an `image` in `menu.json`. Items without one collapse
   into list cards per group (a group can carry its own small `image`).
4. Reserve CTA panel in cream, navy WhatsApp button.

Tiles are flat (no neumorphic shadow). Photos are `aspect-square` on phones and
`aspect-[4/5]` from `sm` up, `object-cover`.
