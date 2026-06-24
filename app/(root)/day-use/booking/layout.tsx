import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Book a Day Use",
  description:
    "Reserve your day at Fins — beach, pool, food and more near Sokhna.",
  image: "/images/hero_images/dayuse_intro.webp",
  path: "/day-use/booking",
});

export default function DayUseBookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
