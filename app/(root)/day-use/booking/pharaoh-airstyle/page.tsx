import DayUseBookingForm from "@/components/day-use/DayUseBookingForm";
import pharaohPhoto from "@/public/images/kitesurfing/kite_booking_form_descktop.webp";

// Spectator registration for the Pharaoh Airstyle day. This is a day-use
// booking in every respect — same rate, same "day-use" service, same emails,
// same payment path — so it lands in the day-use numbers where it belongs.
// The only difference is that the date is stated rather than chosen.
//
// Built the way the calendar stores a selection: UTC midnight, so a
// late-night booker doesn't persist the 8th.
const PHARAOH_DAY_USE_DATE = new Date(Date.UTC(2026, 9, 9));

// A single sentence rather than a bullet list — FixedDatePanel drops the
// bullet dot when there's only one line, since one bullet isn't a list.
const EVENT_HIGHLIGHTS = [
  "Join us for a day packed with activities, music, flavorful bites, and high-flying kitesurfing tricks",
];

export default function PharaohAirstyleDayUsePage() {
  return (
    <DayUseBookingForm
      variant={{
        fixedDate: PHARAOH_DAY_USE_DATE,
        eventHighlights: EVENT_HIGHLIGHTS,
        stepOneTitle: "Pharaoh Airstyle · 9 October",
        photo: pharaohPhoto,
        // The kiter is high in this frame, so the day-use crop (which biases
        // low, to below a horizon) would cut the subject off entirely —
        // especially on mobile, where the rail is a short banner.
        photoClassName: "object-[center_28%]",
        rail: {
          eyebrow: "Fins Beach Club · Sokhna",
          titleTop: "Come watch",
          titleBottom: "the airstyle",
          bullets: [
            "Friday 9 October 2026",
            "9:00 AM – 11:00 PM",
            "Kite competition",
          ],
        },
      }}
    />
  );
}
