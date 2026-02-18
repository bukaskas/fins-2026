"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";

const BEACH_USE_SKU = "BEACH_USE_DAY";
const BEACH_USE_BASE_PRICE_CENTS = 50000; // 500 EGP
const OWNER_DISCOUNT = 0.2;

export async function quickAddBeachUse(formData: FormData) {
  const guestId = String(formData.get("guestId") ?? "").trim();
  if (!guestId) throw new Error("guestId is required.");

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: guestId },
      select: { id: true, role: true },
    });
    if (!user) throw new Error("User not found.");

    // 1) Active membership => free member beach use
    const activeMembership = await tx.member.findFirst({
      where: { userId: guestId, validUntil: { gte: now } },
      select: { id: true },
    });

    if (activeMembership) {
      await tx.beachVisit.create({
        data: {
          guestId,
          visitDate: now,
          type: "MEMBER_FREE",
          status: "OPEN",
          checkedInAt: now,
          notes: "Desk quick add: active membership",
        },
      });
      return;
    }

    // 2) No membership => try consume 1 available credit
    const grant = await tx.userCreditGrant.findFirst({
      where: {
        userId: guestId,
        remainingUnits: { gte: 1 },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });

    if (grant) {
      const visit = await tx.beachVisit.create({
        data: {
          guestId,
          visitDate: now,
          type: "REGULAR",
          status: "OPEN",
          checkedInAt: now,
          notes: "Desk quick add: paid with credit",
        },
      });

      const updated = await tx.userCreditGrant.updateMany({
        where: { id: grant.id, remainingUnits: { gte: 1 } },
        data: { remainingUnits: { decrement: 1 } },
      });
      if (updated.count === 0) throw new Error("Credit was consumed by another request.");

      await tx.userCreditUsage.create({
        data: {
          grantId: grant.id,
          userId: guestId,
          unitsUsed: 1,
          beachVisitId: visit.id,
        },
      });

      return;
    }

    // 3) No membership + no credit => charge outstanding
    const isOwner = user.role === "OWNER";
    const chargeCents = isOwner
      ? Math.trunc(BEACH_USE_BASE_PRICE_CENTS * (1 - OWNER_DISCOUNT))
      : BEACH_USE_BASE_PRICE_CENTS;

    await tx.beachVisit.create({
      data: {
        guestId,
        visitDate: now,
        type: "REGULAR",
        status: "OPEN",
        checkedInAt: now,
        notes: isOwner
          ? "Desk quick add: OWNER 20% discount"
          : "Desk quick add: regular 500 EGP",
      },
    });

    let product = await tx.product.findUnique({
      where: { sku: BEACH_USE_SKU },
      select: { id: true },
    });

    if (!product) {
      product = await tx.product.create({
        data: {
          name: "Beach Use Day",
          sku: BEACH_USE_SKU,
          type: "SERVICE",
          priceCents: BEACH_USE_BASE_PRICE_CENTS,
          currency: "EGP",
          isActive: true,
        },
        select: { id: true },
      });
    }

    // OPEN order = outstanding balance
    await tx.order.create({
      data: {
        userId: guestId,
        status: "OPEN",
        totalCents: chargeCents,
        lines: {
          create: [
            {
              productId: product.id,
              qty: 1,
              unitPriceCents: chargeCents,
              lineTotalCents: chargeCents,
            },
          ],
        },
      },
    });
  });

  revalidatePath("/register");
}