import { buildMetadata } from "@/lib/metadata";
import KiteCommunityRegistrationForm from "@/components/day-use/KiteCommunityRegistrationForm";

export const metadata = buildMetadata({
  title: "Pharaoh Airstyle — Kite Community",
  description:
    "Registration for the kite community. Join us for a day packed with activities, music, flavorful bites, and high-flying kitesurfing tricks.",
  image: "/images/og/pharaoh-airstyle.jpg",
  path: "/day-use/booking/pharaoh-airstyle/kite",
});

export default function PharaohAirstyleKitePage() {
  return <KiteCommunityRegistrationForm />;
}
