/* eslint-disable no-console */
/**
 * One-off backfill: lowercase all User.email values (new signups are already
 * normalized at the validator layer — see code-review-v1.md H2).
 *
 * Collision-safe: if two accounts differ only by email casing, neither is
 * touched; they are reported for manual merging instead.
 *
 * Dry run (default):  npx tsx scripts/normalize-user-emails.ts
 * Apply:              npx tsx scripts/normalize-user-emails.ts --apply
 */
import { prisma } from "../db/prisma";

async function main() {
  const apply = process.argv.includes("--apply");

  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });

  const byLower = new Map<string, { id: string; email: string }[]>();
  for (const u of users) {
    const key = u.email.toLowerCase();
    byLower.set(key, [...(byLower.get(key) ?? []), u]);
  }

  const collisions = [...byLower.entries()].filter(([, rows]) => rows.length > 1);
  const toFix = [...byLower.entries()]
    .filter(([, rows]) => rows.length === 1)
    .map(([lower, rows]) => rows[0])
    .filter((u) => u.email !== u.email.toLowerCase());

  if (collisions.length > 0) {
    console.log(`⚠ ${collisions.length} case-colliding account group(s) — merge manually, skipping:`);
    for (const [lower, rows] of collisions) {
      console.log(`  ${lower}: ${rows.map((r) => `${r.email} (${r.id})`).join(" | ")}`);
    }
  }

  console.log(`${toFix.length} email(s) to lowercase.`);
  if (!apply) {
    for (const u of toFix) console.log(`  ${u.email} → ${u.email.toLowerCase()}`);
    console.log("Dry run — pass --apply to write changes.");
    return;
  }

  for (const u of toFix) {
    await prisma.user.update({
      where: { id: u.id },
      data: { email: u.email.toLowerCase() },
    });
  }
  console.log(`Done — ${toFix.length} updated, ${collisions.length} group(s) skipped.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
