import { prisma } from "@/db/prisma";
import { CommissionStatus, ExpenseStatus, ExpenseType } from "@prisma/client";

async function main() {
  const orphans = await prisma.instructorCommission.findMany({
    where: { expense: null },
    select: {
      id: true,
      instructorId: true,
      finalAmountCents: true,
      status: true,
      paymentId: true,
      paidAt: true,
    },
  });

  if (orphans.length === 0) {
    console.log("No commissions need backfilling.");
    return;
  }

  let pendingCreated = 0;
  let paidCreated = 0;

  for (const c of orphans) {
    const isPaid = c.status === CommissionStatus.PAID;
    await prisma.expense.create({
      data: {
        type: ExpenseType.INSTRUCTOR_COMMISSION,
        amountCents: c.finalAmountCents,
        payeeId: c.instructorId,
        commissionId: c.id,
        status: isPaid ? ExpenseStatus.PAID : ExpenseStatus.PENDING,
        paymentId: isPaid ? c.paymentId ?? null : null,
        paidAt: isPaid ? c.paidAt ?? null : null,
      },
    });
    if (isPaid) paidCreated += 1;
    else pendingCreated += 1;
  }

  console.log(
    `Backfilled ${orphans.length} expense rows (PENDING: ${pendingCreated}, PAID: ${paidCreated}).`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
