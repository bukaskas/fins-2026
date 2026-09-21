import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Pharaoh Airstyle — Spectator Registration",
  description:
    "Register your day at Fins for the Pharaoh Airstyle on Friday 9 October 2026 — kitesurfing, food, activities and the beach.",
  // Share preview: the same kite shot as the form's backdrop, pre-cropped to
  // the 1200x630 that buildMetadata declares. JPEG rather than the source
  // WebP because WhatsApp — where this link actually gets shared — is
  // unreliable about WebP previews.
  image: "/images/og/pharaoh-airstyle.jpg",
  path: "/day-use/booking/pharaoh-airstyle",
});

export default function PharaohAirstyleDayUseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
