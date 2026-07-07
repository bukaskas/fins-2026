# Page Override: Dashboard (and other admin pages)

> Overrides `MASTER.md` for `/dashboard`, `/reception`, `/accounting`, `/inventory`, `/users`.

- **Shadows:** `--shadow-raised-sm` maximum; page sections may be completely flat with `1px` borders. No inset wells around tables larger than ~10 rows.
- **Spacing:** dense — `--space-md` card padding, `--space-lg` section gaps.
- **Components:** keep standard shadcn/ui table, form, and dialog styling; apply only the palette and radii from MASTER.md, not the depth effects.
- **Typography:** body `0.875rem` allowed (still ≥ 400 weight).
- **Priority:** scanability and information density beat the soft aesthetic on these pages.
