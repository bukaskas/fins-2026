import BookingEmail, { bookingEmailPreviewBase } from "../emailTemplate";

/** WAITING_PAYMENT on a date that just filled up: pay within 12h. */
const BookingDateFullPreview = () => (
  <BookingEmail
    {...bookingEmailPreviewBase}
    stage="awaiting-payment"
    fullyBooked
    depositDueCents={200000}
    balanceDueCents={200000}
    deadline="Tuesday 1 September, 02:30 (Cairo time)"
    deadlineShort="Tue 1 Sept, 02:30"
  />
);

export default BookingDateFullPreview;
