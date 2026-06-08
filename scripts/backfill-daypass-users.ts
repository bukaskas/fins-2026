import { prisma } from "@/db/prisma";
import { BookingStatus, Role } from "@prisma/client";
import bcryptjs from "bcryptjs";

async function main() {
  const bookings = await prisma.booking.findMany({
    where: {
      bookingStatus: { in: [BookingStatus.CONFIRMED, BookingStatus.ARRIVED] },
      email: { not: null },
    },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
    orderBy: { createdAt: "asc" }, // oldest booking wins for a given email
  });

  let skippedNoEmail = 0;
  let skippedDuplicate = 0;

  // Dedupe by normalized email, keeping the first (oldest) occurrence.
  const byEmail = new Map<string, (typeof bookings)[number]>();
  for (const b of bookings) {
    const email = b.email?.trim().toLowerCase();
    if (!email) {
      skippedNoEmail += 1;
      continue;
    }
    if (byEmail.has(email)) {
      skippedDuplicate += 1;
      continue;
    }
    byEmail.set(email, b);
  }

  const dedupedEmails = [...byEmail.keys()];

  // Find emails that already belong to a user.
  const existing = await prisma.user.findMany({
    where: { email: { in: dedupedEmails } },
    select: { email: true },
  });
  const existingEmails = new Set(existing.map((u) => u.email.toLowerCase()));

  let created = 0;
  let skippedExisting = 0;

  for (const [email, b] of byEmail) {
    if (existingEmails.has(email)) {
      skippedExisting += 1;
      continue;
    }
    try {
      const password = await bcryptjs.hash(crypto.randomUUID(), 10);
      await prisma.user.create({
        data: {
          name: b.name,
          email,
          phone: b.phone || null,
          password,
          role: Role.DAYPASS,
        },
      });
      created += 1;
    } catch (error: any) {
      if (error.code === "P2002") {
        skippedExisting += 1;
        continue;
      }
      throw error;
    }
  }

  console.log(
    [
      `Candidate bookings (CONFIRMED/ARRIVED, with email): ${bookings.length}`,
      `Created DAYPASS users:                              ${created}`,
      `Skipped (no email):                                 ${skippedNoEmail}`,
      `Skipped (duplicate email within bookings):          ${skippedDuplicate}`,
      `Skipped (user already exists):                      ${skippedExisting}`,
    ].join("\n")
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
