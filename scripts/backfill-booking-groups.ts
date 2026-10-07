import { prisma } from "@/db/prisma";
import { BookingGroup } from "@prisma/client";

/**
 * Give the Pharaoh Airstyle Kai owner / Kite community registrations made
 * before `Booking.bookingGroup` existed their group and detail, recovered from
 * the contact note the registration actions wrote:
 *   "Kai owner, Pharaoh airstyle · Unit 12"
 *   "Kite community, Pharaoh airstyle · Spot Ras Sudr"
 *
 * Only day-use bookings on 2026-10-09 with no group yet are considered. A note
 * with the prefix but no readable detail still gets the group (detail stays
 * null). Anything that matches the prefix but sits on another date is skipped
 * and reported. Safe to run twice: rows that already have a group are ignored.
 *
 * Dry run by default. Pass --apply to write.
 */
const EVENT_DATE = new Date("2026-10-09T00:00:00.000Z");

const PREFIXES: { prefix: string; detailMarker: string; group: BookingGroup }[] = [
  { prefix: "Kai owner, Pharaoh airstyle", detailMarker: "· Unit ", group: BookingGroup.KAI_OWNER },
  { prefix: "Kite community, Pharaoh airstyle", detailMarker: "· Spot ", group: BookingGroup.KITE_COMMUNITY },
];

function parseNote(note: string) {
  for (const p of PREFIXES) {
    if (!note.startsWith(p.prefix)) continue;
    const at = note.indexOf(p.detailMarker);
    const detail = at === -1 ? null : note.slice(at + p.detailMarker.length).trim() || null;
    return { group: p.group, detail };
  }
  return null;
}

async function main() {
  const apply = process.argv.includes("--apply");

  const bookings = await prisma.booking.findMany({
    where: {
      bookingGroup: null,
      contacts: { some: { OR: PREFIXES.map((p) => ({ note: { startsWith: p.prefix } })) } },
    },
    select: {
      id: true,
      name: true,
      date: true,
      service: true,
      contacts: { select: { note: true }, orderBy: { createdAt: "asc" } },
    },
  });

  let tagged = 0;
  let noDetail = 0;
  const skipped: { id: string; name: string; reason: string }[] = [];

  for (const b of bookings) {
    const parsed = b.contacts.map((c) => (c.note ? parseNote(c.note) : null)).find(Boolean);
    if (!parsed) continue;
    if (b.service !== "day-use" || b.date.getTime() !== EVENT_DATE.getTime()) {
      skipped.push({
        id: b.id,
        name: b.name,
        reason: `service ${b.service} on ${b.date.toISOString().slice(0, 10)}, expected day-use on 2026-10-09`,
      });
      continue;
    }
    if (!parsed.detail) noDetail++;
    tagged++;
    if (apply) {
      await prisma.booking.update({
        where: { id: b.id },
        data: { bookingGroup: parsed.group, groupDetail: parsed.detail },
      });
    }
  }

  console.log(`${apply ? "Tagged" : "Would tag"} ${tagged} booking(s); ${noDetail} without a readable detail.`);
  if (skipped.length) {
    console.log(`Skipped ${skipped.length}:`);
    for (const s of skipped) console.log(`  ${s.id}  ${s.name}  — ${s.reason}`);
  }
  if (!apply) console.log("Dry run. Re-run with --apply to write.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
