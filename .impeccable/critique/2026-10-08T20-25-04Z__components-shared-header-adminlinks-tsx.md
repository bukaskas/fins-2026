---
target: admin links design
total_score: 17
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 2
target_identity: "file:/Users/audrius/Documents/fins-2026/components/shared/header/adminLinks.tsx"
target_fingerprint: "sha256:e43f1d342b0b70fae49cfc911e3d9d3bba4fd9a371d7bc39c2d53aed2d5e32a4"
target_path: /Users/audrius/Documents/fins-2026/components/shared/header/adminLinks.tsx
timestamp: 2026-10-08T20-25-04Z
slug: components-shared-header-adminlinks-tsx
closed: true
---
# Critique: admin links (components/shared/header/adminLinks.tsx)
Method: dual-agent. Score 17/36 (heuristic 9 n/a). Detector: 0 findings; no browser evidence.

Priority issues:
- P1 No current-page state (usePathname / aria-current) in desktop dropdown or mobile list.
- P1 Desktop dropdown off-system: w-44, ~32px items, stock shadcn popover vs neumorphic header.
- P2 Grouping/labels mislead: Dashboard and All Bookings under Day Use; Lessons -> /bookings/schedule; two Dashboards; "+ Kite Service" grammar.
- P2 Hardcoded #8898aa x5; muted label contrast (text-muted-foreground, neu-muted/80).
- P3 Trigger h-8 with no chevron; mobile links ~36px vs 44px; close button 32px; absolute right-5 collision at md.
