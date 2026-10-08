import BookingEmail, { spectatorEmailPreviewBase } from "../emailTemplate";

/** Pharaoh Airstyle spectator pass, "awaiting-payment" stage. */
const SpectatorPreview = () => (
  <BookingEmail
    {...spectatorEmailPreviewBase}
    stage="awaiting-payment"
    depositDueCents={450000}
    deadline="Friday 9 October, 14:30 (Cairo time)"
    deadlineShort="Fri 9 Oct, 14:30"
  />
);

export default SpectatorPreview;
