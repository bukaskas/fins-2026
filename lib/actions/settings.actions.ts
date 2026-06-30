"use server";

import { getServerSession } from "next-auth/next";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/db/prisma";
import { authOptions } from "@/lib/auth";

const STAFF_ROLES: Role[] = [Role.ADMIN, Role.STAFF, Role.OWNER];

// Setting keys (string-keyed AppSetting rows).
const AUTO_CONFIRM_KEY = "auto_confirm_bookings";

/**
 * When ON, brand-new customers' bookings go straight to WAITING_PAYMENT on
 * submit (instead of PENDING). Existing customers always go to WAITING_PAYMENT
 * regardless of this setting. Defaults to OFF.
 */
export async function getAutoConfirmBookings(): Promise<boolean> {
  try {
    const row = await prisma.appSetting.findUnique({
      where: { key: AUTO_CONFIRM_KEY },
      select: { value: true },
    });
    return row?.value === "true";
  } catch (error) {
    console.error("Failed to read auto-confirm setting:", error);
    return false;
  }
}

export async function setAutoConfirmBookings(enabled: boolean) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: Role } | undefined)?.role;
    if (!role || !STAFF_ROLES.includes(role)) {
      return { success: false as const, message: "Not authorized." };
    }

    const value = enabled ? "true" : "false";
    await prisma.appSetting.upsert({
      where: { key: AUTO_CONFIRM_KEY },
      create: { key: AUTO_CONFIRM_KEY, value },
      update: { value },
    });

    revalidatePath("/bookings/dashboard");
    return { success: true as const, enabled };
  } catch (error) {
    console.error("Failed to update auto-confirm setting:", error);
    return {
      success: false as const,
      message: `Failed to update setting. ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
