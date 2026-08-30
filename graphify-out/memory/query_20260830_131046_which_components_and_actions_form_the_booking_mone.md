---
type: "query"
date: "2026-08-30T13:10:46.531875+00:00"
question: "Which components and actions form the booking money path that needs focus, contrast, type-size, accessible-name, and touch-target fixes?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["BookingComponent.tsx", "PayDepositDialog.tsx", "payBookingDeposit()", "createBookingPaymentLink()", "DepositPaymentsPage()", "booking.actions.ts"]
---

# Q: Which components and actions form the booking money path that needs focus, contrast, type-size, accessible-name, and touch-target fixes?

## Answer

Expanded from original query via graph vocabulary: [booking, payment, deposit, balance, amount, paid, record, dialog, action, wallet, ledger, status]. The graph shows BookingComponent.tsx as the shared staff-row entry, PayDepositDialog.tsx and payBookingDeposit() as the manual payment path, NextStepCard/PayDepositOnline through createBookingPaymentLink() as the guest checkout path, and DepositPaymentsPage() as the staff ledger surface. The audit therefore covered those connected entry points and their status/payment actions rather than treating the modal in isolation.

## Outcome

- Signal: useful

## Source Nodes

- BookingComponent.tsx
- PayDepositDialog.tsx
- payBookingDeposit()
- createBookingPaymentLink()
- DepositPaymentsPage()
- booking.actions.ts