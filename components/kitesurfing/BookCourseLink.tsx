import { ArrowUpRight } from "lucide-react";
import { kitesurfingBookingUrl, type CourseSlug } from "@/lib/booking-url";

/**
 * The single way this site sends a guest to book a kitesurfing course.
 *
 * Every course CTA leaves for the school management app on another domain. That
 * was previously invisible: the links were rendered with next/link, carried no
 * `target` or `rel`, and gave no sign that pressing them ended the visit. On a
 * phone opened from WhatsApp, a silent cross-domain jump with no way back is
 * where a booking is lost.
 *
 * So the handover is made deliberate — a new tab, `rel="noopener noreferrer"`,
 * and a visible arrow — and the course the guest was reading travels with them.
 *
 * `next/link` is deliberately not used: this is a cross-origin document
 * navigation, not an in-app route, and Link's prefetching and client routing
 * have nothing to offer it.
 */
function BookCourseLink({
  course,
  className,
  style,
  children,
}: {
  /** Course the guest is looking at, sent to the school app as a hint. */
  course?: CourseSlug;
  className?: string;
  /** The homepage hero slide paints its own accent background. */
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <a
      href={kitesurfingBookingUrl(course)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
    >
      {children}
      <ArrowUpRight
        aria-hidden="true"
        strokeWidth={1.5}
        className="h-4 w-4 flex-shrink-0"
      />
      <span className="sr-only">(opens the booking site in a new tab)</span>
    </a>
  );
}

export default BookCourseLink;
