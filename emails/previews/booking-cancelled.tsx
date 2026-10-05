import BookingEmail, { bookingEmailPreviewBase } from "../emailTemplate";

/** CANCELED by the cron: the deposit window ran out unpaid. */
const BookingCancelledPreview = () => (
  <BookingEmail
    {...bookingEmailPreviewBase}
    stage="cancelled"
    deadline="Tuesday 1 September, 14:30 (Cairo time)"
    rebookUrl="https://www.finskitesurfing.com/day-use/booking?date=2026-09-05"
  />
);

export default BookingCancelledPreview;
