# Page Override: Restaurant

> Overrides `MASTER.md` for `/restaurant`.
> Recorded 2026-11-03. Deliberate override, not drift.

## Why this page departs from MASTER

`/restaurant` is the front door to `/restaurant/menu`, and the two should read
as one place. Three restyles were prototyped (`prototype/restaurant-variants`
branch): a MASTER-neumorphic "Menu up front", "Menu as cover", and "Category
doors". **"Menu as cover" won.**

## Rules

- Use the `.menu-board` palette and type exactly as `restaurant-menu.md`
  defines them (tokens in `app/globals.css`; Caveat Brush for `h1`/`h2`,
  Caveat for chapter links, Raleway for body and buttons). No hard-coded hexes.
- The hero's main object is the printed menu's cover (`beach-banner.webp`):
  the whole card is a single link to `/restaurant/menu`, with a navy
  "Open the menu" pill inside it.
- Under the hero, a cream table-of-contents bar lists every category from
  `lib/config/menu.json`, each deep-linking to `/restaurant/menu#<id>`.
- Reserve is secondary: an outlined navy WhatsApp button in the hero, filled
  navy in the closing cream CTA panel.
- No neumorphic shadows. The cover card's soft brown drop shadow is the one exception.
