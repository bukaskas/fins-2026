import BookingEmail, { spectatorEmailPreviewBase } from "../emailTemplate";

/** Pharaoh Airstyle spectator pass, "confirmed" stage. */
const SpectatorPreview = () => (
  <BookingEmail
    {...spectatorEmailPreviewBase}
    stage="confirmed"
    amountPaidCents={450000}
    balanceDueCents={0}
  />
);

export default SpectatorPreview;
