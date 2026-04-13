# Day Use Booking Process

_Standard Operating Procedure — Fins Beach Club_

---

## Overview

This document describes the end-to-end day use booking workflow — from the moment a guest submits a reservation request on the website, through staff review and confirmation, to guest arrival and physical check-in on the day.

---

## Step 1 — Guest Submits Day Use Booking Form

The guest navigates to `/day-use` and clicks **Make a Reservation**, which takes them to `/day-use/booking`.

**Form fields:**

| Field            | Required | Details                                           |
| ---------------- | -------- | ------------------------------------------------- |
| Full Name        | Yes      | First and family name (min 2 characters)          |
| Email            | Yes      | Valid email address                               |
| Phone            | Yes      | International format, default country Egypt (+20) |
| Number of People | Yes      | Minimum 1                                         |
| Date             | Yes      | Future dates only — defaults to tomorrow          |
| Arrival Time     | No       | 30-minute intervals from 09:00 to 17:00           |

The service is automatically set to `"day-use"` and no instructor is assigned.

**On submission, the system:**

1. Validates the form data
2. Creates a `Booking` record in the database with:
   - `bookingStatus: PENDING`
   - `paymentStatus: UNPAID`
3. Sends an automated email to the guest
4. Sends a notification email to staff
5. Redirects the guest to a success page

---

## Step 2 — Guest Sees Success Page

After submitting, the guest is redirected to `/day-use/booking/success` which shows:

- A confirmation that the booking was **received** (not yet confirmed)
- Their **Booking ID** and selected **date**
- The message: _"You should receive an email with info regarding your booking shortly."_
- A **Contact Us** button linking to WhatsApp (`wa.me/201080500099`)

---

## Step 3 — Guest Receives Confirmation Email

The guest receives an automated email immediately after submitting:

> **Subject:** Welcome to Fins kitesurfing center!
>
> **Heading:** Your beach day is booked!
>
> **Body:** We can't wait to host you on [Date]. Get ready to relax and enjoy the beach, sun, and sea at Fins. If you have any questions or special requests, feel free to reach out.
>
> **CTA button:** Contact us on WhatsApp → `wa.me/201080500099`

> **Note:** This email is sent from `info@finskitesurfing.com`. The WhatsApp number must be staffed during advertised hours.

---

## Step 4 — Staff Receives Booking Notification

Staff receive a notification email routed to the address configured in `STAFF_EMAIL_DAY_USE` (environment variable). The email contains:

| Field            | Value                  |
| ---------------- | ---------------------- |
| Customer name    | As entered in the form |
| Customer email   | As entered in the form |
| Customer phone   | As entered in the form |
| Service          | `day-use`              |
| Date             | Selected arrival date  |
| Number of people | As entered in the form |

> **Configure:** Set `STAFF_EMAIL_DAY_USE` in your `.env` file to route notifications to the correct inbox, WhatsApp group, or internal system.

---

## Step 5 — Staff Reviews Guest & Confirms or Declines

Staff review the guest's details before confirming the booking.

**Standard vetting steps:**

1. Check the guest's social media profile (Instagram or Facebook)
2. If the profile is private with no mutual connections, **request a referral name** rather than automatically declining
3. Decide to **Confirm** or **Decline**

### Staff action in the system

Navigate to **Admin → Bookings** (`/bookings`) and update the booking status:

| Action       | `bookingStatus` set to | Next step                            |
| ------------ | ---------------------- | ------------------------------------ |
| Confirm      | `CONFIRMED`            | Send confirmation message to guest   |
| Decline      | `DECLINED`             | Send polite decline message to guest |
| Cancel later | `CANCELED`             | No further action needed             |

### Sample WhatsApp messages

**Requesting social account:**

> Hi [Guest Name], thank you for your day use booking request at Fins Beach Club! Could you please share your Instagram or Facebook profile so we can complete your reservation? Looking forward to welcoming you!

**Booking confirmed:**

> Hi [Guest Name], great news — your day use booking at Fins Beach Club is confirmed for [Date]. Arrival time [Time or "whenever you like"]. See you soon! Any questions, reach us at +20 XXX XXX XXXX.

**Booking declined:**

> Hi [Guest Name], thank you for your interest in Fins Beach Club. Unfortunately we're unable to accommodate your request on this occasion. We hope to welcome you in the future!

---

## Step 6 — Guest Arrives: Staff Check-In

When the guest arrives, staff check them in via **Admin → Add Services** (`/register`).

Search for the guest by name, email, or phone, then click **Add Beach Use** on their card — this triggers `quickAddBeachUse`, which processes the visit automatically using the following priority logic:

### Check-in priority order

**1. Active membership** → free entry

- System checks for a `Member` record where `validUntil >= today`
- Creates a `BeachVisit` with type `MEMBER_FREE`, status `OPEN`
- No charge is applied

**2. Pre-paid wallet credits** → deduct 1 entry credit

- System checks the guest's `BEACH_USE` wallet for a balance ≥ 1 entry
- Creates a `BeachVisit` with type `REGULAR`, status `OPEN`
- Deducts 1 credit from the wallet and logs a `WalletLedger` entry (`reason: CONSUMPTION`)

**3. No membership, no credits** → create outstanding order

- Creates a `BeachVisit` with type `REGULAR`, status `OPEN`
- Creates an open `Order` for the outstanding balance:

| Guest role | Price                      |
| ---------- | -------------------------- |
| Regular    | **500 EGP**                |
| OWNER      | **400 EGP** (20% discount) |

- An `OrderLine` is created linked to product SKU `BEACH_USE_DAY`
- Payment is collected separately via the accounting system

---

## Process Overview

```
Guest fills day use form (/day-use/booking)
              ↓
  Booking created (PENDING / UNPAID)
              ↓
  ┌─────────────────────────────┐
  │  Guest sees success page    │
  │  + receives email           │
  └─────────────────────────────┘
              ↓
  Staff receive notification email
              ↓
  Staff review guest profile
              ↓
       ┌─────────────┐
       │             │
  CONFIRMED      DECLINED
       │             │
  WhatsApp msg   WhatsApp msg
  to guest       to guest
       │
  Guest arrives on the day
       │
  Staff check in via Add Services (/register)
       │
       ├── Active membership? → MEMBER_FREE (free)
       ├── Wallet credits?    → REGULAR (consume 1 credit)
       └── Neither?           → REGULAR (500 EGP order created)
```

---

## Notes & Customisation

- Set `STAFF_EMAIL_DAY_USE` in `.env` to the staff inbox that handles day use bookings.
- The WhatsApp contact number (`201080500099`) appears in both the guest email CTA and the success page — update it in `emails/emailTemplate.tsx` and `app/(root)/day-use/booking/success/page.tsx`.
- Replace all `[Guest Name]`, `[Date]`, `[Time]`, and `+20 XXX XXX XXXX` placeholders in sample messages before going live.
- **Arrival time** field is optional — if not set, treat arrival as open/flexible.
- **OWNER discount** (20% off) is automatic based on the guest's account `role` — no manual step required.
- For guests purchasing pre-paid beach entry bundles, direct them to the relevant product — this adds wallet credits used at check-in (Step 6, path 2).
- Keep a log of confirmed, pending, and declined bookings to identify patterns (Admin → Bookings at `/bookings`).
