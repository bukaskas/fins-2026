import "server-only";

import { prisma } from "@/db/prisma";
import {
  Prisma,
  WalletLedgerReason,
  WalletType,
  WalletUnit,
} from "@prisma/client";

// Internal wallet helpers. Deliberately NOT in a "use server" file: these must
// never be invokable as server-action endpoints — postWalletLedger can credit
// arbitrary amounts. Call them from guarded server code only.

type DecimalLike = Prisma.Decimal | number | string;

type PostWalletLedgerInput = {
  walletId: string;
  userId: string;
  actorId?: string | null;
  delta: DecimalLike; // signed (+ credit, - consumption)
  reason: WalletLedgerReason;
  note?: string | null;
  idempotencyKey?: string | null;

  orderId?: string | null;
  orderLineId?: string | null;
  paymentId?: string | null;
  lessonBookingId?: string | null;
  beachVisitId?: string | null;
  rentalId?: string | null;
};

function toDecimal(value: DecimalLike) {
  return new Prisma.Decimal(value);
}

export async function getOrCreateWallet(
  userId: string,
  type: WalletType,
  unit: WalletUnit
) {
  const wallet = await prisma.userWallet.upsert({
    where: { userId_type: { userId, type } },
    update: {},
    create: {
      userId,
      type,
      unit,
      balance: new Prisma.Decimal(0),
    },
  });

  if (wallet.unit !== unit) {
    throw new Error(
      `Wallet unit mismatch for ${type}. Expected ${unit}, found ${wallet.unit}.`
    );
  }

  return wallet;
}

export async function postWalletLedger(input: PostWalletLedgerInput) {
  const delta = toDecimal(input.delta);

  if (delta.equals(0)) {
    throw new Error("Ledger delta must not be 0.");
  }

  // Fast idempotency return
  if (input.idempotencyKey) {
    const existing = await prisma.walletLedger.findUnique({
      where: {
        walletId_idempotencyKey: {
          walletId: input.walletId,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });

    if (existing) return existing;
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Atomic wallet balance update
      const updatedWallet = await tx.userWallet.update({
        where: { id: input.walletId, userId: input.userId },
        data: { balance: { increment: delta } },
        select: { id: true, userId: true, balance: true },
      });

      if (updatedWallet.userId !== input.userId) {
        throw new Error("walletId does not belong to userId.");
      }

      // Create immutable ledger row
      const entry = await tx.walletLedger.create({
        data: {
          walletId: input.walletId,
          userId: input.userId,
          actorId: input.actorId ?? null,
          delta,
          balanceAfter: updatedWallet.balance,
          reason: input.reason,
          note: input.note ?? null,
          idempotencyKey: input.idempotencyKey ?? null,

          orderId: input.orderId ?? null,
          orderLineId: input.orderLineId ?? null,
          paymentId: input.paymentId ?? null,
          lessonBookingId: input.lessonBookingId ?? null,
          beachVisitId: input.beachVisitId ?? null,
          rentalId: input.rentalId ?? null,
        },
      });

      return entry;
    });
  } catch (err) {
    // Race-safe idempotency: if duplicate key was inserted in parallel, return it
    const known = err as { code?: string; meta?: { target?: unknown } };
    if (
      input.idempotencyKey &&
      known?.code === "P2002" &&
      String(known?.meta?.target ?? "").includes("walletId") &&
      String(known?.meta?.target ?? "").includes("idempotencyKey")
    ) {
      const existing = await prisma.walletLedger.findUnique({
        where: {
          walletId_idempotencyKey: {
            walletId: input.walletId,
            idempotencyKey: input.idempotencyKey,
          },
        },
      });
      if (existing) return existing;
    }
    throw err;
  }
}
