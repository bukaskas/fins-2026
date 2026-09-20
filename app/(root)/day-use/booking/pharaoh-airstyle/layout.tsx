import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Pharaoh Airstyle — Spectator Registration",
  description:
    "Register your day at Fins for the Pharaoh Airstyle on Friday 9 October 2026 — kitesurfing, food, activities and the beach.",
  image: "/images/hero_images/dayuse_intro.webp",
  path: "/day-use/booking/pharaoh-airstyle",
});

export default function PharaohAirstyleDayUseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
