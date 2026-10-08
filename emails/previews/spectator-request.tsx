import BookingEmail, { spectatorEmailPreviewBase } from "../emailTemplate";

/** Pharaoh Airstyle spectator pass, "request" stage. */
const SpectatorPreview = () => (
  <BookingEmail
    {...spectatorEmailPreviewBase}
    stage="request"
  />
);

export default SpectatorPreview;
