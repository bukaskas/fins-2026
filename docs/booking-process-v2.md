BOOKING SYSTEM
Status & Workflow Documentation
Fins Beach & Soul Kite School  |  Version 1.0  |  2026

 

1. Overview

This document defines the complete booking lifecycle for Fins Beach and Soul Kite School. Each booking passes through a structured status workflow that ensures guests meet venue requirements before payment is collected, protecting both the business and the guest experience.
 

2. Booking Status Flow

The standard booking journey follows this sequence:
 
PENDING
→
REQUEST SENT
→
UNDER REVIEW
→
WAITING PAYMENT
→
CONFIRMED
↘
CANCELLED
 
 
 
DECLINED
←
NO RESPONSE / EXPIRED
 
 
Branch notes: DECLINED and NO RESPONSE/EXPIRED can occur after Under Review. CANCELLED applies after Confirmed.
 
 

3. Status Definitions

 
Status
Description
Required Action
Responsible
 
PENDING
Booking enquiry received. Social media request not yet sent to guest.
Send social media request to guest
Admin / Staff
 
REQUEST SENT
Guest has received the social media profile request. Awaiting their response.
Monitor for guest response
System / Admin
 
UNDER REVIEW
Guest has shared their social media. Staff is reviewing profile to verify it matches venue criteria.
Review and approve or decline
Admin / Manager
 
WAITING FOR PAYMENT
Profile approved. Guest has been notified and is expected to send the deposit.
Follow up if no payment within deadline
Admin / Staff
 
CONFIRMED
Deposit received. Booking is fully confirmed. Guest should receive confirmation details.
Send confirmation to guest
Admin / System
 
DECLINED
Guest social media profile did not meet venue criteria. Booking is rejected.
Notify guest politely of decision
Admin / Manager
 
NO RESPONSE / EXPIRED
Guest did not respond to the social media request within the allowed timeframe. Booking expired automatically.
Send reminder or close booking
System / Admin
 
CANCELLED
Booking was cancelled after confirmation. Apply deposit refund policy as applicable.
Apply deposit policy, notify guest
Admin / Manager
 
 

4. Transition Rules

 
Allowed Status Transitions

 
From
To
Condition
Pending
Request Sent
Social media request sent to guest
Request Sent
Under Review
Guest shares their social media profile
Request Sent
No Response / Expired
Guest does not respond within set timeframe
Under Review
Waiting for Payment
Profile approved by staff
Under Review
Declined
Profile does not meet venue criteria
Waiting for Payment
Confirmed
Guest sends deposit payment
Confirmed
Cancelled
Guest or staff cancels after confirmation
 
 

5. Edge Cases & Policies

 
No Response Policy

• Set a clear response deadline (recommended: 48–72 hours after Request Sent)
• Send one reminder before marking as Expired
• Expired bookings can be reopened manually if guest responds late
 
Cancellation Policy

• Cancellation after Confirmed status triggers deposit review
• Define refund window (e.g. full refund if cancelled 7+ days before event)
• Partial or no refund for late cancellations — to be confirmed by management
 
Declined Profile

• Notify guest with a polite, neutral message — no detailed reason required
• Declined bookings are closed and cannot transition to any other status
• A new booking can be submitted by the same guest if circumstances change
 
 

6. Team Responsibilities

 
Role
Responsibilities
Admin / Staff
Receive new bookings, send social media requests, follow up on pending responses, send payment instructions, confirm bookings upon payment receipt
Manager
Review social media profiles, approve or decline bookings, handle cancellation and refund decisions, resolve edge cases
System / Automation
Auto-expire bookings with no response after defined timeout, trigger notification reminders, log status changes with timestamps
 
 

7. Version History

 
Version
Date
Author
Notes
1.0
April 2026
Audrius
Initial version — 8 statuses defined
 
 

Fins Beach & Soul Kite School — Internal Document — Confidential