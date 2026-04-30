"use server";

import { prisma } from "@/db/prisma";
import { addMonths } from "date-fns";

export async function getClosedDates(from?: Date, to?: Date) {
  try {
    const start = from ?? startOfDay(new Date());
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
  try {
    const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    await prisma.closedDate.upsert({
      where: { date: normalized },
      create: { date: normalized, reason: reason ?? null },
      update: { reason: reason ?? null },
    });
    return { success: true as const, message: "Date closed successfully." };
  } catch (error) {
    console.error("Error closing date:", error);
    return { success: false as const, message: "Failed to close date." };
  }
}

export async function removeClosedDate(date: Date) {
  try {
    const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    await prisma.closedDate.delete({ where: { date: normalized } });
    return { success: true as const, message: "Date re-opened successfully." };
  } catch (error) {
    console.error("Error re-opening date:", error);
    return { success: false as const, message: "Failed to re-open date." };
  }
}
