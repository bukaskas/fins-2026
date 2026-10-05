import BookingEmail, { bookingEmailPreviewBase } from "../emailTemplate";

/** CONFIRMED: sent once, when the deposit lands. */
const BookingConfirmedPreview = () => (
  <BookingEmail
    {...bookingEmailPreviewBase}
    stage="confirmed"
    amountPaidCents={200000}
    balanceDueCents={200000}
  />
);

export default BookingConfirmedPreview;
