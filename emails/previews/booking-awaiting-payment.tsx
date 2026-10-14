import BookingEmail, { bookingEmailPreviewBase } from "../emailTemplate";

/** WAITING_PAYMENT: sent on every new payment window. No deadline yet: the
 *  24h start when the guest generates their payment link. */
const BookingAwaitingPaymentPreview = () => (
  <BookingEmail
    {...bookingEmailPreviewBase}
    stage="awaiting-payment"
    depositDueCents={200000}
    balanceDueCents={200000}
  />
);

export default BookingAwaitingPaymentPreview;
