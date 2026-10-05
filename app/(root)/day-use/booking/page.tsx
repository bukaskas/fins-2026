import DayUseBookingForm from "@/components/day-use/DayUseBookingForm";
import dayUsePhoto from "@/public/images/day_use/beach2.webp";
import { VISIT_HOURS } from "@/lib/constants";

type Props = {
  searchParams: Promise<{ date?: string | string[] }>;
};

/** `?date=YYYY-MM-DD` pre-selects a day, e.g. from the "Book again" button in
 * the released-hold email. The form decides whether that day is bookable. */
export default async function DayUseBookingPage({ searchParams }: Props) {
  const { date } = await searchParams;
  return (
    <DayUseBookingForm
      initialDateKey={typeof date === "string" ? date : undefined}
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
            VISIT_HOURS,
            "500m of shoreline",
          ],
        },
      }}
    />
  );
}
