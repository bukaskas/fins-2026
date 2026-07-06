"use server";

import { prisma } from "@/db/prisma";
import { addMonths } from "date-fns";
import { requireRole, STAFF_ROLES } from "@/lib/auth-guard";
import { upsertClosedDate } from "@/lib/closed-dates";

export async function getClosedDates(from?: Date, to?: Date) {
  try {
    const now = new Date();
    const start = from ?? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const end = to ?? addMonths(start, 6);

    const rows = await prisma.closedDate.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    });

    return { success: true as const, data: rows };
  } catch (error) {
    console.error("Error fetching closed dates:", error);
    return { success: false as const, message: "Failed to fetch closed dates." };
  }
}

export async function addClosedDate(date: Date, reason?: string) {
  await requireRole(STAFF_ROLES);
  try {
    await upsertClosedDate(date, reason);
    return { success: true as const, message: "Date closed successfully." };
  } catch (error) {
    console.error("Error closing date:", error);
    return { success: false as const, message: "Failed to close date." };
  }
}

export async function removeClosedDate(date: Date) {
  await requireRole(STAFF_ROLES);
  try {
    const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    await prisma.closedDate.delete({ where: { date: normalized } });
    return { success: true as const, message: "Date re-opened successfully." };
  } catch (error) {
    console.error("Error re-opening date:", error);
    return { success: false as const, message: "Failed to re-open date." };
  }
}
