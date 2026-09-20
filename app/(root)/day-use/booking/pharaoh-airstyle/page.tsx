import DayUseBookingForm from "@/components/day-use/DayUseBookingForm";

// Spectator registration for the Pharaoh Airstyle day. This is a day-use
// booking in every respect — same rate, same "day-use" service, same emails,
// same payment path — so it lands in the day-use numbers where it belongs.
// The only difference is that the date is stated rather than chosen.
//
// Built the way the calendar stores a selection: UTC midnight, so a
// late-night booker doesn't persist the 8th.
const PHARAOH_DAY_USE_DATE = new Date(Date.UTC(2026, 9, 9));

const EVENT_HIGHLIGHTS = [
  "Best kitesurfing action",
  "Food worth savoring",
  "Day full of activities",
  "Great community",
];

export default function PharaohAirstyleDayUsePage() {
  return (
    <DayUseBookingForm
      variant={{
        fixedDate: PHARAOH_DAY_USE_DATE,
        eventHighlights: EVENT_HIGHLIGHTS,
        stepOneTitle: "Pharaoh Airstyle · 9 October",
        rail: {
          eyebrow: "Fins Beach Club · Sokhna",
          titleTop: "Come watch",
          titleBottom: "the airstyle",
          bullets: [
            "Friday 9 October 2026",
            "9:00 AM – 11:00 PM",
            "500m of shoreline",
          ],
        },
      }}
    />
  );
}
