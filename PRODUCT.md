# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: front-desk staff at the centre.** They work in a mixed-device scene that both matter equally — personal phones while moving around the property (portrait, outdoors, bright Red Sea sun) and a desk computer at the counter. They are usually mid-conversation: a guest is standing at the desk or waiting on the phone, so every second of hesitation is visible to a customer.

The `RECEPTION` role is the day-to-day desk operator. `ADMIN`, `OWNER` and `STAFF` do the same work with wider reach. `lib/permissions.ts` is the authority on who may do what — capabilities (`bookings:manage`, `desk:checkin`, `desk:collect`, …), never hardcoded role arrays.

**Secondary: guests.** They receive a private per-booking link and read it on their own phone. They are not logged in and never see staff controls. Other roles in the system: `ACCOUNTANT`, `INSTRUCTOR`, `KITER`, `MEMBER`, `DAYPASS`.

## Product Purpose

Fins is a kitesurfing centre, beach club and restaurant near Ain Sokhna, Egypt (`finskitesurfing.com`). This application runs the whole operation in one place: bookings, kitesurfing lessons and sessions, day use, restaurant reservations, beach use, rentals and inventory, orders and payments, an append-only wallet ledger, accounting, and staff/instructor administration.

Success is a booking moving cleanly from enquiry to a guest standing on the beach, with the money recorded correctly and the guest never left uncertain about what happens next.

## Positioning

The operating reality this system is built around, which a generic booking SaaS does not model: **payment arrives through WhatsApp and human trust, not through a checkout funnel.** A booking is held for 24 hours, a card link is minted through the Flash gateway, and when that fails the fallback is a bank transfer to an Arab African account proven by the guest sending a screenshot over WhatsApp. Staff chase, confirm and reassure over WhatsApp; the booking record exists to support that conversation.

## Operating Context

- **WhatsApp is the primary guest channel.** Staff send the private booking link over WhatsApp, and that page is the guest's real confirmation. The Resend email is secondary.
- The desk's most frequent job on a single booking is **composing the next message to that guest** — a deposit request, a payment chase, arrival details, a confirmation.
- One physical location. Currency is EGP. Working hours and daily capacity are business facts held in `lib/constants` (`DAILY_CAPACITY = 80` auto-closes a date for new bookings).
- A booking moves through nine statuses (`PENDING`, `REQUEST_SENT`, `UNDER_REVIEW`, `WAITING_PAYMENT`, `CONFIRMED`, `ARRIVED`, `DECLINED`, `NO_RESPONSE_EXPIRED`, `CANCELED`). Several carry real machinery: `WAITING_PAYMENT` starts an irreversible 24-hour auto-cancel clock swept by a cron route and mints a payment link; `CONFIRMED` can close the whole date at capacity.
- Services sold: kitesurfing courses (beginner, intro, refresher, Pharaoh Airstyle), day use, restaurant, corporate bookings.

## Capabilities and Constraints

- **Language is English only** — staff interface and guest-facing messages alike. No RTL requirement.
- **Money is always integer cents** (`*Cents` field suffix). The `WalletLedger` table is append-only: insert rows, never update or delete them.
- Authorisation is capability-based via `lib/permissions.ts` and enforced at the edge in `proxy.ts`. Surfaces must ask for a capability, not a role list.
- `/bookings/<uuid>` is **deliberately public** (`proxy.ts:34`) so an unauthenticated guest can open their own booking. Any path with a further segment is staff-only.
- Data layer is server actions in `lib/actions/*.actions.ts`; there is no REST or tRPC layer. Neon serverless Postgres via Prisma. NextAuth v4 credentials with 30-day JWT sessions.
- Both phone and desktop are first-class targets for staff surfaces; neither is a degraded fallback.
- No test runner is configured.

## Brand Commitments

Name: **Fins** (`Fins kitesurfing center`). Voice in guest-facing copy is warm, direct and plain — it states policy without hedging (non-refundable, cannot be postponed, 24 hours to pay). Icons are Lucide only, never emoji.

## Evidence on Hand

Real, in-repo: the booking/lesson/rental/accounting schema and server actions; React Email templates in `emails/`; the public site content under `app/(root)/`; the reception dashboard and its component vocabulary (`components/reception/`); real business constants (location, capacity, contact details) in `lib/constants`.

No customer testimonials, press, case studies, pricing claims or usage statistics have been established. Future work must not invent them. Demonstration data must be authored and labelled as synthetic.

## Product Principles

1. **The conversation is the product.** A booking screen exists to help staff say the right thing to a guest who is waiting, not to display a database row.
2. **Never make staff hesitate in front of a guest.** The three desk questions — are they confirmed, what do they owe, what do I send next — are answered instantly or the surface has failed.
3. **Money and promises are irreversible; say so before the tap.** Every write that moves money, confirms a booking, or starts a countdown states its consequence in visible text and leaves a record of who did it.
4. **Guest surfaces and staff surfaces are different products.** They share truth and a visual system, never a layout or a voice.
5. **Ask for a capability, never a role.** Adding a role must be a change to `lib/permissions.ts` alone.

## Accessibility & Inclusion

Staff read these screens outdoors in strong sunlight on small phones, so contrast and type size are operational requirements, not compliance checkboxes: text at 4.5:1 or better, no text below 12px, tap targets at 44px, and a visible focus ring on every control on the money path.
