---
type: "query"
date: "2026-08-24T07:47:43.117520+00:00"
question: "for the online flash payment method, where is the callback url?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["webhook/route.ts", "POST()", "createPaymentOrder()"]
---

# Q: for the online flash payment method, where is the callback url?

## Answer

Expanded from original query via graph vocab: [flash, online, payment, webhook, route, order]. The Flash payment notification callback (webhook) is https://www.finskitesurfing.com/api/payments/flash/webhook. Its handler is app/api/payments/flash/webhook/route.ts. Register ${NEXT_PUBLIC_SERVER_URL}/api/payments/flash/webhook with Flash. The order-creation request does not currently send a customer-browser return or redirect URL.

## Outcome

- Signal: useful

## Source Nodes

- webhook/route.ts
- POST()
- createPaymentOrder()