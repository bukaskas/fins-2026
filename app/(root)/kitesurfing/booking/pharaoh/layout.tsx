import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Book Pharaoh Airstyle",
  description:
    "Book the Pharaoh Airstyle experience at Fins near Sokhna.",
  image: "/images/hero_images/hero-desktop-pharaoh.webp",
  path: "/kitesurfing/booking/pharaoh",
});

export default function PharaohBookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
