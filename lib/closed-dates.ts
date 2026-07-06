import "server-only";

import { prisma } from "@/db/prisma";

// Internal closed-date write, shared by the guarded server action
// (closedDate.actions.ts) and system paths with no user session (the
// 80-person auto-close triggered from the Flash payment webhook).
export async function upsertClosedDate(date: Date, reason?: string) {
  const normalized = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  await prisma.closedDate.upsert({
    where: { date: normalized },
    create: { date: normalized, reason: reason ?? null },
    update: { reason: reason ?? null },
  });
}
