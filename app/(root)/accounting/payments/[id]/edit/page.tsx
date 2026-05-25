import { notFound } from "next/navigation";
import { prisma } from "@/db/prisma";
import EditPaymentForm from "./EditPaymentForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditPaymentPage({ params }: Props) {
  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      commissions: { select: { id: true }, take: 1 },
      expenses: { select: { id: true }, take: 1 },
    },
  });

  if (!payment || payment.commissions.length > 0 || payment.expenses.length > 0) {
    notFound();
  }

  return (
    <EditPaymentForm
      payment={{
        id: payment.id,
        amountCents: payment.amountCents,
        method: payment.method,
        reference: payment.reference,
        receivedAt: payment.receivedAt.toISOString(),
        user: payment.user,
      }}
    />
  );
}
