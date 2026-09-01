import { KITESURFING_BOOKING_URL } from "@/lib/constants";

/**
 * Builds the outbound link to the kitesurfing booking form.
 *
 * Kitesurfing is owned by the school management app at school.finskitesurfing.com,
 * which has its own database; this site is the marketing front-end for it. Until
 * that app exposes a write endpoint (Phase 1 in
 * app/(root)/kitesurfing/booking-form.md), every course CTA hands the guest over
 * rather than booking here.
 *
 * The handover used to be a bare link, so a guest reading the Beginner Course and
 * pressing "Book a course" arrived with nothing selected and had to choose the
 * course again from memory. `course` fixes that; `source` lets the school app
 * attribute the funnel. Both are read-only hints — the school app remains the
 * authority on what is bookable.
 *
 * The `course` slugs match the course detail routes, so the two stay in step:
 * `beginner` ← /kitesurfing/beginner-course, and so on.
 */
export type CourseSlug = "beginner" | "intro" | "refresher" | "kids";

export function kitesurfingBookingUrl(course?: CourseSlug): string {
  const url = new URL(KITESURFING_BOOKING_URL);
  url.searchParams.set("source", "finskitesurfing.com");
  if (course) url.searchParams.set("course", course);
  return url.toString();
}
