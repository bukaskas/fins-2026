import { notFound } from "next/navigation";
import Link from "next/link";
import CreateSessionSheet from "./CreateSessionSheet";
import { CopyWhatsAppButton } from "./CopyWhatsAppButton";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { prisma } from "@/db/prisma";
import { CommissionStatus } from "@prisma/client";
import { InstructorCommissionsTable } from "@/components/commission/InstructorCommissionsTable";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string; status?: string }>;
};

function parseStatus(raw: string | undefined): CommissionStatus | undefined {
  if (raw === CommissionStatus.PENDING || raw === CommissionStatus.PAID) return raw;
  return undefined;
}

export default async function InstructorDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const instructor = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });

  if (!instructor) notFound();

  const now = new Date();
  const defaultFrom = format(startOfMonth(now), "yyyy-MM-dd");
  const defaultTo = format(endOfMonth(now), "yyyy-MM-dd");
  const from = sp.from ?? defaultFrom;
  const to = sp.to ?? defaultTo;
  const status = parseStatus(sp.status);

  const currentStart = new Date(`${from}T00:00:00Z`);
  const prevStart = subMonths(currentStart, 1);
  const nextStart = addMonths(currentStart, 1);

  const prevFrom = format(startOfMonth(prevStart), "yyyy-MM-dd");
  const prevTo = format(endOfMonth(prevStart), "yyyy-MM-dd");
  const nextFrom = format(startOfMonth(nextStart), "yyyy-MM-dd");
  const nextTo = format(endOfMonth(nextStart), "yyyy-MM-dd");

  const monthLabel = format(currentStart, "MMMM yyyy");

  const rangeStart = new Date(`${from}T00:00:00.000Z`);
  const rangeEnd = new Date(`${to}T23:59:59.999Z`);

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div>
        <Link href="/instructors" className="text-sm text-muted-foreground hover:underline">
          ← Instructors
        </Link>
        <div className="mt-2">
          <h1 className="text-2xl font-semibold">{instructor.name ?? "Unnamed instructor"}</h1>
          <p className="text-sm text-muted-foreground">{instructor.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={`/instructors/${id}?from=${prevFrom}&to=${prevTo}`}
          className="rounded border px-3 py-1.5 text-sm hover:bg-muted/40 transition-colors"
        >
          ← Prev
        </Link>
        <span className="font-medium text-sm">{monthLabel}</span>
        <Link
          href={`/instructors/${id}?from=${nextFrom}&to=${nextTo}`}
          className="rounded border px-3 py-1.5 text-sm hover:bg-muted/40 transition-colors"
        >
          Next →
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <CopyWhatsAppButton
            instructorId={instructor.id}
            instructorName={instructor.name}
            from={from}
            to={to}
          />
          <Link
            href={`/instructors/${id}/invoice?from=${from}&to=${to}`}
            target="_blank"
            className="rounded border px-3 py-1.5 text-sm hover:bg-muted/40 transition-colors"
          >
            Download Invoice
          </Link>
          <CreateSessionSheet instructorId={instructor.id} instructorName={instructor.name} />
        </div>
      </div>

      <InstructorCommissionsTable
        instructorId={id}
        from={rangeStart}
        to={rangeEnd}
        status={status}
      />
    </main>
  );
}
