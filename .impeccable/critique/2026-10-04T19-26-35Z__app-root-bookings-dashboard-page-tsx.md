---
target: /bookings/dashboard page
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/audrius/Documents/fins-2026/app/(root)/bookings/dashboard/page.tsx"
target_fingerprint: "sha256:cf2c9565d469a2d573ce32785af5d955404b4238b3439eae5ab156d46c879a94"
target_path: /Users/audrius/Documents/fins-2026/app/(root)/bookings/dashboard/page.tsx
timestamp: 2026-10-04T19-26-35Z
slug: app-root-bookings-dashboard-page-tsx
closed: true
---
# Critique: /bookings/dashboard — 19/40 (Poor)
Method: dual-agent. Source-only review; live route returned 404 (dev server on :3000 likely not serving this checkout). Detector: 0 findings on dashboard folder + BookingCalendar.tsx.

Heuristics: 1:2 2:2 3:2 4:2 5:2 6:1 7:2 8:2 9:1 10:3

## Priority issues
- [P0] Page cannot answer "confirmed? owes? send next?" — no money/action queues (waiting payment, expiring 24h holds, today's arrivals). Fix: Today strip with actionable counts linking to filtered lists. distill → shape.
- [P1] Legibility below PRODUCT.md floor: 9–10px labels/counts (page.tsx:120,155,195,245,260; BookingCalendar.tsx:50,54); #b0a89f ~2.3:1, #f59e0b text ~2.1:1, amber-600 ~3.2:1; weight-100 numerals. harden.
- [P1] Mobile likely breaks at 390px: non-wrapping 4-link header (page.tsx:117-143), grid-cols-3 5rem stats (192), unwrapped service nav (259), ~28px tab targets (171). adapt.
- [P2] Stats fixed to current month while calendar pages (page.tsx:83 vs BookingCalendar.tsx:26); status tabs don't filter calendar (page.tsx:63); no green/amber legend; "Pending" merges 4 statuses incl. WAITING_PAYMENT. clarify.
- [P2] Global auto-confirm toggle fires in one tap in prime position; name misleads (it means WAITING_PAYMENT). distill.

## Minor
Silent `[]` on count load failure reads as empty day (page.tsx:61); yyyy-MM-dd parsed as UTC (page.tsx:79,224); duplicated DayCount type; unexplained em-dash empty state; hardcoded hex vs tokens; redundant force-dynamic + revalidate=0.
