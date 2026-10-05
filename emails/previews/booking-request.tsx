import BookingEmail, { bookingEmailPreviewBase } from "../emailTemplate";

/** PENDING: sent when a new guest's request lands for staff review. */
const BookingRequestPreview = () => (
  <BookingEmail {...bookingEmailPreviewBase} stage="request" />
);

export default BookingRequestPreview;
