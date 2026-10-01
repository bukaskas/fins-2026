"use server";

import { z } from "zod";
import { prisma } from "@/db/prisma";
import { requireCapability } from "@/lib/auth-guard";
import {
  DAY_USE_BOOKING_HORIZON_MONTHS,
  type DateKey,
  addMonthsToKey,
  dateKeyFromUtcMidnight,
  dateKeyInCairo,
  isDateKey,
} from "@/lib/date-keys";

/** What a calendar needs to know about an event day. */
export type SpecialEventDay = {
  id: string;
  dateKey: DateKey;
  title: string;
  shortLabel: string;
  description: string | null;
  href: string;
  isPublic: boolean;
};

const utcMidnight = (key: DateKey) => new Date(`${key}T00:00:00.000Z`);

const toDay = (row: {
  id: string;
  date: Date;
  title: string;
  shortLabel: string;
  description: string | null;
  href: string;
  isPublic: boolean;
}): SpecialEventDay => ({
  id: row.id,
  dateKey: dateKeyFromUtcMidnight(row.date),
  title: row.title,
  shortLabel: row.shortLabel,
  description: row.description,
  href: row.href,
  isPublic: row.isPublic,
});

/**
 * Public events in the guest booking window (Cairo today → horizon). Open to
 * anyone: the guest calendar calls it before sign-in, and it only ever returns
 * what the guest calendar shows.
 */
export async function getPublicSpecialEvents() {
  try {
    const fromKey = dateKeyInCairo();
    const toKey = addMonthsToKey(fromKey, DAY_USE_BOOKING_HORIZON_MONTHS);
    const rows = await prisma.specialEvent.findMany({
      where: { isPublic: true, date: { gte: utcMidnight(fromKey), lte: utcMidnight(toKey) } },
      orderBy: { date: "asc" },
    });
    return { success: true as const, data: rows.map(toDay) };
  } catch (error) {
    console.error("Error fetching special events:", error);
    return { success: false as const, message: "Failed to fetch special events." };
  }
}

/** Every event in a range, public or not — staff calendars. */
export async function getSpecialEvents(fromKey: DateKey, toKey: DateKey) {
  await requireCapability("bookings:manage");
  try {
    const rows = await prisma.specialEvent.findMany({
      where: { date: { gte: utcMidnight(fromKey), lte: utcMidnight(toKey) } },
      orderBy: { date: "asc" },
    });
    return { success: true as const, data: rows.map(toDay) };
  } catch (error) {
    console.error("Error fetching special events:", error);
    return { success: false as const, message: "Failed to fetch special events." };
  }
}

const specialEventInput = z.object({
  dateKey: z.string().refine(isDateKey, "Pick a real date."),
  title: z.string().trim().min(1, "Title is required.").max(80),
  shortLabel: z.string().trim().min(1, "Calendar label is required.").max(14),
  description: z.string().trim().max(280).optional(),
  // Site-relative only: the guest calendar links straight to it, so an
  // absolute or protocol-relative URL would make it an open redirect.
  href: z
    .string()
    .trim()
    .regex(/^\/(?!\/)[^\s]*$/, "Link must be a path on this site, e.g. /day-use/booking/pharaoh-airstyle."),
  isPublic: z.boolean().default(true),
});

export type SpecialEventInput = z.input<typeof specialEventInput>;

/** Create or replace the event on a date — one event per day. */
export async function saveSpecialEvent(input: SpecialEventInput) {
  await requireCapability("bookings:manage");
  const parsed = specialEventInput.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, message: parsed.error.issues[0]?.message ?? "Invalid event." };
  }
  const { dateKey, description, ...fields } = parsed.data;
  const data = { ...fields, description: description || null };
  try {
    const date = utcMidnight(dateKey);
    await prisma.specialEvent.upsert({
      where: { date },
      create: { date, ...data },
      update: data,
    });
    return { success: true as const, message: "Event saved." };
  } catch (error) {
    console.error("Error saving special event:", error);
    return { success: false as const, message: "Failed to save event." };
  }
}

export async function removeSpecialEvent(dateKey: DateKey) {
  await requireCapability("bookings:manage");
  if (!isDateKey(dateKey)) return { success: false as const, message: "Invalid date." };
  try {
    await prisma.specialEvent.delete({ where: { date: utcMidnight(dateKey) } });
    return { success: true as const, message: "Event removed." };
  } catch (error) {
    console.error("Error removing special event:", error);
    return { success: false as const, message: "Failed to remove event." };
  }
}
