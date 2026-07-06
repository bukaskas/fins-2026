import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ExpenseStatus } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { hasRole, STAFF_ROLES } from "@/lib/auth-guard";
import { InvoicePdf } from "@/components/expenses/InvoicePdf";

export const runtime = "nodejs";

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest) {
  if (!(await hasRole(STAFF_ROLES))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const payeeId = url.searchParams.get("payeeId");
  if (!payeeId) {
    return NextResponse.json(
      { error: "payeeId is required" },
      { status: 400 }
    );
  }

  const from = parseDate(url.searchParams.get("from"));
  const to = parseDate(url.searchParams.get("to"));

  const payee = await prisma.user.findUnique({
    where: { id: payeeId },
    select: { id: true, name: true, email: true, phone: true },
  });
  if (!payee) {
    return NextResponse.json({ error: "Payee not found" }, { status: 404 });
  }

  const dateFilter =
    from || to
      ? {
          createdAt: {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
          },
        }
      : {};

  const expenses = await prisma.expense.findMany({
    where: {
      payeeId,
      status: { in: [ExpenseStatus.PENDING, ExpenseStatus.PAID] },
      ...dateFilter,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      type: true,
      description: true,
      amountCents: true,
      status: true,
      createdAt: true,
      paidAt: true,
    },
  });

  const project = (e: (typeof expenses)[number]) => ({
    id: e.id,
    type: e.type,
    description: e.description,
    amountCents: e.amountCents,
    createdAt: e.createdAt,
    paidAt: e.paidAt,
  });

  const pending = expenses
    .filter((e) => e.status === ExpenseStatus.PENDING)
    .map(project);
  const paid = expenses
    .filter((e) => e.status === ExpenseStatus.PAID)
    .map(project);

  const issuedAt = new Date();
  const invoiceNumber = `INV-${payee.id.slice(0, 6).toUpperCase()}-${issuedAt
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}`;

  const buffer = await renderToBuffer(
    InvoicePdf({
      invoiceNumber,
      issuedAt,
      periodFrom: from,
      periodTo: to,
      payee: { name: payee.name, email: payee.email, phone: payee.phone },
      pending,
      paid,
    })
  );

  const safeName = (payee.name || payee.email)
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  const filename = `${invoiceNumber}-${safeName || "statement"}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
