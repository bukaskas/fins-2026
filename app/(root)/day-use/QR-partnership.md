# Coffee Shop QR Partnership Plan

## Goal

Place a QR code in a partner coffee shop. A guest who scans it reaches the existing day-use booking flow, sees a 25% partner discount, and creates a booking that permanently records which coffee shop referred it.

The normal `/day-use/booking` flow must continue to work at the standard public price when no valid partnership reference is present.

## Recommended customer journey

1. Fins creates one active partnership record for the coffee shop.
2. The coffee shop QR code points to a stable URL such as:

   ```text
   https://www.finskitesurfing.com/day-use/booking?ref=<public-partner-code>
   ```

3. The booking page validates the reference and shows:
   - The coffee shop name.
   - “Coffee shop partner offer — 25% off day use.”
   - The original price, discounted price, and total savings.
   - A note that the offer is applied automatically; no coupon entry is needed.
4. The guest completes the existing date, ticket, and contact steps.
5. On submission, the server validates the partnership again, calculates the final price, and saves both the discount and coffee shop reference on the booking.
6. The guest and staff emails show the discounted total. The staff email and booking detail also show the partner reference.
7. Staff can filter and report on bookings attributed to the coffee shop.

## Product rules for version 1

- The offer is for the `day-use` service only.
- The discount is 25%, represented as `2500` basis points rather than a floating-point percentage.
- The partner discount is applied once and does not stack with other date or campaign discounts. If more than one discount is eligible, apply the best single discount.
- Unless configured as a blackout, holiday day-use pricing is eligible for 25% off.
- Kids remain 50% of the effective discounted adult price, following the current day-use pricing model.
- The server is the source of truth for eligibility and price. A client-supplied total is never trusted.
- Once a booking is created, its applied discount and partner attribution are frozen for audit purposes, even if the partnership is later renamed, expired, or disabled.
- If the guest changes the party size later, recalculate from the booking’s saved pricing context so the partner discount is not lost.
- If an offer expires between page load and submission, do not silently create a full-price booking. Return an “offer no longer available” result and ask the guest to review the standard price before resubmitting.
- The QR code is a public offer and can be photographed or shared. An opaque reference prevents guessing other campaigns, but it cannot restrict the offer to people physically inside the coffee shop.

## Data model

Add a reusable partnership model rather than hard-coding one coffee shop into the form.

### `BookingPartnership`

Recommended fields:

| Field | Purpose |
| --- | --- |
| `id` | UUID primary key. |
| `name` | Display name, for example `The Coffee Shop`. |
| `reference` | Unique, human-readable internal reference, for example `COFFEE-THE-COFFEE-SHOP-01`. |
| `publicCode` | Unique, non-sequential code used by the QR URL. |
| `service` | Initially fixed to `day-use`; keeps eligibility explicit. |
| `discountBps` | `2500` for 25%. |
| `isActive` | Allows staff to disable the offer without changing the QR. |
| `startsAt` / `endsAt` | Optional campaign validity window. |
| `createdAt` / `updatedAt` | Operational history. |

Add indexes/constraints for `publicCode`, `reference`, `isActive`, and the validity fields used during lookup. Validate `discountBps` in application code as an integer from 0 to 10,000.

### New fields on `Booking`

| Field | Purpose |
| --- | --- |
| `partnershipId` | Nullable relation to `BookingPartnership`. |
| `partnerReference` | Nullable immutable snapshot of the human-readable reference. This is the requested booking reference used in reports. |
| `subtotalPriceCents` | Price before the partner discount, stored for audit and savings calculations. |
| `discountBpsApplied` | Actual discount frozen at booking creation. |
| `discountAmountCents` | Exact saved amount, avoiding later rounding ambiguity. |

Keep `totalPriceCents` as the final amount due. All money remains in integer cents. Partnership records should be deactivated, not deleted; use a restrictive relation or preserve the booking snapshot if deletion is ever allowed.

Create a Prisma migration and seed the first coffee shop partnership. Production values such as the name, reference, validity window, and public code should be supplied intentionally rather than embedded in the UI.

## Pricing changes

Refactor `lib/pricing.ts` so day-use pricing can return a complete, auditable result:

```ts
type DayUsePriceResult = {
  subtotalCents: number;
  discountBpsApplied: number;
  discountAmountCents: number;
  totalCents: number;
  adultUnitCents: number;
  kidsUnitCents: number;
  rateType: "standard" | "holiday" | "discounted" | "partner";
};
```

Pricing order:

1. Calculate the date-appropriate list price for adults and kids.
2. Determine the best single eligible discount.
3. Calculate the discount with integer arithmetic and one documented rounding rule.
4. Return the original subtotal, savings, and final total.

Update every recalculation path, not only initial booking creation. In particular, `createBooking`, `updateBooking`, and `updateBookingParty` must use the saved partnership pricing context. The current email breakdown also recalculates unit prices independently, so it must consume the stored price result or explicit discounted unit values to avoid showing a standard unit price beside a discounted total.

## Booking-page implementation

The current booking page is a client component. Split it into:

- A server page at `app/(root)/day-use/booking/page.tsx` that reads `searchParams.ref` and loads only safe, public partnership fields.
- A client form component that receives a validated offer summary and renders the existing three-step form.

Add a public read action in `lib/actions/partnership.actions.ts` that returns only:

- Partnership display name.
- Public reference/code needed for submission.
- Discount percentage.
- Valid/invalid state and a safe customer-facing reason.

Never return internal IDs or management data unless required. The client should send the public code as attribution context, not a discount amount or final price.

### UI states

- **Valid reference:** show the partner banner on every step and discounted totals wherever prices appear.
- **Missing reference:** retain the current standard day-use flow exactly.
- **Unknown, inactive, or expired reference:** show that the partner offer is unavailable and offer a clear path to continue at the standard price.
- **Submission-time invalidation:** keep the guest’s entered form data and require confirmation of the updated price.

The implementation must follow `.Codex/design-system/MASTER.md` and any page-specific day-use design rules that exist when implementation begins.

## Server-side booking creation

Extend the public booking input with an optional `partnerCode` string. In `createBooking`:

1. Parse and normalize the booking data.
2. When `partnerCode` is present, look up an active partnership for `day-use` and validate its time window and any blackout rules.
3. Calculate the price on the server using that validated partnership.
4. Create the booking with `partnershipId`, `partnerReference`, subtotal, applied basis points, discount amount, and final total in the same database write.
5. Continue the existing returning-customer/auto-confirm status logic unchanged.
6. Send notifications only after the booking is saved.

Do not accept `partnershipId`, `partnerReference`, `discountBpsApplied`, or the discounted total directly from an anonymous client.

## Staff visibility and reporting

Add partner attribution in these places:

- Staff notification email: `Partner: <coffee shop>` and `Reference: <reference>`.
- Staff-only area of `/bookings/[id]`: partner name, reference, subtotal, savings, and final total.
- `/bookings` rows and search: make the reference searchable and optionally add a partnership filter.
- `/bookings/day-use`: add a partnership filter and partner KPIs.

Recommended report values:

- Applied bookings and guests.
- Confirmed bookings and guests.
- Arrived bookings and guests.
- Declined/canceled bookings.
- Gross list value, discount granted, final booked value, and collected amount.
- Conversion from applied to confirmed/arrived.

Keep booking attribution separate from booking agent assignment; a coffee shop is a referral source, not an internal sales agent.

Version 1 only proves attribution from completed bookings. Measuring QR scans and scan-to-booking conversion requires a separate first-party visit/event record or an approved analytics tool and can be added later.

## Email and payment behavior

- Guest email: show the coffee shop offer, original subtotal, 25% savings, and final total.
- Staff email: show the same financial summary plus the internal partner reference.
- Booking detail/payment UI: use the stored final `totalPriceCents`.
- Flash payment/deposit creation should continue deriving amounts from the stored booking total, so no special payment-provider discount logic is needed.

## QR asset and coffee-shop placement

After the production partnership record exists:

1. Build the QR from the production HTTPS URL and never from a temporary deployment URL.
2. Use high error correction and a high-contrast dark code on a plain light background.
3. Keep a quiet zone around the code and print it at a size suitable for table/counter scanning.
4. Put a plain-text fallback URL or short code beneath it.
5. Add a direct call to action, for example: “Scan to book a Fins day use with 25% off.”
6. Test the printed version on both iOS and Android, at different distances and under the coffee shop’s actual lighting.
7. Keep the URL stable. Rotate or disable the database campaign rather than replacing printed QR artwork when possible.

## Implementation sequence

1. Confirm the coffee shop display name, internal reference, campaign dates, holiday eligibility, and any blackout dates.
2. Add the partnership schema, booking attribution/pricing snapshot fields, migration, and seed data.
3. Add the server-side partnership lookup and refactor pricing to support one non-stackable discount.
4. Split the day-use booking page into server and client components and add valid/invalid offer states.
5. Extend validation and `createBooking`; then update all booking edit/recalculation paths.
6. Update guest email, staff email, booking detail, booking list, and day-use report.
7. Generate and print the production QR asset.
8. Run the test matrix below, release behind an inactive partnership, then activate it after the printed QR passes testing.

## Test matrix

### Pricing and eligibility

- Standard date with valid partner reference: exactly 25% off.
- Holiday date: follows the agreed holiday rule.
- Existing discounted date: no double discount.
- Adults only, kids only where permitted, and mixed adult/kid groups.
- Rounding produces the same total in UI, server, emails, booking detail, and payment link.
- Unknown, inactive, not-yet-started, expired, wrong-service, and malformed codes.
- Client attempts to alter the percentage, partnership ID, reference, or total.

### Booking lifecycle

- New and returning customers preserve the existing status behavior.
- Closed-date validation still blocks public bookings.
- Partner fields are saved atomically with the booking.
- Changing party size preserves and correctly reapplies the frozen partner discount.
- Disabling or renaming the partnership does not change historical booking attribution or totals.
- Guest/staff email failure does not corrupt the saved attribution.

### Reporting and access

- Staff can filter by the coffee shop and search by its reference.
- Monthly totals include only the intended partnership bookings.
- Non-staff users do not see internal references or partnership management data.
- Standard non-QR day-use bookings remain unattributed and full price.

### QR and usability

- Production QR opens the correct URL on iOS and Android.
- Refreshing, sharing, or reopening the URL retains the offer.
- The discount is clear before the guest submits.
- Invalid/expired offers never fail silently or unexpectedly charge a higher total.

## Acceptance criteria

- A valid coffee shop QR link displays a 25% day-use offer and discounted price throughout the booking flow.
- The final price is recomputed and validated on the server.
- Each resulting booking stores the coffee shop reference and an auditable discount snapshot.
- Staff can identify and report on coffee-shop bookings without using the internal booking-agent field.
- Emails, booking detail, edits, deposits, and payment links agree on the same final total.
- Invalid or expired references cannot produce a discount and are handled clearly.
- Existing day-use bookings without a partnership reference behave exactly as before.

## Out of scope for version 1

- Restricting the offer to the coffee shop’s physical location.
- Paying commissions or settling balances with the coffee shop.
- A self-service partner portal.
- QR scan analytics before a booking is submitted.
- Combining the coffee shop offer with additional coupons or membership discounts.
