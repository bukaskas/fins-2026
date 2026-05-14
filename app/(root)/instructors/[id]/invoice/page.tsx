import { notFound } from "next/navigation";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { prisma } from "@/db/prisma";
import { CommissionStatus } from "@prisma/client";
import { getInstructorCommissions } from "@/lib/actions/commission.actions";
import { COMMISSION_TYPE_LABELS, formatEGP } from "@/lib/commission";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
};

export default async function CommissionInvoicePage({ params, searchParams }: Props) {
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

  const rangeStart = new Date(`${from}T00:00:00.000Z`);
  const rangeEnd = new Date(`${to}T23:59:59.999Z`);

  const { rows, totals } = await getInstructorCommissions(instructor.id, {
    from: rangeStart,
    to: rangeEnd,
    status: CommissionStatus.PENDING,
  });

  const periodLabel = `${format(rangeStart, "d MMM yyyy")} – ${format(rangeEnd, "d MMM yyyy")}`;
  const generatedLabel = format(now, "d MMM yyyy");

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          @page { margin: 20mm; size: A4; }
        }
      `}</style>

      {/* Print/Back bar — hidden when printing */}
      <div className="no-print flex items-center gap-3 px-8 py-4 border-b bg-white sticky top-0 z-10">
        <a
          href={`/instructors/${id}?from=${from}&to=${to}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back
        </a>
        <div className="ml-auto">
          <PrintButton />
        </div>
      </div>

      {/* Invoice body */}
      <div className="max-w-3xl mx-auto px-8 py-12 bg-white min-h-screen">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-[0.6rem] tracking-[0.35em] uppercase font-semibold text-gray-400 mb-1">
              Commission Invoice
            </p>
            <h1 className="text-3xl font-light tracking-tight text-gray-900">
              {instructor.name ?? "Instructor"}
            </h1>
            {instructor.email && (
              <p className="text-sm text-gray-500 mt-0.5">{instructor.email}</p>
            )}
          </div>
          <div className="text-right text-sm text-gray-500 space-y-0.5">
            <p><span className="font-medium text-gray-700">Period:</span> {periodLabel}</p>
            <p><span className="font-medium text-gray-700">Generated:</span> {generatedLabel}</p>
            <p><span className="font-medium text-gray-700">Status:</span> Outstanding</p>
          </div>
        </div>

        <div className="h-px bg-gray-200 mb-8" />

        {/* Sessions table */}
        {rows.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-16">
            No outstanding commissions for this period.
          </p>
        ) : (
          <>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left pb-3 text-[0.62rem] tracking-[0.2em] uppercase text-gray-400 font-semibold pr-4">Date</th>
                  <th className="text-left pb-3 text-[0.62rem] tracking-[0.2em] uppercase text-gray-400 font-semibold pr-4">Time</th>
                  <th className="text-left pb-3 text-[0.62rem] tracking-[0.2em] uppercase text-gray-400 font-semibold pr-4">Duration</th>
                  <th className="text-left pb-3 text-[0.62rem] tracking-[0.2em] uppercase text-gray-400 font-semibold pr-4">Type</th>
                  <th className="text-left pb-3 text-[0.62rem] tracking-[0.2em] uppercase text-gray-400 font-semibold pr-4">Students</th>
                  <th className="text-right pb-3 text-[0.62rem] tracking-[0.2em] uppercase text-gray-400 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const startsAt = new Date(r.session.startsAt);
                  const endsAt = new Date(r.session.endsAt);
                  const h = Math.floor(r.durationMinutes / 60);
                  const m = r.durationMinutes % 60;
                  const dur = h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
                  const students =
                    r.session.bookings
                      .map((b) => b.guest.name ?? b.guest.email)
                      .join(", ") || "—";

                  return (
                    <tr key={r.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 whitespace-nowrap text-gray-700">
                        {format(startsAt, "dd MMM yyyy")}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap text-gray-600">
                        {format(startsAt, "HH:mm")}–{format(endsAt, "HH:mm")}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap text-gray-600">{dur}</td>
                      <td className="py-3 pr-4 text-gray-700">
                        {COMMISSION_TYPE_LABELS[r.commissionType]}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 max-w-[180px] truncate">
                        {students}
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                        {formatEGP(r.finalAmountCents)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Total */}
            <div className="mt-6 flex justify-end">
              <div className="border-t-2 border-gray-900 pt-4 min-w-[220px]">
                <div className="flex items-baseline justify-between gap-8">
                  <span className="text-[0.62rem] tracking-[0.2em] uppercase font-semibold text-gray-400">
                    Total Outstanding
                  </span>
                  <span className="text-2xl font-light text-gray-900">
                    {formatEGP(totals.pending.cents)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {totals.pending.count} session{totals.pending.count !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-16 pt-6 border-t border-gray-100 text-xs text-gray-400 text-center">
          Fins Kite School · Commission record for {periodLabel}
        </div>
      </div>
    </>
  );
}
