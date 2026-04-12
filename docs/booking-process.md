# Guest Booking Process
_Standard Operating Procedure — Fins Beach Club_

---

## Overview

This document describes the end-to-end booking workflow from the moment a guest submits a reservation request on the website to the point where staff confirm or decline it.

---

## Step 1 — Guest Submits Booking Form

The guest fills out the booking form on the website, providing:

- **Name**
- **Email**
- **Phone number**
- **Service** (e.g. kitesurfing lesson, day use, etc.)
- **Date** and preferred **time**
- **Number of people**
- Optionally: preferred **instructor**

On submission, a `Booking` record is created in the system with:

- `bookingStatus: PENDING`
- `paymentStatus: UNPAID`

---

## Step 2 — Guest Receives Confirmation Email

Immediately after submitting, the guest receives an automated email confirming their request has been received. The email includes:

- A summary of their booking details
- A note that the booking is **pending staff review**
- A contact phone number for questions (staffed during advertised hours)
- _(Optional)_ A WhatsApp link for easier one-tap contact

> **Note:** The contact phone number in this email must be staffed during advertised hours.

---

## Step 3 — Staff Receives Booking Notification

Staff receive a notification (email, WhatsApp group, or internal system) containing:

- Guest name, email, and phone
- Requested service, date, time, and number of people
- A prompt to review the guest's social media profile before confirming

> **Configure:** Notifications can be sent to a shared inbox, WhatsApp group, or internal system — set this up per your operational preference.

---

## Step 4 — Staff Reviews Guest & Confirms or Cancels

Staff review the guest's details. Standard vetting steps:

1. Check the guest's social media profile
2. If the profile is private with no mutual connections, **request a referral name** rather than automatically declining
3. Decide to **Confirm** or **Decline**

### Staff action in the system

Navigate to **Admin → Bookings** and update the booking:

| Action       | `bookingStatus` set to | Next step                            |
| ------------ | ---------------------- | ------------------------------------ |
| Confirm      | `CONFIRMED`            | Send confirmation message to guest   |
| Decline      | `DECLINED`             | Send polite decline message to guest |
| Cancel later | `CANCELED`             | No further action needed             |

### Sample WhatsApp messages

**Requesting social account:**

> Hi [Guest Name], thank you for your booking request at Fins Beach Club! Could you please share your Instagram or Facebook profile so we can complete your reservation? Looking forward to welcoming you!

**Booking confirmed:**

> Hi [Guest Name], great news — your booking at Fins Beach Club is confirmed for [Date] at [Time]. Please arrive 15 minutes early. See you soon! Any questions, reach us at +20 XXX XXX XXXX.

**Booking declined:**

> Hi [Guest Name], thank you for your interest in Fins Beach Club. Unfortunately we're unable to accommodate your request on this occasion. We hope to welcome you in the future!

---

## Process Overview
