import BookingEmail, { bookingEmailPreviewBase } from "../emailTemplate";

/** WAITING_PAYMENT: sent on every new 24h deposit window. */
const BookingAwaitingPaymentPreview = () => (
  <BookingEmail
    {...bookingEmailPreviewBase}
    stage="awaiting-payment"
    depositDueCents={200000}
    balanceDueCents={200000}
    deadline="Tuesday 1 September, 14:30 (Cairo time)"
    deadlineShort="Tue 1 Sept, 14:30"
  />
);

export default BookingAwaitingPaymentPreview;
