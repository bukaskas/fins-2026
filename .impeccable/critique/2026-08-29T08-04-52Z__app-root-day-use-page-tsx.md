---
target: day-use page
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
timestamp: 2026-08-29T08-04-52Z
slug: app-root-day-use-page-tsx
---
Method: dual-agent (A: design review · B: detector + browser evidence), run in isolation, synthesized here.

Target: `app/(root)/day-use/page.tsx` — the public Day Use landing page. **Mode: Persuade.**

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Focus ring is the 1px 50%-alpha UA default, invisible on sky-blue; panels lazy-load into blank grey frames with no `placeholder="blur"`; the page never signals availability though `DAILY_CAPACITY = 80` auto-closes dates. |
| 2 | Match System / Real World | 2 | "Reserve Your Day" doesn't reserve — it opens a request reviewed on WhatsApp in 24h. "From 1,500 EGP" is false on the 5 holiday dates in `pricing.json` (checkout charges 1,600). Advertised hours contradict `VISIT_WORKING_HOURS` (`lib/constants/index.ts:31`). |
| 3 | User Control and Freedom | 3 | No modals, no interstitials, no cookie wall; `#experience` is a real escape hatch. Deduction: no way back up from 5 screens deep. |
| 4 | Consistency and Standards | 2 | The page violates its **own** governing file: `#64748b` where `day-use.md` mandates `#54657a`; CTA tracking 0.14em where the spec says 0.2em; 35 elements below the spec's own type floor; `✓` glyph where PRODUCT.md commits to Lucide only. |
| 5 | Error Prevention | 2 | Price and hours are prominent — that prevents the common walk-up error. Nothing prevents booking a holiday date at the wrong price, or assuming food is included. |
| 6 | Recognition Rather Than Recall | 2 | The price disappears for 3,747px between hero tag and pricing card, and four mutually inconsistent amenity lists never answer "what am I buying?" |
| 7 | Flexibility and Efficiency | 2 | Scored, not n/a — it applies. Fast path (hero CTA) + considered path (scroll to price) is the right shape, but the fast path exists only on screen 1. No sticky CTA, no jump-to-pricing. |
| 8 | Aesthetic and Minimalist Design | 3 | The page's strongest heuristic. Confident restraint, real hierarchy, no badge clutter. Deductions: two scroll cues colliding 30px apart; `min-h-[520px]` voids; an opaque light header slab over full-bleed dark imagery. |
| 9 | Error Recovery | 2 | No user-generated errors exist, but one silent-failure mode does: all 7 `Reveal` blocks sit at `opacity: 0` at rest. `@media (scripting: none)` covers JS *off*, not JS *failing* — on flaky cellular at the gate, four panels, the pricing card and the final CTA stay invisible. |
| 10 | Help and Documentation | 1 | Scored, not n/a — a walk-up guest has real questions and the page answers none. No address, no map, no phone, no cancellation line, no FAQ, despite `LOCATION_ADDRESS` and `WHATSAPP_PHONE` already existing in `lib/constants`. |
| **Total** | | **21/40** | **Acceptable** — a page that looks considerably better than it performs. |

## Design Specificity Verdict

**Authored in the top 15%. Swappable below it.**

**LLM assessment.** One typographic gesture carries the whole section and it is a real idea, not a trend: `clamp(5rem,14vw,11rem)` at weight **100** ("Beach") over `tracking-[0.22em]` at weight **800** ("DAY USE"). It recurs as the H2 treatment on all four panels, again in "Ready to make / a splash?", and again on `/day-use/booking` as "Reserve / your day". A competitor could copy the hex codes; they could not lift that pairing without it reading as a quotation.

Everything from `ActivitiesStrip` (`page.tsx:209`) down would survive a logo swap onto any Hurghada resort or Dubai beach club. The four `ExperiencePanel`s are the category's default template — and their one structural idea, the left/right alternation, is **desktop-only**: `imageLeft` maps to `order-1 md:order-2` (`page.tsx:251`), so below 768px — the primary viewport for a QR-scanned page — all four collapse to the identical image-then-text block, four times running. The copy has slid into hotel brochure ("Deep-cushioned seating, ambient music, and full bar service create the perfect afternoon escape"), which is neither the "warm, direct and plain" voice PRODUCT.md commits to nor specific to this property. And nothing anywhere references the one genuinely unownable fact about Fins: **it is a kitesurfing centre.** No wind, no kites, no school, on its strongest guest-facing surface.

**Deterministic scan — 0 findings, and that is not a pass.** `detect.mjs` returned `[]` / exit 0 on the page and on `Reveal.tsx`. Assessment B calibrated it three ways and proved it blind here: it returned `[]` on a `.tsx` fixture deliberately stuffed with `#a09890` text, `text-[0.5rem]`, a click-handler div, an alt-less `<img>` and a 16px button. The rules that should have fired — `tiny-text`, `undersized-ui-text`, `wide-tracking`, `low-contrast`, `skipped-heading` — live in the browser/static-HTML engines, not the regex engine that runs on JSX. URL mode, which would have run them, needs puppeteer (not installed; B correctly declined to add an unrequested dependency). **Treat the clean scan as "not measured", not "clean."** Every finding below is browser-measured instead.

**Visual overlays — not available.** The overlay did inject and render, but a Next Fast Refresh cleared it before its console output could be captured, and re-injection then failed. **There is no user-visible overlay in your browser**; the live server was stopped and the agent's tab closed. The measurements below stand on their own numbers instead.

## Overall Impression

This page has a genuine point of view and then declines to use it where it counts. The hero is the best thing on the site — a real photograph of the actual shoreline, a price above the fold, and a typographic idea confident enough to be a system. Then it spends 3,747px — 5.3 full screens — on four interchangeable panels with nothing to tap, and arrives at a pricing card that whispers.

The single biggest opportunity: **the page's primary distribution channel is served by a flow built for a different user.** PRODUCT.md says this page is reached by QR at the gate. Someone standing at the gate, in the sun, needs today's price, today's availability, and "walk in — the desk is right there." Every CTA instead routes to a 3-step form ending in "we'll confirm on WhatsApp, usually within 24 hours." That answer is useless to someone fifteen metres from the desk.

## What's Working

**1. One typographic gesture carries the section — that is authorship, not styling.** The thin/heavy Raleway pair is applied consistently enough that a fifth section could be written by someone else and still fit. Protect this through every fix below.

**2. The handoff to `/day-use/booking` is genuinely solved.** Same navy ground, same sky accent, same photograph (`beach2.webp`, imported by both files), same headline pair. The palette break `day-use.md` was written to close — sky-blue button landing on a near-black shadcn button — is actually closed. Don't let a redesign reopen it.

**3. Motion degradation was engineered, not assumed.** `globals.css:201-216` restores `opacity: 1` under **both** `prefers-reduced-motion: reduce` and `@media (scripting: none)`, with a comment explaining the reveal is progressive enhancement. B verified by CSSOM enumeration that reduced motion leaves nothing invisible. Both agents independently credited this.

**Also verified clean:** exactly one `h1`, no skipped heading levels, all 8 images carry meaningful `alt`, zero horizontal overflow at 390px and 1440px, zero console errors, zero failed requests.

## Priority Issues

### [P1] The advertised price is wrong on holiday dates, and no advertised figure reads from config

`From 1,500 EGP` (`page.tsx:149`), `1,500 EGP` (`:365`) and `600 EGP` (`:373`) are hardcoded string literals. `page.tsx` imports nothing from `lib/pricing.ts` or `lib/config/pricing.json`. Meanwhile `HOLIDAY_SURCHARGE_CENTS = 10000` (`lib/pricing.ts:4`) applies on the five dates in `pricing.json`, so on 2026-05-26 through 05-30 checkout charges **1,600 EGP**. The kids figure agrees today (60000 cents = 600 EGP) purely by coincidence — change `kidsPriceCents` and the page keeps advertising 600.

**Why it matters.** This is precisely what `day-use.md` rule 3 was written to prevent: *"Prices have one source… Deriving one from the other produced a 600 vs 750 EGP contradiction between the ad and the checkout."* The documented fix is not actually in force, and a second instance of the same bug is live now. A guest who scans the QR on a public holiday, reads 1,500 and is quoted 1,600 has been misled by the ad — the fastest way to lose a walk-up.

**Fix.** Move `adultPriceCents`, `holidaySurchargeCents` and `discountMultiplier` into `lib/config/pricing.json` (`ADULT_PRICE_CENTS` is currently hardcoded at `lib/pricing.ts:3`, so there is no single source even server-side). Render every advertised figure through `formatEGP`. Add one visible line under the price: *"Holidays 1,600 EGP · see calendar for dates."*

**Suggested command:** `/impeccable harden`

### [P1] Both decision moments fail contrast and the type floor, and the CTA focus ring is invisible

Browser-measured, with proper `oklab()` resolution and full alpha compositing:

| Element | Measured | Required |
|---|---|---|
| `#38bdf8` panel eyebrows on white / tint (`page.tsx:274`) | **2.01–2.14:1** @ 9.6px | 4.5:1 |
| Bottom-CTA eyebrow `#0c1a2e`@0.5 on sky (`:412`) | **2.73:1** @ 9.6px | 4.5:1 |
| Hero eyebrow `#7dd3fc` over photo (`:144`) | **2.83:1** @ 10.4px | 4.5:1 |
| Bottom-CTA body `#0c1a2e`@0.6 (`:423`) | **3.41:1** @ weight 300 | 4.5:1 |
| "Adults"/"Children"/hours, pricing card (`:363,370,383`) | **3.66:1** @ 9.6px | 4.5:1 |
| Panel subtitles `#0284c7` (`:280`) | **3.84 / 4.10:1** | 4.5:1 |
| Body + tags `#64748b` on tint (`:283,290`) | **4.46:1** | 4.5:1 |
| Primary CTA focus ring | 1px, 50%-alpha grey UA default | visible 2px `#38bdf8` |
| **35 elements** below the route's own type floor | 8.8 / 9.6 / 10.4px | 11.2px labels, 13px body |

The sky eyebrows at **2.01:1** are the worst text on the page and the detector never saw them. Root cause is named in the spec: the page uses `#64748b` (slate-500) where `day-use.md:35` mandates `#54657a` ("5.3:1 on white"), and puts sky eyebrows on **white** when the spec reserves sky for "eyebrow text *on navy*."

**Why it matters.** PRODUCT.md states this as an operating requirement, not compliance: *"read these screens outdoors in strong sunlight on small phones… text at 4.5:1 or better, no text below 12px."* MASTER.md and `day-use.md` **agree** here — so these are straight regressions, not override conflicts. The worst instances cluster in the pricing card and the closing CTA: the two places the page converts.

**Fix.** Raise uppercase labels to `0.7rem` and body to `0.8125rem`; `#64748b` → `#54657a`; panel eyebrows → `#0369a1` (the spec's own darkened Standard pair) or move them onto navy; `white/40` → `white/70` in the pricing card; the final CTA's `/50` and `/60` → solid `#0c1a2e`; body copy to weight 400. Add `focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2` to all three `Link`s. Set the price at weight 200 minimum — hairline strokes at 40px in direct sun are not legible.

**Suggested command:** `/impeccable polish`

### [P1] 3,747px — 5.3 screens — between the hero CTA and the next one, with no persistent action on mobile

Measured: hero CTA at `y=614`, next CTA at `y=4361`, document 5,838px against a 711px viewport = **8.2 screens**. Between them, four panels that on mobile are four identical blocks. No sticky CTA, no mid-page action, no book link in nav. The three CTAs themselves measure 44.8 / 44.8 / 48.8px — those pass; `EXPLORE ↓` at **83×16.8px** does not.

**Why it matters.** In Persuade mode, willingness to act decays with scroll. This page peaks in the hero, then offers nothing for 5.3 screens while asking for exactly the scrolling that produces abandonment — repetitive, unvarying, one-handed, outdoors. Casey never reaches the pricing card.

**Fix.** Add a sticky bottom bar below `md`, appearing once the hero scrolls out: `1,500 EGP · per adult` left, `Reserve` pill right, `min-h-12`, safe-area inset, navy ground with the sky CTA. That one element fixes the dead zone, restores the price to permanent visibility, and puts the action in the thumb zone at every depth. Separately, cut four panels to three or give mobile its own rhythm.

**Suggested command:** `/impeccable adapt`

### [P1] The page never says what happens after the tap, and "Reserve Your Day" is not what the button does

All three CTAs read "Reserve Your Day." The actual behaviour: a 3-step form, a request, a WhatsApp confirmation "usually within 24 hours," then a payment link valid 24 hours. The landing page mentions none of it, never states the refund policy, and never signals availability though `DAILY_CAPACITY = 80` auto-closes dates.

**Why it matters.** `day-use.md` rule 2 is unambiguous — *"State the consequence before the commitment."* The booking form honours it; the landing page, where the commitment psychologically happens, does not. In Persuade mode the reassurance *is* the conversion mechanism: "no payment now" removes more friction than any photograph here. The page spends five screens building desire and zero seconds reducing risk.

**Fix.** One line under the pricing-card CTA and the final CTA, at `0.8125rem`: *"No payment now — we'll confirm on WhatsApp within 24 hours."* Relabel to "Check availability" or "Request your day", and match it on the booking page (currently "Reserve my day" — pick one).

**Suggested command:** `/impeccable clarify`

### [P2] Invented superlatives, and four contradictory lists that never answer "is food included?"

`page.tsx:42` claims *"Widest sandy beach in the Sokhna area."* `:43-44` claims an *"expansive 500-metre shoreline"* and a `500m of Shore` tag. I grepped: **neither figure exists anywhere else in the repo** — they originate in this file and now propagate onto the booking page hero. PRODUCT.md is explicit: *"No customer testimonials, press, case studies, pricing claims or usage statistics have been established. Future work must not invent them."*

Separately, four amenity lists disagree — 3 hero tags + 6 strip icons + 14 panel tags + 4 inclusions = 27 claims. "Lagoon" is promised once (`:150`) and never explained. Pool appears three times with no panel. **Restaurant gets a strip icon and a full panel but is absent from "What's Included"** — so food is *not* included and the page never says so.

**Why it matters.** The superlative is a competitive claim the business can be held to, fabricated by the page rather than sourced from the business. The list contradiction is worse commercially: a guest reads a panel about burgers and pizza, sees 1,500 EGP, and reasonably concludes food is in the price. They arrive, order, and get a bill — the most expensive possible misunderstanding, in person, in front of staff already mid-conversation with a queue.

**Fix.** Replace the superlative with something verifiable and concrete ("Shallow water, no drop-off — safe for small kids"). Source the 500m figure into `lib/constants` or delete it. Collapse four lists into two: the strip becomes a table of contents whose labels exactly match the panels, and "What's Included" gains one explicit line — *"Food and drinks are charged separately."*

**Suggested command:** `/impeccable clarify`

## Cognitive Load

**4 of 8 items FAIL → high load (critical fix needed).**

PASS: single focus · grouping · visual hierarchy (marginal — "1,500 EGP" is the largest thing in its section but set at weight 100) · one thing at a time.

FAIL: **chunking** (`ActivitiesStrip` is 6 undifferentiated items) · **minimal choices** · **working memory** (price shown once at 10.4px, then absent for 3,747px) · **progressive disclosure** (none — a flat scroll of atmosphere, and none of the transaction facts a guest needs).

Decision points over 4 options: the 6-item activities strip (`:200-207`), and the "what am I buying" decision spread across 27 claims in 4 non-matching lists.

## Emotional Journey

**Peak — the first 1.5 seconds.** Weight-100-over-weight-800 Raleway across a real photograph of the actual shoreline, with the price and hours right there. Price above the fold is an act of respect.

**Valley 1 — panels 03 and 04.** Three screens deep, every panel the same shape (alternation is desktop-only), copy in brochure register, no way to act for 3,747px. This is where a QR guest closes the tab.

**Valley 2 — the pricing card**, worst-executed precisely because it matters most: labels at 9.6px / 3.66:1, the price itself at **font-weight 100**, card outline at `rgba(56,189,248,0.3)`. Every other element on the page is more emphatic than the number the guest is being asked to accept. `day-use.md` states the rule this breaks: *"The price must never get smaller as the guest gets closer to paying it."*

**End — the weakest impression.** "Ready to make a splash?" is a stock pun, off-voice, over the one flat colour field, with supporting text at 3.41:1 and eyebrow at 2.73:1. Peak-end says this is half of what the guest remembers.

**Does it reassure at commitment? No — and the fix exists 200 lines away.** `/day-use/booking` does it properly: *"No payment now… We'll confirm your day on WhatsApp, usually within 24 hours."* The landing page says none of it.

## Persona Red Flags

**Jordan (first-timer).** Reads `FROM 1,500 EGP` at 10.4px, white/75, over pale sand — the lowest-contrast placement of the number he most needs. Can't tell if the six strip icons are things he gets or things that exist. Reads a full Restaurant panel, reaches "What's Included" with no food, and has no way to resolve it. Wonders what a "Lagoon" is. Finds no phone, address, map or FAQ. Taps through and hits a **required Instagram field** with no explanation.

**Riley (stress tester).** Picks 2026-05-26 from `holidayDates`, having read "From 1,500 EGP", and is charged **1,600**. Cross-references advertised hours against `VISIT_WORKING_HOURS = '9:30 am - 12 pm'` (`lib/constants/index.ts:31`). Flicks past the pricing section fast and photographs it **blank** — reproduced twice; `Reveal` at `:347` with `delay={0.1}` plus a 0.9s transition leaves the card at `opacity: 0` during a fast scroll. Tabs to the CTA and gets a 1px 50%-alpha grey ring, undetectable on sky-blue. Notes `sizes="50vw"` (`:262`) is wrong below `md` where the image renders at 100vw — **both agents caught this independently** — so Next serves every phone a half-resolution source on a page whose entire persuasion is photographic.

**Casey (distracted mobile).** Hero CTA is in the thumb zone but doesn't exist until **1.58s after paint** (`0.78s` delay + `0.8s` duration, unguarded for reduced motion). Then 3,747px with nothing to tap and no rhythm, because `md:order` does nothing at her width. Price gone from screen 2 to screen 6. The only persistently tappable thing is the green WhatsApp FAB — site chrome, louder and more saturated than the page's own CTA, sitting green-on-sky over the closing band.

**Nour — the walk-up at the Fins gate** (derived from PRODUCT.md: QR distribution, one location, bright sun, `DAILY_CAPACITY = 80`, WhatsApp-first). She is standing at the gate, in the sun, deciding whether to walk in. **This is the page's stated primary channel and the scenario it serves worst.** No availability signal of any kind. The price is 10.4px over bright sand, and when she reaches the pricing card it is weight-100 at 3.66:1. **There is no walk-in path at all** — every CTA ends in "we'll confirm within 24 hours," useless to someone fifteen metres from the desk. No address, no map, no phone, though `LOCATION_ADDRESS` and `WHATSAPP_PHONE` already exist in `lib/constants`.

## Minor Observations

- **Two scroll cues collide** — "EXPLORE ↓" (`:172`) and "SCROLL" (`:188`) render ~30px apart and overlap on mobile. Delete the second.
- **Hero animations have no `prefers-reduced-motion` guard.** The inline `<style>` at `:94-106` defines seven `fadeUp` animations with `both` fill-mode and no media query; B confirmed via CSSOM that the only reduced-motion rules target `.kite-reveal` and sonner. Same file, two different standards.
- That inline `<style>` also injects **unscoped global class names** (`.hero-eyebrow`, `.hero-ctas`) into the document.
- **Panel images are `loading="lazy"` with no `placeholder="blur"`** — they are static imports, so blur is free. A blank 340px grey rectangle was photographed on a fast local connection.
- **`✓` (U+2713) used as an icon** at `:335`, against PRODUCT.md's "Icons are Lucide only."
- **Body copy at `font-[300]`** (`:283, 338, 423`) violates MASTER.md's weight floor and compounds the contrast failures.
- **`min-h-[520px]` creates large voids** where copy is short — visible on the Restaurant panel at ≥768px.
- **The site header is a foreign object here** — an opaque light slab over a page built on full-bleed dark imagery. The `-mt-30` at `:93` suggests it was meant to be transparent over the hero; it isn't.
- **Footer links are 15px-tall targets**; header hamburger 34×34; social icons 18–19px. Layout-owned, but they fail on this page.
- **`react-icons/fa` ships 441.5 KB transfer / 1.9 MB decoded** — a barrel import pulled in by the footer's social icons, dwarfing the 81.3 KB hero on a page whose whole payload is photographic. Dev-mode measurement, so verify against a production build before acting.
- **MASTER.md conflict is documentation-only.** Nothing neumorphic renders on this route. `day-use.md`'s "Standing tension" has no live symptom — amend MASTER's scope rule to hand `/day-use` to the page override, as that file itself recommends, so nobody later "fixes" this page onto the clay base.

### Where the two assessments disagreed

- **Focus ring.** A reported "no focus indicator at all" (`outline: none`). B pressed a real Tab key and found `:focus-visible` true with `outline-style: auto`, 1px, 50%-alpha grey. **B is right** — a ring exists, it is just the UA default and visually undetectable on sky-blue. The fix is unchanged; the description is not.
- **H1 accessible name.** A flagged it as announcing "BeachDay Use" (two spans, no separator). B read the computed name as "Beach DAY USE" — both spans are `display: block`, so the accname algorithm inserts the space. **Not an issue.** Dropped.

## Questions to Consider

1. **The gate QR and the Instagram link are two different users — why do they get the same page?** One is outside deciding whether to walk in *now*; the other is on a sofa deciding about next weekend. What does `/day-use?src=gate` look like?
2. **What would this page look like if it could only be 1.5 screens long?** The two things that convert — a real photograph and a price — are already both in the hero. If the four panels vanished tomorrow, what would actually be lost?
3. **Fins is a kitesurfing centre. Why is there no wind anywhere on this page?** The one unownable thing in the product is absent from its strongest guest-facing surface.
4. **The booking form knows how to reassure. Why does the page that asks for the click say nothing?** What happens if that single line moves *above* the button instead of two screens after it?
5. **What is the confident version of the price?** Set in the thinnest weight, labelled at 3.66:1, hedged with "From", then contradicted by a surcharge the page never mentions. If the business believes 1,500 EGP is fair, what would saying so without flinching look like?
