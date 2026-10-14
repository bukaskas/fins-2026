import BookingEmail, { spectatorEmailPreviewBase } from "../emailTemplate";

/** Pharaoh Airstyle spectator pass, "awaiting-payment" stage. */
const SpectatorPreview = () => (
  <BookingEmail
    {...spectatorEmailPreviewBase}
    stage="awaiting-payment"
    depositDueCents={450000}
  />
);

export default SpectatorPreview;
