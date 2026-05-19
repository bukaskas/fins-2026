"use server";

import { prisma } from "@/db/prisma";
import {
  CommissionStatus,
  ExpenseStatus,
  ExpenseType,
  PaymentMethod,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

export type ExpenseFilters = {
  status?: ExpenseStatus;
  type?: ExpenseType;
  payeeId?: string;
  from?: Date;
  to?: Date;
};

const expenseInclude = {
  payee: { select: { id: true, name: true, email: true } },
  payment: {
    select: {
      id: true,
      method: true,
      reference: true,
      receivedAt: true,
      amountCents: true,
    },
  },
} satisfies Prisma.ExpenseInclude;

export type ExpenseWithPayee = Prisma.ExpenseGetPayload<{
  include: typeof expenseInclude;
}>;

function revalidateExpensePaths() {
  revalidatePath("/accounting/expenses");
}

export async function createExpense(input: {
  type: Exclude<ExpenseType, "INSTRUCTOR_COMMISSION">;
  description?: string;
  amountCents: number;
  payeeId?: string;
}): Promise<{ success: boolean; id?: string; message?: string }> {
  if ((input.type as ExpenseType) === ExpenseType.INSTRUCTOR_COMMISSION) {
    return {
      success: false,
      message:
        "Instructor commission expenses are created automatically. Use the commission flow.",
    };
  }
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    return { success: false, message: "Amount must be a positive integer (cents)." };
  }

  try {
    if (input.payeeId) {
      const payee = await prisma.user.findUnique({
        where: { id: input.payeeId },
        select: { id: true },
      });
      if (!payee) return { success: false, message: "Payee not found." };
    }

    const description = input.description?.trim() || null;

    const created = await prisma.expense.create({
      data: {
        type: input.type,
        amountCents: input.amountCents,
        description,
        payeeId: input.payeeId ?? null,
        status: ExpenseStatus.PENDING,
      },
      select: { id: true },
    });

    revalidateExpensePaths();
    return { success: true, id: created.id };
  } catch (error) {
    return {
      success: false,
      message: `Failed to create expense. ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

export async function cancelExpense(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const existing = await prisma.expense.findUnique({
      where: { id },
      select: { id: true, type: true, status: true },
    });
    if (!existing) return { success: false, message: "Expense not found." };

    if (existing.type === ExpenseType.INSTRUCTOR_COMMISSION) {
      return {
        success: false,
        message:
          "Commission expenses are managed via the commission flow, not directly.",
      };
    }
    if (existing.status !== ExpenseStatus.PENDING) {
      return {
        success: false,
        message: "Only pending expenses can be canceled.",
      };
    }

    const result = await prisma.expense.updateMany({
      where: { id, status: ExpenseStatus.PENDING },
      data: { status: ExpenseStatus.CANCELED },
    });

    if (result.count === 0) {
      return {
        success: false,
        message: "Expense state changed while saving. Reload and try again.",
      };
    }

    revalidateExpensePaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: `Failed to cancel expense. ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

export async function markExpensePaid(
  id: string,
  paymentId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findUnique({
        where: { id },
        select: { id: true, status: true, paymentId: true, type: true },
      });
      if (!expense) return { success: false, message: "Expense not found." };

      if (expense.type === ExpenseType.INSTRUCTOR_COMMISSION) {
        return {
          success: false,
          message:
            "Commission expenses are paid via the commission flow, not directly.",
        };
      }

      if (expense.status === ExpenseStatus.PAID) {
        if (expense.paymentId === paymentId) {
          return { success: true, idempotent: true as const };
        }
        return {
          success: false,
          message: "Expense is already paid under a different payment.",
        };
      }

      if (expense.status === ExpenseStatus.CANCELED) {
        return {
          success: false,
          message: "Canceled expenses cannot be marked paid.",
        };
      }

      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        select: { id: true },
      });
      if (!payment) return { success: false, message: "Payment not found." };

      const result = await tx.expense.updateMany({
        where: { id, status: ExpenseStatus.PENDING },
        data: {
          status: ExpenseStatus.PAID,
          paymentId,
          paidAt: new Date(),
        },
      });

      if (result.count === 0) {
        return {
          success: false,
          message: "Expense state changed while saving. Reload and try again.",
        };
      }

      revalidateExpensePaths();
      return { success: true };
    });
  } catch (error) {
    return {
      success: false,
      message: `Failed to mark expense paid. ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

export async function listExpenses(filters: ExpenseFilters = {}): Promise<{
  rows: ExpenseWithPayee[];
  totals: {
    pending: { count: number; cents: number };
    paid: { count: number; cents: number };
  };
}> {
  const where: Prisma.ExpenseWhereInput = {
    ...(filters.status && { status: filters.status }),
    ...(filters.type && { type: filters.type }),
    ...(filters.payeeId && { payeeId: filters.payeeId }),
    ...((filters.from || filters.to) && {
      createdAt: {
        ...(filters.from && { gte: filters.from }),
        ...(filters.to && { lte: filters.to }),
      },
    }),
  };

  const [rows, grouped] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: expenseInclude,
      take: 500,
    }),
    prisma.expense.groupBy({
      by: ["status"],
      where,
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
  ]);

  const totals = {
    pending: { count: 0, cents: 0 },
    paid: { count: 0, cents: 0 },
  };
  for (const g of grouped) {
    if (g.status === ExpenseStatus.PAID) {
      totals.paid.count = g._count._all;
      totals.paid.cents = g._sum.amountCents ?? 0;
    } else if (g.status === ExpenseStatus.PENDING) {
      totals.pending.count = g._count._all;
      totals.pending.cents = g._sum.amountCents ?? 0;
    }
  }

  return { rows, totals };
}

type SettlePayeeExpensesInput = {
  payeeId: string;
  from?: Date;
  to?: Date;
  expenseIds?: string[];
  method: PaymentMethod;
  reference?: string | null;
  receivedAt?: Date;
};

export async function settlePayeeExpenses(input: SettlePayeeExpensesInput) {
  const { payeeId, from, to, expenseIds, method, reference, receivedAt } = input;

  try {
    return await prisma.$transaction(async (tx) => {
      const where: Prisma.ExpenseWhereInput = {
        payeeId,
        status: ExpenseStatus.PENDING,
        ...(expenseIds && expenseIds.length > 0
          ? { id: { in: expenseIds } }
          : {}),
        ...((from || to) && {
          createdAt: {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
          },
        }),
      };

      const pending = await tx.expense.findMany({
        where,
        select: { id: true, amountCents: true, commissionId: true },
      });

      if (pending.length === 0) {
        return {
          success: false as const,
          message: "No pending expenses to settle.",
        };
      }

      const totalCents = pending.reduce((sum, e) => sum + e.amountCents, 0);
      const ids = pending.map((e) => e.id);
      const commissionIds = pending
        .map((e) => e.commissionId)
        .filter((v): v is string => Boolean(v));
      const paidAt = receivedAt ?? new Date();

      const payment = await tx.payment.create({
        data: {
          userId: payeeId,
          amountCents: totalCents,
          method,
          reference: reference?.trim() ? reference.trim() : null,
          receivedAt: paidAt,
        },
      });

      const result = await tx.expense.updateMany({
        where: { id: { in: ids }, status: ExpenseStatus.PENDING },
        data: {
          status: ExpenseStatus.PAID,
          paymentId: payment.id,
          paidAt,
        },
      });

      if (result.count !== ids.length) {
        throw new Error(
          "Expense state changed during settlement. Reload and try again."
        );
      }

      if (commissionIds.length > 0) {
        await tx.instructorCommission.updateMany({
          where: {
            id: { in: commissionIds },
            status: CommissionStatus.PENDING,
          },
          data: {
            status: CommissionStatus.PAID,
            paymentId: payment.id,
            paidAt,
          },
        });
      }

      revalidateExpensePaths();
      revalidatePath("/instructors");
      return {
        success: true as const,
        paymentId: payment.id,
        count: result.count,
        totalCents,
      };
    });
  } catch (error) {
    return {
      success: false as const,
      message: `Failed to settle expenses. ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

export async function getExpenseSummary(): Promise<{
  pendingCount: number;
  pendingCents: number;
  paidCents: number;
  byType: Record<ExpenseType, { pendingCents: number; count: number }>;
}> {
  const byTypeAndStatus = await prisma.expense.groupBy({
    by: ["type", "status"],
    _sum: { amountCents: true },
    _count: { _all: true },
  });

  const byType = Object.values(ExpenseType).reduce(
    (acc, t) => {
      acc[t] = { pendingCents: 0, count: 0 };
      return acc;
    },
    {} as Record<ExpenseType, { pendingCents: number; count: number }>
  );

  let pendingCount = 0;
  let pendingCents = 0;
  let paidCents = 0;

  for (const g of byTypeAndStatus) {
    const cents = g._sum.amountCents ?? 0;
    if (g.status === ExpenseStatus.PENDING) {
      pendingCount += g._count._all;
      pendingCents += cents;
      byType[g.type].pendingCents += cents;
      byType[g.type].count += g._count._all;
    } else if (g.status === ExpenseStatus.PAID) {
      paidCents += cents;
    }
  }

  return { pendingCount, pendingCents, paidCents, byType };
}
