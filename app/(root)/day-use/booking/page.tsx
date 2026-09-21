import DayUseBookingForm from "@/components/day-use/DayUseBookingForm";
import dayUsePhoto from "@/public/images/day_use/beach2.webp";

export default function DayUseBookingPage() {
  return (
    <DayUseBookingForm
      variant={{
        stepOneTitle: "When are you coming?",
        photo: dayUsePhoto,
        // Bias the crop below the horizon where there's vertical slack; the
        // top of this frame is empty sky.
        photoClassName: "object-[center_72%]",
        rail: {
          eyebrow: "Fins Beach Club · Sokhna",
          titleTop: "Reserve",
          titleBottom: "your day",
          bullets: [
            "Dedicated sunbed & umbrella",
            "9:00 AM – 11:00 PM",
            "500m of shoreline",
          ],
        },
      }}
    />
  );
}
