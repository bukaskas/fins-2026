import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Pharaoh Airstyle — Spectator Pass",
  description:
    "Watch the kite show from the beach. Bean bag seating only, no tables or reserved seats.",
  image: "/images/og/pharaoh-airstyle.jpg",
  path: "/day-use/booking/pharaoh-airstyle/spectator",
});

export default function PharaohAirstyleSpectatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
