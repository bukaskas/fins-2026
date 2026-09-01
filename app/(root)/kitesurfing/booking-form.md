# Kitesurfing booking form — where it should live

**Date:** 2026-09-01
**Scope reviewed:** `app/(root)/kitesurfing/page.tsx`, `app/(root)/kitesurfing/booking/`,
`components/kitesurfing/` (`CoursesSection`, `CourseDetail`, `SectionNav`, `MembershipSections`),
`components/shared/footer/index.tsx`, `lib/constants/index.ts`,
`lib/actions/lessons.actions.ts` (`createKitesurfingBookingFromPublic`),
`lib/actions/booking.actions.ts` (`createBooking`, `getBookingsByService`,
`getFutureKitesurfingBookings`), `prisma/schema.prisma`, `proxy.ts`, `lib/metadata.ts`.

**Context given by the owner (2026-09-01):** `school.finskitesurfing.com` is a **separate school
management application with its own database**. It is the system of record for kitesurfing.
Booking details captured on this site must be **sent to that project**. This project's own
kitesurfing booking function is **no longer used**.

That single fact settles most of what follows: this repo is a marketing front-end for kitesurfing,
not a system of record for it. Everything below is judged against that.

> **Status — Phase 0 implemented 2026-09-01.** The owner approved "Option A's cleanup now, then
> Option B when the school app can expose an endpoint." All five Phase 0 items in §3 are done; §1
> describes the state *before* that work and is kept as the record of why. Phase 1 (§4) is
> unstarted and blocked on the school app's endpoint. The open questions in §6 are unanswered.

---

## 1. Current state, verified

### Three destinations, all labelled some form of "Book"

| # | Destination | Label(s) shown | Where |
|---|---|---|---|
| 1 | `https://school.finskitesurfing.com/book` (external) | "Book a session", "Book", "Book now" | `page.tsx:81`, `SectionNav.tsx:219`, `CoursesSection.tsx:139`, `CourseDetail.tsx:180`, `footer/index.tsx:25` |
| 2 | `/day-use/booking` (internal) | "Book now", "Reservations" | `MembershipSections.tsx:146` (all three membership tiers), `footer/index.tsx:32` |
| 3 | `/kitesurfing/booking` (internal) | — **nothing links to it** | route exists; zero inbound links in the repo |

Destination 1 is a single constant (`KITESURFING_BOOKING_URL`, `lib/constants/index.ts:9`) used in
five places, so it is one destination, not five. The genuine problem is that a guest sees the word
"Book" on the same page and gets three different systems depending on which one they press.

None of the outbound links carry `target`, `rel`, or any visible external indicator, and none carry
course context — a guest reading the Beginner Course and pressing "Book a session" arrives at the
school app with nothing selected.

### The orphaned internal form is not a booking form

`/kitesurfing/booking` posts to `createKitesurfingBookingFromPublic`
(`lib/actions/lessons.actions.ts:363`). It does **not** create a `Booking`. It creates a
`LessonSession` + `LessonBooking`, which is the *delivery and scheduling* side of the schema, not
the *sales and money* side:

- hardcodes `LessonType.PRIVATE` and `capacity: 1` — a group course cannot be booked through it;
- derives duration from `LESSON_CANONICAL_MINUTES[PRIVATE]`, ignoring the course;
- **silently creates a `User` account** with a random UUID password for any unrecognised email;
- writes `LessonBookingStatus.RESERVED`, i.e. it holds a real seat on a real session;
- **sends the guest a booking email** (`bookingType: "kitesurfing-course"`);
- has no price, no payment link, no 24-hour window, no `contacts` log, and no `service` field.

So even if it were linked, it would not produce the booking the desk works with. Compare the two
models in `prisma/schema.prisma`:

| | `Booking` | `LessonBooking` |
|---|---|---|
| 9-status lifecycle | yes (`bookingStatus`) | no (`RESERVED` / attended) |
| Money | `totalPriceCents`, `amountPaidCents`, `payments` | only a post-hoc `orderId` |
| Flash payment link | `paymentLink`, `flashOrderId`, `paymentLinkAttempt` | — |
| 24-hour auto-cancel | `waitingPaymentAt` | — |
| WhatsApp conversation log | `contacts` | — |
| Which service | `service` | — |

### The staff-side kitesurfing pipeline is fully built and completely unfed

`service: "kitesurfing-course"` is **read** in at least thirteen places — the desk list
(`app/(root)/bookings/kitesurfing/page.tsx:13`), the scheduling board
(`app/(root)/bookings/schedule/page.tsx:38` via `getFutureKitesurfingBookings`,
`booking.actions.ts:1571`), reception (`reception/page.tsx:30`), the day view
(`bookings/date/[date]/page.tsx:46,53,277`), the booking edit form
(`BookingEditForm.tsx:41,358`), agent stats (`AgentStatsCharts.tsx:41`, `AgentStatsTable.tsx:23`),
the filter bar (`BookingsFilters.tsx:30`), status chips (`lib/bookings/status.ts:55`), and the
guest and staff email templates (`emails/index.tsx:28,113,134`, `emails/emailTemplate.tsx:54`,
`emails/staffNotificationEmail.tsx:39`, routed to `STAFF_EMAILS.kitesurfing`).

It is **written** by no guest-facing path at all. The only two callers of `createBooking` are
`/day-use/booking` (`service: "day-use"`) and `/kitesurfing/booking/pharaoh`
(`service: "pharaoh-airstyle"`, `pharaoh/page.tsx:92,119`).

This is consistent with the owner's statement that the kitesurfing function here is retired. It
means a whole operational pipeline in this repo is dead weight for kitesurfing — see §5.

### Live liability: the orphan is public and indexable

`proxy.ts` has no rule for `/kitesurfing/booking`, so it is publicly reachable.
`app/(root)/kitesurfing/booking/layout.tsx` sets metadata with `path: "/kitesurfing/booking"`, and
`lib/metadata.ts:27` turns that into `alternates.canonical` — so the page advertises itself as
canonical. There is **no `app/sitemap.ts` and no `robots.txt`** in the repo to exclude it.

A search engine, an old WhatsApp message, or a bookmark can reach that form today. A submission
silently creates a phantom `RESERVED` lesson seat, a shadow user account, and a confirmation email
to the guest — inside a system nobody is watching, for a service this project no longer runs.

**This should be closed before anything else on this page is designed.**

---

## 2. The decision

Given that the school app owns kitesurfing, there are three honest shapes. The question is not
"which system should own the booking" — that is settled — but **where the form should be rendered**.

### Option A — Link out (status quo, tidied)

Keep sending guests to the school app; make the handoff deliberate rather than accidental.

- Carry course context in the URL: `…/book?course=beginner&source=finskitesurfing`.
- One label per destination, `target="_blank" rel="noopener noreferrer"`, visible external cue.
- Delete the orphan form.

**For:** no API, no contract, no dual maintenance, one source of truth, shippable this week.
**Against:** a cross-domain jump at the moment of highest intent. This matters more than usual here
— PRODUCT.md records WhatsApp as the primary guest channel, and a cross-domain jump inside the
WhatsApp in-app browser is where sessions die. The guest also leaves the neumorphic world for a
different-looking app with no return path.

### Option B — Host the form here, write through to the school app (what the owner described)

Form renders at `finskitesurfing.com/kitesurfing/book`; a server action POSTs to an endpoint the
school app exposes; the school app remains the only system of record.

**For:** no domain jump; course context is native rather than smuggled through a query string; the
brand and the design system hold all the way through the commitment; this site controls the form's
accessibility, copy, and mobile behaviour; one funnel to instrument.
**Against:** it needs the other project to expose and maintain an authenticated write endpoint, and
it introduces a second failure mode (school app down or slow) that this site must handle without
losing the guest.

**The rule that makes Option B safe:** the form must be **write-through only**. It must not create a
`Booking`, a `LessonBooking`, or a `User` in this database. The moment it writes locally as well,
there are two records of one booking and the drift problem returns in a worse form. If the POST
fails, the correct fallback is to hand the guest to WhatsApp — the channel PRODUCT.md says the
business actually runs on — not to quietly persist a local row.

### Option C — Embed the school app's form in an iframe

Not recommended. Third-party cookie and storage restrictions make it fragile, the height cannot be
managed cleanly on mobile, the styling cannot be reconciled, and errors inside the frame are
invisible to this site. It looks like Option B and behaves like Option A at its worst.

---

## 3. Recommendation

**Do Option A's cleanup now, then Option B when the school app can expose an endpoint.**

The two are not alternatives — A's work is a prerequisite for B and is valuable on its own. Staging
it this way means the leak, the liability, and the label confusion are gone within a day, without
blocking on the other project's roadmap.

### Phase 0 — this week, no dependency on the school app

1. **Neutralise `/kitesurfing/booking`.** Delete the route, or if the form is wanted as the shell
   for Phase 1, strip the `createKitesurfingBookingFromPublic` call, keep it out of the index
   (`robots`, and remove the canonical), and gate it behind a flag. Do not leave a public form
   wired to a live write.
2. **Retire `createKitesurfingBookingFromPublic`** once nothing calls it. Its user-creation side
   effect is the part to be most careful about.
3. **One label per destination.** "Book a session" / "Book" / "Book now" currently span three
   systems. Reserve "Book a course" for kitesurfing (school app) and give the membership tiers
   their own verb, since they go to `/day-use/booking` — a day-use form reached from a kitesurfing
   page is its own confusion.
4. **Carry course context outbound** — `?course=<slug>` on every kitesurfing CTA, with the slug
   matching the course detail routes (`beginner-course`, `intro-course`, `refresher-course`, kids).
   This is worth doing even under Option A, and it is the same slug Phase 1 will send in its
   payload.
5. **Mark the handoff.** `target="_blank" rel="noopener noreferrer"` plus a visible external
   indicator, so the jump is a choice rather than a surprise.

### Phase 1 — when the school app can expose an endpoint

Build the write-through form. The contract below is the part that needs the other project's
agreement; everything else is local work.

---

## 4. What the school app has to provide (Phase 1 contract)

This is the list to take to the other project. None of it can be decided from this repo alone.

**Endpoint.** `POST https://school.finskitesurfing.com/api/bookings` (name to confirm), JSON in,
JSON out.

**Authentication.** A server-side shared secret or signed request. It must never be exposed to the
browser — the call belongs in a server action, not client-side `fetch`. Store as an env var
alongside the existing `.env` entries; never in `lib/constants`.

**Request payload — the fields this site can supply today:**

| Field | Source | Notes |
|---|---|---|
| `course` | the CTA the guest pressed | slug: `beginner`, `intro`, `refresher`, `kids`, `pharaoh`? |
| `name`, `email`, `phone` | form | `phoneSchema` / `emailSchema` in `lib/validators.ts` already exist |
| `date`, `time` | form | the existing form's date picker + 13 slots is a reasonable starting point |
| `participants` | form | needed for group vs private — the retired form could not express this |
| `notes` | form | optional |
| `source` | constant | `finskitesurfing.com` — so the school app can attribute the funnel |
| `idempotencyKey` | generated | see below |

**Response.** At minimum a booking reference to show the guest, and a stable status. If the school
app can return a payment link, this site should hand it straight to the guest rather than
describing it.

**Decisions the other project must make:**

1. **Idempotency.** A guest who double-taps on a flaky mobile connection must not create two
   bookings. Either the endpoint accepts an `idempotencyKey` and de-duplicates, or this site cannot
   safely retry — and if it cannot retry, every transient network error becomes a lost booking.
2. **Validation authority.** Which side rejects a fully-booked date, a past date, an invalid phone?
   Duplicated rules drift. Prefer: this site does format validation only, the school app owns
   availability and capacity, and its error messages are surfaced verbatim.
3. **Course and price truth.** Course names, durations and prices are currently hardcoded in this
   repo (`CoursesSection.tsx`, `beginner-course/page.tsx`, etc.). If the school app owns pricing,
   this site should read it, not restate it — `lib/pricing.ts` opens with the rule that restating a
   price on the guest path already caused a 750-vs-600 EGP contradiction between the advert and the
   checkout. An endpoint returning the course catalogue would remove that class of bug permanently.
4. **Failure behaviour.** What should the guest see when the school app is unreachable? Recommended:
   keep their typed details on screen, say plainly that the booking was not sent, and offer the
   WhatsApp deep-link with the details pre-filled. Never a silent local write.

---

## 5. Cleanup this decision implies

If kitesurfing is fully owned by the school app, a substantial amount of this repo is now vestigial
for kitesurfing. **Confirm against the database before deleting anything** — staff can still create
a `kitesurfing-course` booking by hand via `BookingEditForm.tsx:358`, so legacy rows may exist and
may still need their desk views.

Candidates, in rough order of confidence:

- `app/(root)/kitesurfing/booking/` (the orphan) and `createKitesurfingBookingFromPublic`.
- The `kitesurfing-course` branch of the guest and staff email templates, if no new rows can be
  created.
- `/bookings/kitesurfing`, the kitesurfing feed on `/bookings/schedule`, and the kitesurfing service
  option in `BookingEditForm` — **only** once a `SELECT count(*) FROM "Booking" WHERE service =
  'kitesurfing-course'` comes back empty, or the remaining rows are archived.
- ~~`components/shared/hero/KitesurfingHero.tsx` is already dead code~~ — **this was wrong.**
  `components/shared/hero/index.tsx` imports it and lists it in `heroComponents`, the homepage hero
  carousel rendered by `app/(root)/page.tsx`. It is one of three live slides. It did carry its own
  copy of the external booking URL; that was fixed on 2026-09-01 by routing its CTA through
  `BookCourseLink` rather than by deleting the component.

---

## 6. Open questions for the owner

1. **Is Pharaoh Airstyle also moving to the school app?** It is the one kitesurfing-adjacent flow
   that still books into *this* database (`service: "pharaoh-airstyle"`, `createBooking`). If it
   stays, this repo keeps a kitesurfing booking path and the cleanup in §5 narrows considerably.
2. **Do live `kitesurfing-course` bookings exist in this database?** Determines how much of §5 is
   deletion and how much is archival.
3. **Route name.** The existing internal route is `/kitesurfing/booking`; the target discussed was
   `/kitesurfing/book`. If the URL changes, the old path needs a redirect — it is canonical-tagged
   today and may be indexed.
4. **Memberships.** All three tiers currently send guests to `/day-use/booking` from a kitesurfing
   page. Is day-use the right owner of beach-access memberships, or should they have their own flow?
5. **Timeline for the school-app endpoint.** Phase 0 is worth doing regardless; Phase 1's cost is
   almost entirely the other project's.

---

## 7. Recommended next step

Approve Phase 0 and I will implement it: close the public orphan, unify the labels, and add course
context to the outbound links. That removes the liability and the confusion immediately, and leaves
the site in exactly the shape Phase 1 needs whenever the school app is ready.
