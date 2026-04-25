# Kitesurfing Session Guide

This document explains how kitesurfing sessions work in the system — from a customer booking arriving, to assigning an instructor, to marking a session complete.

---

## Key Concepts

| Term | What it is |
|------|-----------|
| **LessonSession** | The actual time slot: who teaches, when, what type of lesson |
| **LessonBooking** | A guest's reservation in a session — holds their status (RESERVED → CONFIRMED → COMPLETED) |
| **Instructor** | A staff user with the INSTRUCTOR role — shown as a column on the Schedule Board |

---

## Two Ways a Session Enters the System

### Path A — Customer Books via the Public Form

**URL:** `/kitesurfing/booking`

1. Customer fills in: name, email, phone, preferred date & time, notes
2. System automatically:
   - Creates or finds the customer's user account
   - Creates a **LessonSession** (type: PRIVATE, duration: 2 h, instructor: **unassigned**)
   - Creates a **LessonBooking** for the customer (status: **RESERVED**)
3. Customer receives a confirmation email
4. The session appears in the **Unassigned** section of the Schedule Board — staff must assign an instructor (see below)

---

### Path B — Staff Creates a Session Manually

**URL:** `/lessons/new`

1. Navigate to **Lessons → New Lesson**
2. Fill in:
   - **Student** — search and select an existing user (the student must already have an account in the system)
   - **Instructor** — select which instructor will take the session
   - **Date & Time** — start of the session
   - **Duration** — set **Hours** (whole number) and **Minutes** (0 / 15 / 30 / 45)
   - **Lesson Type** — PRIVATE / GROUP / FOIL / KIDS / EXTRA_PRIVATE / EXTRA_GROUP
3. Submit → session is saved with status **CONFIRMED** and the instructor already assigned

---

## Assigning an Instructor (Path A sessions)

After a public booking comes in the session has no instructor. Assign one via either method:

### Option 1 — Drag & Drop on the Schedule Board

**URL:** `/bookings/schedule`

1. Use the date picker to select the date of the unassigned session
2. Find the session card in the **Unassigned** section at the bottom of the board
3. Drag the card onto the desired instructor's column at the correct time row
4. The card snaps into the slot — a yellow **"X unsaved"** badge appears at the top
5. Click **Save** to persist the assignment to the database

### Option 2 — Edit Sheet

1. On the Schedule Board or Lesson Bookings Table, click the **pencil icon** on the session card or row
2. In the edit sheet, change the **Instructor** field to the correct person
3. Adjust date/time if needed
4. Click **Save**

---

## Session Status Flow

```
RESERVED  →  CONFIRMED  →  COMPLETED
                 ↓               ↓
              CANCELED       NO_SHOW
```

| Status | Meaning |
|--------|---------|
| RESERVED | Booking received, not yet confirmed with the customer |
| CONFIRMED | Instructor assigned, customer confirmed |
| COMPLETED | Session took place |
| NO_SHOW | Customer did not show up |
| CANCELED | Session was canceled |

**How to change status:** Open the edit sheet (pencil icon on the Schedule Board or Lesson Bookings Table) and update the Status field.

---

## Where to View & Manage Sessions

| Page | URL | Use for |
|------|-----|---------|
| **Schedule Board** | `/bookings/schedule` | Daily view, drag-drop instructor assignment, quick edits |
| **Lessons List** | `/lessons` | All sessions — student, instructor, duration, status |
| **Lesson Bookings Table** | `/bookings/schedule` (lower section) | Filter by instructor, edit status, view guest contact |
| **New Lesson** | `/lessons/new` | Manually create a session with instructor pre-assigned |

---

## Quick Reference: Step-by-Step for a New Customer Booking

1. Customer submits booking at `/kitesurfing/booking` → email confirmation sent automatically
2. Go to `/bookings/schedule`, pick the booking date
3. Find the new session in **Unassigned**
4. Drag it to the instructor's slot (or use the pencil edit sheet)
5. Click **Save**
6. Open the edit sheet → change status from **RESERVED** to **CONFIRMED**
7. Optionally send a WhatsApp message to the guest from the booking row to confirm details
