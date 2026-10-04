import { buildMetadata } from "@/lib/metadata";
import KaiCommunityRegistrationForm from "@/components/day-use/KaiCommunityRegistrationForm";

export const metadata = buildMetadata({
  title: "Pharaoh Airstyle — Kai Owners & Community",
  description:
    "Registration for Kai unit owners and community. Join us for a day packed with activities, music, flavorful bites, and high-flying kitesurfing tricks.",
  image: "/images/og/pharaoh-airstyle.jpg",
  path: "/day-use/booking/pharaoh-airstyle/kai",
});

export default function PharaohAirstyleKaiPage() {
  return <KaiCommunityRegistrationForm />;
}
