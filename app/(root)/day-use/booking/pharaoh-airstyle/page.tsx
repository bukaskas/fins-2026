import { redirect } from "next/navigation";

// The seated Pharaoh Airstyle booking is closed: the event day now sells
// bean-bag spectator passes only. Old links and bookmarks land on the pass.
export default function PharaohAirstyleDayUsePage() {
  redirect("/day-use/booking/pharaoh-airstyle/spectator");
}
