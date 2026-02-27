"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";
import { Prisma, WalletLedgerReason, WalletType, WalletUnit } from "@prisma/client";


const BEACH_USE_SKU = "BEACH_USE_DAY";
const BEACH_USE_BASE_PRICE_CENTS = 50000; // 500 EGP
const OWNER_DISCOUNT = 0.2;

export async function quickAddBeachUse(formData: FormData) {
  const guestId = String(formData.get("guestId") ?? "").trim();
  if (!guestId) throw new Error("guestId is required.");

  const now = new Date();
  const visitDate = now; // added
  const notes = String(formData.get("notes") ?? "").trim() || null; // added
  const actorId = String(formData.get("actorId") ?? "").trim() || null; // added

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
    const wallet = await tx.userWallet.findUnique({
      where: { userId_type: { userId: guestId, type: WalletType.BEACH_USE } },
      select: { id: true, userId: true, balance: true, unit: true },
    });

    if (wallet && wallet.unit === WalletUnit.ENTRY && wallet.balance.gte(1)) {
      const visit = await tx.beachVisit.create({
        data: {
          guestId,
          visitDate,
          type: "REGULAR",
          status: "OPEN",
          notes,
          checkedInAt: now,
        },
      });

      const newBalance = wallet.balance.sub(new Prisma.Decimal(1));

      await tx.userWallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: 1 } },
      });

      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          userId: guestId,
          actorId: actorId ?? null,
          delta: new Prisma.Decimal(-1),
          balanceAfter: newBalance,
          reason: WalletLedgerReason.CONSUMPTION,
          beachVisitId: visit.id,
          note: "Beach entry consumed",
          idempotencyKey: `beach:${visit.id}:consume:1`,
        },
      });

      return { ok: true, visitId: visit.id, charged: false };
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