# /bookings — Mobile Review & Optimization Plan

**Date:** 2026-08-20
**Scope reviewed:** `app/(root)/bookings/page.tsx`, `components/bookings/BookingsFilters.tsx`,
`components/bookings/CopyGuestsButton.tsx`, `components/kitesurfing/BookingComponent.tsx`,
`lib/actions/booking.actions.ts` (`getAllBookings`).

**Design reference:** `.claude/design-system/MASTER.md`. `/bookings` is a data-heavy admin page,
so the *toned-down* variant applies (flat shadows, dense spacing, no depth on repeated rows).
There is no `pages/bookings.md` override.

---

## 1. What was broken on mobile (375px)

| # | Problem | Where | Severity |
|---|---------|-------|----------|
| 1 | Header action row (`Copy Guests` + `+ New Corporate` + `+ New Day Use`) needs ~360px next to a 3xl `Bookings` title. It overflowed the viewport and pushed the page into horizontal scroll. | `page.tsx` header | **High** |
| 2 | 8 nav pills in a `flex-wrap` — collapsed into 3–4 stacked rows, ~140px of vertical space before any content. | `page.tsx` nav | Medium |
| 3 | Booking rows kept a fixed 2-column layout. Right column (status pill + agent pill + amount + 3 × 36px buttons) reserves ~200px, leaving ~110px for the guest name → every name truncated to a few characters. | `BookingComponent.tsx` | **High** |
| 4 | Filter bar: search input hard-coded `w-52`, selects sized to content, three pill groups with `ml-auto` — wrapped into a ragged 5-row block. | `BookingsFilters.tsx` | Medium |
| 5 | Inputs/selects at 11–13px → iOS Safari zooms the viewport on focus and does not zoom back out. | `BookingsFilters.tsx` | Medium |
| 6 | Tap targets below the 44px minimum: icon buttons 36px, filter pills ~26px tall. | both components | Medium |
| 7 | `p-6` page padding on a 375px screen spends 13% of width on gutters. | `page.tsx` | Low |

---

## 2. What was changed

### Header actions → dropdown on mobile (the requested fix)

New component: `components/bookings/BookingsHeaderActions.tsx`.

- **< `sm` (640px):** a single `Actions ▾` pill opens a dropdown containing *Copy Guests*,
  *New Corporate*, *New Day Use* — stacked vertically, 40px rows, no overflow.
- **≥ `sm`:** the three inline buttons exactly as before. No desktop regression.

`CopyGuestsButton.tsx` was refactored so the clipboard logic lives in an exported
`useCopyGuests(guests)` hook. The desktop button and the mobile dropdown item share one
implementation instead of duplicating the format-and-copy code.

### Page shell — `page.tsx`

- `p-6` → `px-4 py-5 sm:p-6`; section margins `mb-6` → `mb-5 sm:mb-6`.
- Title `text-3xl` → `text-2xl sm:text-3xl`.
- Nav pills → single-line horizontal scroll strip on mobile (`overflow-x-auto`, edge-to-edge
  via `-mx-4 px-4`, hidden scrollbar, `shrink-0` pills); still wraps normally from `sm` up.
  Saves ~110px of vertical space above the fold.
- Stat chips: `gap-2.5 sm:gap-3`, `px-3.5 sm:px-4`. Grid was already `grid-cols-2 md:grid-cols-4`.
- Nav list hoisted to a typed module-scope `NAV_LINKS` constant, which also removed the
  `variant as any` cast that was the file's only ESLint error.

### Filters — `BookingsFilters.tsx`

- Row 1 becomes a 2-column grid on mobile: search spans both columns, status/service/agent
  selects take one column each, clear + result count share the last row. Reverts to the
  inline flex row at `sm` (via `sm:contents` on the clear/count wrapper).
- Inputs and selects: `text-base` (16px) on mobile → **no iOS zoom-on-focus**;
  `sm:text-[0.82rem]` / `sm:text-[0.72rem]` keeps the dense desktop look unchanged.
- Row 2 pill groups → horizontal scroll strip on mobile, `shrink-0` groups, `ml-auto` → `sm:ml-auto`.
- The four duplicated pill `className` template literals collapsed into one `pillClass(active)`
  helper; pills are now `py-1.5 sm:py-1` and `text-[0.72rem] sm:text-[0.65rem]`.

### Booking row — `BookingComponent.tsx`

- Row stacks on mobile: info block full width on top, action block full width beneath
  (`flex-col sm:flex-row`). The guest name now gets the whole width instead of ~110px.
- Action block becomes a wrapping right-aligned row on mobile, returns to the stacked
  right column at `sm` (`sm:flex-col sm:items-end`).
- Icon buttons `w-10 h-10 sm:w-9 sm:h-9`; status pill `py-1.5 sm:py-1` → 44px-class tap targets.
- Row padding `px-3.5 sm:px-4`.

This component is shared by **5 pages** (`/bookings`, `/bookings/date/[date]`,
`/bookings/kitesurfing`, `/bookings/restaurant`, `/bookings/schedule`) — all of them get the
mobile layout for free. The changes are CSS-only; no props, state or handlers were touched.

### Verification

`npx tsc --noEmit` and `npx eslint` on all five files are clean. (The only `tsc` output is the
repo's pre-existing `TS2307` image-import errors, which come from running `tsc` outside
`next build`.) **The app was not run**: there is no `.env` in the working tree, so
`npm run build` fails at `prisma migrate deploy` before Next compiles. Visual confirmation at
375 / 768 / 1024px is still outstanding and is step 0 of the plan below.

---

## 3. Optimization pass — implemented

All six recommendations from the first review are now in the tree. What follows
is what shipped, including where it deviates from what was originally proposed.

### P1 — the list no longer loads the whole table

`getAllBookings()` (no `where`, no `select`, no `take`) is **gone**, replaced by
`getBookingsPage(query)` in `lib/actions/booking.actions.ts`:

- **Filter pushdown.** Status, service, agent, free-text search and date range
  are one `Prisma.BookingWhereInput` built by `bookingsWhere()`. Sorting is
  `bookingsOrderBy()` — `[date, time nulls last, id]` or `[createdAt, id]`.
  `id` is the tiebreaker so paging cannot repeat or drop a row. `page.tsx` now
  only *groups* the rows it is handed; every filter it used to run in JS is SQL.
- **Column pushdown.** `BOOKING_ROW_SELECT` is the 15 columns a row renders plus
  the agent stub. `flashOrderId`, `paymentLink`, `paymentLinkExpiresAt`,
  `waitingPaymentAt` and `agentId` no longer cross the wire. The exported
  `BookingRow` type is derived from that select, and `BookingComponent` now
  takes `BookingRow` instead of the full `BookingWithAgent` — full booking
  objects still satisfy it, so the other four pages were unaffected.
- **Counts are aggregates.** The four stat chips are four `prisma.booking.count()`
  calls and the result count is a fifth, instead of `.filter().length` over
  every booking ever made.
- **Row cap.** `take: limit + 1` — the extra row is how `hasMore` is known.

**Indexes** (`prisma/schema.prisma` + `prisma/migrations/20260820120000_add_booking_date_indexes/`):

```sql
CREATE INDEX "Booking_date_idx" ON "Booking"("date");
CREATE INDEX "Booking_bookingStatus_date_idx" ON "Booking"("bookingStatus", "date");
```

Equality on status then range on date is the order the composite needs. The
migration was hand-written because this environment has no `DATABASE_URL`;
it applies with `npx prisma migrate deploy` and takes a brief write lock
(`CONCURRENTLY` is not available inside Prisma's migration transaction).

**`allUsers` per row is gone.** `components/bookings/AgentsProvider.tsx` holds
the staff list in context; `BookingComponent` reads it with `useAgents()`. The
list is serialized into the RSC payload once per page instead of once per row.
All five pages that render booking rows were converted.

### P2 — no writes or revalidation inside a render

`cancelExpiredWaitingPayments()` no longer calls `revalidatePath` — that was
unsupported-during-render and could throw for the request that triggered it. The
call is now in the cron route, which runs outside render and already fires hourly
per `vercel.json`. The sweep was also removed from the `/bookings` read path.

**Consequence worth knowing:** a booking can now sit in `WAITING_PAYMENT` for up
to an hour past its 24h deadline before the cron flips it to `CANCELED`. The
reception dashboard still sweeps on load (it needs exact queues), which is safe
now that the function no longer revalidates.

### P3 — paging, not virtualization

Implemented as a growing `limit` (100 per page, `BOOKINGS_PAGE_SIZE` in
`lib/constants`) with a "Load more" link and a "Showing X of Y" line — **not**
the cursor pagination the first review proposed. The list is server-rendered and
grouped by date on the server, so a cursor would have to be threaded through the
grouping and through a client-side append; a URL `limit` keeps the page a plain
server component with no client state. The database cost is the same `take` cap
either way. Any filter change deletes `limit`, so paging always restarts.

Virtualization was not needed once the render is capped at 100 rows.

### P4 — accessibility

- **Contrast.** `#6b6460` (5.8:1 on white) is now the muted text token
  everywhere; `#b0a89f` (2.3:1), `#a09890` (2.9:1), `#8a8480` (3.7:1) and
  `#c0b8b0` were removed from text and survive only on decorative icons.
  Status labels use a new `STATUS_TEXT` map of darkened pairs
  (`#b45309`, `#0369a1`, `#15803d`, `#6d28d9`, …) while dots and left strips keep
  the saturated `STATUS_BORDER` colours; service labels gained the same
  treatment via `SERVICE_META.text`. Paid amounts are `#15803d` (5.0:1) rather
  than `#22c55e` (2.2:1).
- **Size floor.** Everything under 12px is now `text-[0.72rem] sm:text-[…]` —
  the dense desktop scale is unchanged, mobile clears the floor.
- **Focus.** A shared `FOCUS_RING` on every pill, chip, select, icon button and
  status trigger. There was previously no visible focus state anywhere.
- **Semantics.** `aria-label` on the search box and the three selects,
  `aria-pressed` on the toggle pills, `aria-live` on the result count,
  `aria-current` on the active stat chip, and a `ChevronDown` on the
  `appearance-none` selects so they read as controls.

### P5 — palette recorded

`.claude/design-system/pages/bookings.md` now documents the warm admin palette,
the status/service text pairs, the density rules and the six mobile rules as a
deliberate override of `MASTER.md`. Per MASTER's own logic, that file governs
this section from now on. This **records** the existing decision rather than
making a new one — migrating the section to the cool neumorphic base is still
open, and is a section-wide call, not a per-page one.

### P6 — UX

- Filter bar is `sm:sticky sm:top-0` — **desktop only**, deliberately not what
  the first review asked for. Stacked for mobile the card is ~230px tall; pinning
  it would hold a third of a phone screen permanently. The right mobile answer is
  a collapsed "Filters" button opening a `Sheet`, which is a bigger change than
  this pass took on.
- Stat chips merge into the current params instead of replacing them, set every
  dimension they represent (so the list matches the number on the chip), show an
  active state, and reset paging. "Confirmed unpaid" needed a new `unpaid=1`
  filter to be representable at all.
- "Copy Guests" now reads `Copy 24 Guests` and fetches the **whole filtered set**
  from the server via `getFilteredBookingGuests` — copying from the rendered
  rows would have silently truncated at the page size.
- Empty state distinguishes "no bookings match your filters" from "no bookings
  yet" and offers a Clear filters button.

---

## 4. Status and what is left

| Step | Task | Status |
|------|------|--------|
| 0 | Verify at 375 / 768 / 1024px in a browser | **Not done** — no `.env` in the tree |
| 1 | P2: sweeper out of the read path | Done |
| 2 | P4: contrast, font floor, focus rings | Done |
| 3 | P1a: `select` + `where` pushdown, counts as aggregates | Done |
| 4 | P1b: date indexes | Migration written, **not applied** |
| 5 | P1c: `allUsers` out of the per-row payload | Done |
| 6 | P3: paging | Done (limit-based, see above) |
| 7 | P5: `pages/bookings.md` | Done |
| 8 | P6: sticky filters, chip merging, empty state | Done |

### Verification performed

`npx tsc --noEmit` and `npx eslint` are clean across every touched file. The
remaining repo-wide lint errors (`no-explicit-any`, `no-children-prop`,
`no-unescaped-entities` in `BookingEditForm`, `guide/page`,
`LessonBookingEditSheet`) predate this work and were left alone.

**The app was never started.** There is no `.env`, so `npm run build` fails at
`prisma migrate deploy` before Next compiles. Nothing here has been seen in a
browser or run against Postgres.

### To deploy

1. `npx prisma migrate deploy` — applies the two indexes.
2. Load `/bookings` and confirm the filter/sort/search results match what the
   old in-memory filtering produced, particularly the date-range boundaries:
   ranges are now UTC day boundaries (`utcDayStart`), and `dateKey` groups in UTC
   too. Previously grouping used local-time formatting, which disagreed with the
   UTC dates the rows render — on a UTC server the two are identical, so this is
   only visible if the app is ever hosted somewhere else.
3. Check the `Load more` path with `range=all`.

### Known gaps

- **Group totals are page-local.** The "N people →" figure on a date header
  counts only loaded rows. With ≤100 rows per page and date-ascending order this
  only bites on a date group split across a page boundary.
- **Search is `contains`**, so it is a sequential scan on `name`/`email`/`phone`.
  Fine at this table size; if it gets slow, add a `pg_trgm` GIN index rather than
  widening the query.
- **Five count queries per load.** Cheap and index-covered, but they are the
  obvious thing to cache if the page is ever hit hard.
- **`getBookingsByService` and `getBookingsByDate`** still fetch every column for
  their pages. They are naturally bounded (one service, one day), so they were
  left alone — but they would take the same `BOOKING_ROW_SELECT` treatment.
