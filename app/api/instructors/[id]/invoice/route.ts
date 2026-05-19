import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  CommissionStatus,
  ExpenseStatus,
  ExpenseType,
} from "@prisma/client";
import { startOfMonth, endOfMonth } from "date-fns";
import { prisma } from "@/db/prisma";
import { InstructorInvoicePdf } from "@/components/expenses/InstructorInvoicePdf";

export const runtime = "nodejs";

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const url = new URL(req.url);
  const fromRaw = url.searchParams.get("from");
  const toRaw = url.searchParams.get("to");

  const now = new Date();
  const periodFrom =
    parseDate(fromRaw && `${fromRaw}T00:00:00.000Z`) ?? startOfMonth(now);
  const periodTo =
    parseDate(toRaw && `${toRaw}T23:59:59.999Z`) ?? endOfMonth(now);

  const instructor = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true },
  });
  if (!instructor) {
    return NextResponse.json(
      { error: "Instructor not found" },
      { status: 404 }
    );
  }

  const [commissions, otherExpenses] = await Promise.all([
    prisma.instructorCommission.findMany({
      where: {
        instructorId: id,
        status: CommissionStatus.PENDING,
        session: { startsAt: { gte: periodFrom, lte: periodTo } },
      },
      orderBy: { session: { startsAt: "asc" } },
      select: {
        id: true,
        commissionType: true,
        durationMinutes: true,
        finalAmountCents: true,
        session: {
          select: {
            startsAt: true,
            endsAt: true,
            bookings: {
              select: {
                guest: { select: { name: true, email: true } },
              },
            },
          },
        },
      },
    }),
    prisma.expense.findMany({
      where: {
        payeeId: id,
        status: ExpenseStatus.PENDING,
        type: { not: ExpenseType.INSTRUCTOR_COMMISSION },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        type: true,
        description: true,
        amountCents: true,
        createdAt: true,
      },
    }),
  ]);

  const commissionRows = commissions.map((c) => ({
    id: c.id,
    commissionType: c.commissionType,
    durationMinutes: c.durationMinutes,
    finalAmountCents: c.finalAmountCents,
    startsAt: c.session.startsAt,
    endsAt: c.session.endsAt,
    students:
      c.session.bookings
        .map((b) => b.guest.name ?? b.guest.email)
        .join(", ") || "",
  }));

  const issuedAt = new Date();
  const invoiceNumber = `INV-${instructor.id
    .slice(0, 6)
    .toUpperCase()}-${issuedAt.toISOString().slice(0, 10).replace(/-/g, "")}`;

  const buffer = await renderToBuffer(
    InstructorInvoicePdf({
      invoiceNumber,
      issuedAt,
      periodFrom,
      periodTo,
      instructor: {
        name: instructor.name,
        email: instructor.email,
        phone: instructor.phone,
      },
      commissions: commissionRows,
      otherExpenses,
    })
  );

  const safeName = (instructor.name || instructor.email)
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  const filename = `${invoiceNumber}-${safeName || "invoice"}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
