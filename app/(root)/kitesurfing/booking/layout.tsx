import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Book a Kitesurfing Course",
  description:
    "Book your kitesurfing course at Fins — lessons for all levels near Sokhna.",
  image: "/images/hero_images/kitesurfing_desktop2.webp",
  path: "/kitesurfing/booking",
});

export default function KitesurfingBookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
