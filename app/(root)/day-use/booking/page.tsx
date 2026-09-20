import DayUseBookingForm from "@/components/day-use/DayUseBookingForm";

export default function DayUseBookingPage() {
  return (
    <DayUseBookingForm
      variant={{
        stepOneTitle: "When are you coming?",
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
