---
target: kitesurfing page
total_score: 17
max_score: 36
na_heuristics: 9
p0_count: 2
p1_count: 2
timestamp: 2026-09-01T09-48-16Z
slug: app-root-kitesurfing-page-tsx
---
Method: dual-agent (A: design review, isolated · B: detector + browser evidence, isolated). Deviation: B returned before A, so detector output reached the parent context first. A never saw B. Parent ran a third verification pass to settle A's one self-flagged uncertainty.

Surface mode: Persuade. Target: app/(root)/kitesurfing/page.tsx (+ components/kitesurfing/*).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | Sticky nav has no active-section state; clicking a nav link updates the URL and moves nothing |
| 2 | Match System / Real World | 3 | Excellent domain vocabulary, but courses run 01 Beginner (22,000 EGP) before 02 Intro (5,500) |
| 3 | User Control and Freedom | 2 | Primary CTA ejects off-domain with no warning or return path; no back-to-top on a 5,654px page |
| 4 | Consistency and Standards | 2 | One "Details & Pricing" affordance does two things; three destinations behind "Book"; Kids modal near-black on pale clay |
| 5 | Error Prevention | 2 | No 24-hour payment window, non-refundable policy, or prerequisites before a 22,000 EGP commitment |
| 6 | Recognition Rather Than Recall | 2 | Rental thead scrolls under sticky nav leaving 14 unlabeled numbers; Kids modal never names the course or number |
| 7 | Flexibility and Efficiency | 1 | Scored, not n/a — page ships real shortcuts (4 anchors + Book pill + sitewide footer deep-links); all broken |
| 8 | Aesthetic and Minimalist Design | 3 | Disciplined and uncluttered; loses a point to four-fold structural monotony and ~950px table gaps |
| 9 | Error Recovery | n/a | No forms, no async operations, no error-producing interaction on this surface |
| 10 | Help and Documentation | 1 | Scored, not n/a — real obligations (what to bring, swim ability, wind season, cancellation) entirely unmet |
| **Total** | | **17/36** | **Poor (47%)** |

n/a: heuristic 9 only. Applicable maximum 36.

H10 carve-out declined deliberately: a grep of the kitesurfing guest surface for cancel|refund|postpone|what to bring|wind season|swim|prerequisit|insurance|weight|age returns nothing, while PRODUCT.md states the voice "states policy without hedging (non-refundable, cannot be postponed, 24 hours to pay)."

## Design Specificity Verdict

The skin is Fins; the bones are generic.

Product-specific: real working photography (instructor holding a student's bar in waist-deep water); domain vocabulary no template supplies (IKO Level 1 & 2, Kite & bar, Bar only, Leash / Helmet, half-day = up to 4 hrs); #E3EBF3 base honouring MASTER.md's stated sky/sea intent.

Category-interchangeable: the same section-header gesture four times (page.tsx:218-241, CoursesSection.tsx:218-241, KitesurfingRentalSection.tsx:22-45, MembershipSections.tsx:37-60) — 28px rule + uppercase 0.3em eyebrow + two-line clamp() headline split light/heavy + right-aligned muted paragraph in max-w-xs. The canonical SaaS 3-tier pricing table, unmodified. "Master the Wind." could headline a paragliding centre or a cologne.

Largest missed opportunity: a Red Sea kite centre whose product depends on wind never mentions wind as a condition — no season, no best months, no no-wind policy — while TideWidget.tsx sits unused and beginner-course/page.tsx:45 already writes about conditions well.

### Deterministic scan

CLI static pass: [] — 0 findings, exit 0. Verified genuine (files non-empty, no config suppression, no ignore file, zero impeccable-disable comments, reconfirmed with --no-config and a directory scan). Nearly worthless: the TSX pass is regex-based and cannot see computed styles.

Rendered in-page scan: 33 elements carrying 46 findings — undersized-ui-text x18, ai-color-palette x12, low-contrast x8, image-hover-transform x4 (advisory), all-caps-body, wide-tracking, skipped-heading, layout-transition. Console: "[impeccable] 33 anti-patterns found". 66 overlay nodes rendered.

The static-clean / render-dirty gap is itself a finding: this page's defects live in computed style and behaviour, so a pre-commit-style scan keeps passing while the page keeps failing.

False positives (4, all agreed): ai-color-palette x12 ("Cyan neon text on dark background" fired 12x with one identical string on a light page — keying on hex, not context); image-hover-transform x4 (advisory, non-failing by contract); 21 elements "wider than viewport" at 390px (anchor li and min-w-[26rem] table both inside correct overflow-x:auto containers; document overflow measured 0px); .kite-reveal at opacity 0 (correctly progressive-enhanced at globals.css:201-216).

Overlays were live during the run; the live server has since been stopped and verified dead and the tab closed, so overlays are no longer visible.

## Overall Impression

A well-drawn page with broken mechanics, and the gap is unusually wide. Real taste built this — genuine neumorphic discipline, well-chosen photography, the sharpest guest-facing writing in the repo. Then the wayfinding doesn't work, the accent colour fails contrast everywhere it carries text, and the conversion path leaves the domain at peak intent.

Biggest opportunity: the right booking form already exists and is linked past six times. Fixing that one decision fixes the conversion leak, the lost course context, the visual rupture, and the abandonment of the WhatsApp-mediated model.

## What's Working

1. QuickFacts (page.tsx:156-203) — four real first-timer objections answered in <=14 words each, chunked at exactly 4, in the product's warm plain voice. Front-loads objection handling before price appears.
2. Neumorphic execution is disciplined, not decorative — top-left light source with no exceptions, no white cards on base, nesting never exceeds raised -> inset, and hover scale-[1.04] on the photo inside the frame (CoursesSection.tsx:55) rather than lifting the card, preserving MASTER.md's "molded from the surface" metaphor.
3. Sticky-nav offsets hand-tuned correctly — measured header 113.195px against lg:top-[114px]; md exactly 104px, mobile exactly 96px. Flush at all three breakpoints. (Three magic numbers with no shared token is the fragility.)

## Priority Issues

### [P0] The section nav doesn't scroll — verified, root-caused, sitewide

A reported it and honestly flagged automation uncertainty; parent re-tested and isolated the cause:
- Click #rental, sample scrollY 12x over 1.8s: hash -> #rental, scrollY 0 -> 0
- scrollTo({top:2000, behavior:'smooth'}): never moves, 10 samples
- scrollTo({top:1500, behavior:'instant'}): works -> 1500
- Set documentElement.style.scrollBehavior='auto', click again: lands at 2615
- Predicted landing from scroll-mt math: 2614.47 (match)
- prefers-reduced-motion: false (ruled out)

Cause: html { scroll-behavior: smooth } at app/globals.css:182-184.

Caveat: both reproductions were in extension-driven Chrome, which can suppress smooth-scroll animation. Re-confirm in a normal window. Two things hold unconditionally: scroll-mt-40 is 160px against a measured sticky stack of 113.195 + 56.805 = 170px (10px overlap on every landing), and scroll-behavior: smooth is declared globally with no prefers-reduced-motion guard.

Blast radius: components/shared/footer/index.tsx:22-24,33 ships /kitesurfing#courses, #rental, #storage, #member in the footer of every page. A guest sent /kitesurfing#courses over WhatsApp lands on the footer.

Fix: drop scroll-behavior: smooth from html; handle per-interaction with scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' }). Set section offset to 172px, derived from one --sticky-stack custom property that also feeds the three top-[...] values. Add scroll-spy active state.
Suggested command: /impeccable harden

### [P0] Conversion path leaks off-domain; the on-brand form built for it is orphaned

Every booking CTA points to https://school.finskitesurfing.com/book — page.tsx:75, page.tsx:145, CoursesSection.tsx:139, CourseDetail.tsx:180, footer/index.tsx:25. All next/link, no target, no rel, no external indicator.

app/(root)/kitesurfing/booking/page.tsx is a complete public on-brand booking form (name, date picker, 13 time slots, phone, email, notes) wired to createKitesurfingBookingFromPublic. Repo-wide grep: nothing links to it; only its own layout.tsx metadata references it. The Pharaoh hero does link internally (/kitesurfing/booking/pharaoh), so the site books one course in-app and everything else off-site. Membership cards go to a third destination, /day-use/booking (MembershipSections.tsx:142) — crossing from the neumorphic world into the navy /day-use world.

Why it matters: the handoff discards course context at peak intent, drops the guest into a different visual world with no return path, and abandons the WhatsApp-mediated booking model PRODUCT.md names as the operating reality. In a WhatsApp in-app browser, a cross-domain jump is where sessions die.

Fix: point CTAs at /kitesurfing/booking?course=beginner so the internal form carries course context into the staff record. If the external system must stay: one destination per label, target="_blank" rel="noopener" with a visible external indicator, course context in the query string. Either way, decide and delete the loser.
Suggested command: /impeccable shape

### [P1] The accent colour fails AA everywhere it carries text; MASTER.md's premise is arithmetically wrong

Both assessments measured independently and converged. B's numbers authoritative (caught oklab()/lab() usage, discarded a first pass whose parser misread those as near-black, rebuilt on canvas pixel readback):

| Element | Ratio | AA |
|---|---|---|
| White on #0EA5E9 — every filled CTA, card badges, featured membership card | 2.77:1 | fail |
| #0EA5E9 on base #E3EBF3 — every eyebrow, every "Details & Pricing" | 2.30:1 | fail |
| #0EA5E9 on inset #D6E0EA — every table th | 2.07:1 | fail |
| #5B6B7C on inset — course fact labels at 9.92px | 4.34:1 | fail |
| Featured membership body text on #0EA5E9 | 2.26-2.38:1 | fail |
| #5B6B7C on base — hero body, quickfacts | 4.54:1 | pass (0.04 margin) |

9 of 15 distinct text styles fail. Nothing qualifies as WCAG "large", so the 3:1 allowance never applies. 55 elements render below 12px, smallest 8.8px, 12 at 9.92px (text-[0.62rem], CoursesSection.tsx:89).

PRODUCT.md: "text at 4.5:1 or better, no text below 12px." MASTER.md's central colour claim is false in its own text — it asserts #0EA5E9 is the safe text accent because #38BDF8 is not, but #0EA5E9 is 2.30:1.

Focus rings — assessments disagreed, B is right: A read outline:none on :focus; B pressed Tab 14 times for real and found every element matching :focus-visible with Chrome's UA default (outline: auto 1px, offset 1px), plus a stylesheet walk over 217 rules across 3 sheets finding zero rules matching focus. Focus is not suppressed, it is never designed. MASTER.md specifies 2px solid var(--color-ring) at outline-offset 2px. neu-btn has :active but no :hover or :focus-visible (globals.css:234-243).

Fix: darken text/CTA accent to ~#0B6FA4 (~4.6:1 on base), reserve #0EA5E9 for fills and decoration; darken the featured membership fill or switch its text to --color-foreground. Raise 0.62rem -> 0.75rem and 0.7rem CTA/nav labels -> 0.75rem. Add a real :focus-visible ring. Correct MASTER.md itself or every future page inherits the failure.
Suggested command: /impeccable audit

### [P1] The hero is invisible until JavaScript runs

Every hero element individually wrapped in Reveal with staggered delays to 0.3s (page.tsx:41-104); .kite-reveal starts at opacity 0 with a 0.9s transition. A captured a fully blank above-the-fold on two cold loads, plus the courses heading at ~15% opacity and a blank viewport where the rental table should be. B independently found 12 of 16 reveal blocks at opacity 0 awaiting IntersectionObserver.

The assessments framed this oppositely and both are right: the CSS is properly authored (prefers-reduced-motion and scripting:none both handled at globals.css:201-216), and those fallbacks do not cover the actual failure mode, because JS is enabled and simply has not hydrated yet.

Why it matters: primary guest channel is a WhatsApp link on a phone on Sokhna mobile data. The first frame of a 22,000 EGP decision is an empty screen.

Fix: never wrap above-the-fold content in Reveal — render the hero at full opacity, start reveals below the fold. Cut transition to ~0.35s, travel to ~12px, drop or reduce stagger. Preserve the reduced-motion handling.
Suggested command: /impeccable animate

### [P2] Rental and Storage are dead ends at peak intent

Both price sections terminate with no CTA — KitesurfingRentalSection.tsx ends at "All prices in EGP.", StorageTable ends at </table>. No way to reserve, check availability, or ask a human. Neither mentions the rental/storage discount the membership section claims exists. Nothing says whether storage is indoor, locked, or insured.

Both tables structurally broken at desktop: w-full inside max-w-7xl with w-24 md:w-28 price columns puts ~950px of empty space between "One week" (x=233) and "500 EGP" (x=1285), joined by a 15%-opacity hairline. The rental thead scrolls under the sticky nav, leaving a 14-option decision point with no column labels.

Fix: cap tables at max-w-2xl so label and price stay in one eye-span. Make thead sticky top-[172px]. Add WhatsApp deep-link CTAs to both ("Ask about gear", "Reserve a storage rack").
Suggested command: /impeccable layout

### [P2] Every heading on the page has a broken accessible name

Confirmed directly in the DOM. Each headline is two <span class="block"> with no separating space:
  h1 "Master theWind."
  h2 "Learn tokitesurf"
  h2 "GearRental"
  h2 "EquipmentStorage"
  h2 "Memberships &Beach Access"

That is what screen readers announce, what search engines index, what summarisers ingest. Both assessments caught it independently. Heading order runs H1 -> H3 x4 -> H2 (QuickFacts uses h3 at page.tsx:190 in a section with no h2); the detector's skipped-heading rule agrees, though B rightly notes the "missing h2" framing overstates it since those four are a feature strip. All four nav-target sections have no aria-label — four unnamed landmarks.

Fix: add a space (or {" "}) between the spans in all five headings. Give QuickFacts an h2 or demote its cards. Add aria-label to the four sections.
Suggested command: /impeccable audit

## Persona Red Flags

Jordan (Confused First-Timer): meets "From 22,000 EGP" as the first price, before the 5,500 taster. The only escape from sticker shock, "Details & Pricing", is the smallest and lowest-contrast element in the card (11.5px, 2.30:1) beneath a 400px photo. The Kids modal titled "Kids Courses" has no price, no duration, no course name — just "15% off the regular course price", forcing a scroll back, holding 22,000 in working memory, computing 18,700. Nothing about what to bring, swim ability, or cancellation, then asked to leave the site to book. Abandons at the courses grid or books the wrong thing.

Casey (Distracted Mobile User): cold load shows a blank screen, one-handed, on data, in sun. Nav links measure 66x20 / 98x20 / 66x20 / 107x20; Book pill 79x33; PRODUCT.md requires 44px. At 390px the anchor list needs ~409px and has ~239px after the pill and gutters — "Beach Access" entirely off-screen with no gradient, chevron or scrollbar affordance. Both primary actions at the top of the screen; the only thumb-zone control is the WhatsApp FAB, ironically the best-placed and most product-accurate CTA. B's wider census: 28 of 33 interactive elements under 44x44 at 390px, worst Instagram 19x19 and Facebook 18x18.

Riley (Deliberate Stress Tester): clicks a nav link, nothing happens, URL changes anyway — no feedback, no recovery. Opens /kitesurfing#courses in a fresh tab, lands on the footer. Tabs through and focus enters off-screen content without the page scrolling. Accessibility tree shows H1 -> H3 -> H2, five malformed heading names, four unlabeled landmarks. Both the outer card and the CTA link carry Tailwind group (CoursesSection.tsx:34,48), so hovering anywhere on the card animates the CTA arrow. Also a React hydration mismatch on the Radix sheet trigger in the shared header (aria-controls SSR/client useId divergence) — the only console error on the page.

"Mona" (project persona) — nervous first-timer, WhatsApp link, phone, bright sun, from PRODUCT.md's stated reading conditions: blank screen on open, then nav labels at 4.54:1 marginal, CTA labels at 2.77:1, table headers at 2.07:1, in direct Red Sea sun. The only element sized for her eyes is the hero headline; every decision-carrying label is 9.9-12px. Nothing tells her the product's own truth — 24 hours to pay, non-refundable, cannot be postponed. The page is illegible in exactly the conditions PRODUCT.md says it will be read in.

"Hany" (project persona) — parent booking for an 8-year-old: three signals promise kids are handled, then a #0c0c0c near-black modal over rgba(0,0,0,0.75) on a pale blue-grey page. MASTER.md forbids this explicitly ("Dialog surface is the base color, not white and not dark navy", overlay rgba(34,48,63,0.4) + 4px blur). Modal body is font-[300], below MASTER.md's 400 floor, with text-white/55 text — dark-theme leftovers stranded in a light system. Answers none of a parent's questions: no price, duration, group size, whether an 8-year-old does the 2-3 day beginner course, supervision or safety detail. "BOOK NOW" leaves for the external system with no age and no course attached.

## Cognitive Load: 5 of 8 failed -> high, critical

Failed: single focus (four co-equal sales pitches, 7 competing next-actions above the fold); visual hierarchy (identical section template four times — nothing signals Courses is the revenue and Storage a footnote); one thing at a time (the course decision stays open past rental, storage and membership); minimal choices; working memory.
Passed: chunking, grouping, progressive disclosure — all genuinely well done.

Decision points over 4 options: the rental table's 14 numbers with the header scrolled out of view; the 5-item sticky nav in a 20px-tall row; 7 competing actions above the fold.

Three memory bridges: the Kids modal's uncomputed discount; the rental table's lost column headers; comparing four courses whose differentiators live in 2x2 chips re-read per card.

## Minor Observations

- KitesurfingHero.tsx is dead code — exported from components/shared/hero/index.tsx, imported by nothing; carries a duplicate of the external booking URL (maintenance trap).
- Container drift on click-through — hub max-w-7xl px-6 md:px-14 lg:px-20 vs course detail max-w-6xl px-4 md:px-6 lg:px-8 (CourseDetail.tsx:31). Layout visibly jumps.
- Motion choreography inconsistent — QuickFacts and courses grid fade as single blocks; membership cards stagger per-card.
- Three logos share alt="Fins kitesurfing center", one rendering 0x0; the above-fold 80x80 header logo has loading="lazy" (hero image correctly does not).
- Dark-navy footer meets pale clay with no transition — shared chrome, but it is what a guest sees last.
- Wide-desktop voids — md:justify-between on all four section headers leaves ~600px of dead centre at >=1440px.
- Beginner card photo crops badly — object-cover on the 4:3 frame yields mostly sand and a board edge, on the first and most important card.
- The WhatsApp FAB is vendor green, outside the palette, and is also the page's best-placed CTA. Worth making deliberate.
- Positive: prefers-reduced-motion handling for .kite-reveal is correct. Preserve it through any motion rework.

## Questions to Consider

1. If the nav never worked and nobody noticed — does the page need a nav, or does it need to be four times shorter?
2. Why does a page about wind never mention the wind? TideWidget.tsx sits unused; the beginner detail page already writes about conditions well.
3. You built a booking form in your own voice and linked past it six times. Which decision was the mistake?
4. What if the 5,500 Intro Session came first, and 22,000 were what you graduate to?
5. Four sections share one header template. Which one is actually the business?
6. PRODUCT.md says the voice "states policy without hedging." Where is it on the page that asks for 22,000 EGP?
7. MASTER.md's central colour claim is arithmetically false. Does the design system get corrected, or does every page keep inheriting the failure?
