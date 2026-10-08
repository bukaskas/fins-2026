import DayUseBookingForm from "@/components/day-use/DayUseBookingForm";
import pharaohPhoto from "@/public/images/kitesurfing/kite_booking_form_descktop.webp";
import { PHARAOH_EVENT_HOURS } from "@/lib/constants";

// Bean-bag spectator pass for the Pharaoh Airstyle day. A day-use booking
// ("day-use" service, so it lands in the day-use numbers) with three
// differences: the date is stated rather than chosen, the price is the flat
// spectator rate, and staff review the request before the guest is asked to
// pay in full. Tagged BookingGroup.SPECTATOR on the server.
//
// Built the way the calendar stores a selection: UTC midnight, so a
// late-night booker doesn't persist the 8th.
const PHARAOH_SPECTATOR_DATE = new Date(Date.UTC(2026, 9, 9));

// A single sentence rather than a bullet list — FixedDatePanel drops the
// bullet dot when there's only one line, since one bullet isn't a list.
const EVENT_HIGHLIGHTS = [
  "Spectator pass: bean bag seating only. No tables or reserved seats, as the day is focused on the event. Join us to watch the kite show.",
];

export default function PharaohAirstyleSpectatorPage() {
  return (
    <DayUseBookingForm
      variant={{
        fixedDate: PHARAOH_SPECTATOR_DATE,
        spectator: true,
        eventHighlights: EVENT_HIGHLIGHTS,
        stepOneTitle: "Spectator pass · 9 October",
        photo: pharaohPhoto,
        // The kiter is high in this frame, so the day-use crop (which biases
        // low, to below a horizon) would cut the subject off entirely —
        // especially on mobile, where the rail is a short banner.
        photoClassName: "object-[center_28%]",
        rail: {
          eyebrow: "Fins Beach Club · Sokhna",
          titleTop: "Pharaohs",
          titleBottom: "Airstyle Competition",
          mobileSummary: (
            <>
              <b className="font-[700] text-white">Fri 9 Oct</b> · {PHARAOH_EVENT_HOURS}
            </>
          ),
          bullets: [
            "Friday 9 October 2026",
            PHARAOH_EVENT_HOURS,
            "Spectator pass · bean bag seating",
          ],
        },
      }}
    />
  );
}
