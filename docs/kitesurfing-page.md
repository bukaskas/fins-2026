# Kitesurfing Page

Route: `app/(root)/kitesurfing/page.tsx`

## Structure (top to bottom)

1. **Hero** — full-bleed image (`hero_images/kitesurfing_desktop2.webp`), headline, primary CTA to `/kitesurfing/booking`, secondary anchor to `#courses`.
2. **Sticky subnav** — page title, anchor links (Courses / Gear Rental / Storage / Beach Access), and a "Book" pill. Sections use `scroll-mt-16` so anchors don't hide behind it.
3. **Quick facts** — four short guest-facing facts (IKO certified, group sizes, kids from age 8, gear rental/storage).
4. **Courses** (`components/kitesurfing/CoursesSection.tsx`) — 4 cards, each showing duration and a "From …" price up front. Beginner and Intro link to dedicated pages; Refresher and Kids open dialogs.
5. **Gear Rental** (`components/kitesurfing/KitesurfingRentalSection.tsx`) — price table, half/full day.
6. **Equipment Storage** — price table (defined in `page.tsx`).
7. **Memberships & Beach Access** (`components/kitesurfing/MembershipSections.tsx`) — dark navy section with rounded top corners, 3 tier cards.

## Pricing shown on cards

Card prices are the lowest available ("From X EGP" = group price per person). Source of truth for full pricing is the course detail pages (`beginner-course`, `intro-course`) and the dialog content. **Keep them in sync when prices change.**

## Section transitions

Scroll reveals use `components/kitesurfing/Reveal.tsx` — an IntersectionObserver that toggles the `.kite-reveal` CSS class defined in `app/globals.css` (fade + 28px rise, fires once, honors `prefers-reduced-motion`). GSAP is no longer used on this page.
