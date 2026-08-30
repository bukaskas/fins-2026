import Link from "next/link";
import { format } from "date-fns";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { ArrowLeft } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { getAllDepositPayments } from "@/lib/actions/booking.actions";
import { DeletePaymentButton } from "./DeletePaymentButton";
import { FOCUS_RING, MUTED } from "@/lib/bookings/status";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STAFF_ROLES: Role[] = [Role.ADMIN, Role.STAFF, Role.OWNER];

const METHOD_TONE: Record<string, { bg: string; text: string }> = {
  CASH: { bg: "#E2F0E6", text: "#1F5B36" },
  CARD: { bg: "#E4F1FA", text: "#1E4F72" },
  VISA: { bg: "#E4F1FA", text: "#1E4F72" },
  TRANSFER: { bg: "#EDE6F8", text: "#4B348A" },
  DISCOUNT: { bg: "#FCE6D5", text: "#7A3E18" },
  EURO: { bg: "#F2F1EE", text: "#615C55" },
  USD: { bg: "#F2F1EE", text: "#615C55" },
};

function fmtEGP(cents: number): string {
  return new Intl.NumberFormat("en-EG").format(Math.round(cents / 100));
}

export default async function DepositPaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/bookings/payments");
  const role = (session.user as { role?: Role } | undefined)?.role;
  if (!role || !STAFF_ROLES.includes(role)) redirect("/");

  const result = await getAllDepositPayments();
  if (!result.success) {
    return (
      <div
        role="alert"
        className="mx-auto max-w-5xl p-6 font-[family-name:var(--font-raleway)] text-base text-[#b91c1c]"
      >
        Could not load booking payments: {result.message}
      </div>
    );
  }
  const payments = result.data;
  const totalCents = payments.reduce((s, p) => s + p.amountCents, 0);

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-[family-name:var(--font-raleway)] text-3xl font-[400] tracking-tight text-[#1a1614]">
            Deposit transfers
          </h1>
          <p className="mt-1 font-[family-name:var(--font-raleway)] text-[0.8rem]" style={{ color: MUTED }}>
            {payments.length} {payments.length === 1 ? "payment" : "payments"} ·{" "}
            <span className="font-[family-name:var(--font-roboto-mono)] text-[#5b5650]">
              {fmtEGP(totalCents)} EGP
            </span>{" "}
            collected
          </p>
        </div>
        <Link
          href="/bookings"
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.14em] uppercase font-[600] text-[#6b6460] transition-colors hover:bg-[#f5f2ef] hover:text-[#1a1614] ${FOCUS_RING}`}
        >
          <ArrowLeft className="size-4" strokeWidth={1.8} aria-hidden="true" />
          Bookings
        </Link>
      </div>

      {payments.length === 0 ? (
        <p className="py-10 text-center font-[family-name:var(--font-raleway)] text-sm" style={{ color: MUTED }}>
          No deposit payments recorded yet.
        </p>
      ) : (
        <div
          role="region"
          aria-label="Booking payments table"
          tabIndex={0}
          className={`overflow-x-auto rounded-xl border border-[#ece8e3] bg-white ${FOCUS_RING}`}
        >
          <table className="min-w-[52rem] w-full text-left">
            <caption className="sr-only">
              Recorded booking payments, including guest, amount, method, reference, and actions
            </caption>
            <thead>
              <tr className="border-b border-[#ece8e3] bg-[#FBF8F3]">
                {["Date", "Guest", "Agent", "Amount", "Method", "Reference", "Actions"].map(
                  (h, i) => (
                    <th
                      key={`${h}-${i}`}
                      scope="col"
                      className="px-4 py-3 font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.12em] uppercase font-[700] text-[#6b6460]"
                    >
                      {h === "Actions" ? <span className="sr-only">Actions</span> : h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const tone = METHOD_TONE[p.method] ?? {
                  bg: "#F2F1EE",
                  text: "#615C55",
                };
                const isFlash = Boolean(p.flashTransactionId);
                return (
                  <tr
                    key={p.id}
                    className="border-b border-[#f3f0ec] last:border-0 hover:bg-[#FBF8F3] transition-colors"
                  >
                    <td className="px-4 py-3 font-[family-name:var(--font-roboto-mono)] text-[0.75rem] text-[#5b5650] whitespace-nowrap">
                      {format(new Date(p.createdAt), "d MMM yyyy")}
                      <span className="block text-[0.75rem] text-[#6b6460]">
                        {format(new Date(p.createdAt), "HH:mm")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/bookings/${p.bookingId}`}
                        className={`inline-flex min-h-11 items-center rounded-md font-[family-name:var(--font-raleway)] text-[0.88rem] font-[500] text-[#1a1614] hover:underline ${FOCUS_RING}`}
                      >
                        {p.booking?.name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-[family-name:var(--font-raleway)] text-[0.78rem] text-[#5b5650]">
                      {p.booking?.agent
                        ? p.booking.agent.name || p.booking.agent.email
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-[family-name:var(--font-roboto-mono)] text-[0.82rem] text-[#1a1614] whitespace-nowrap tabular-nums">
                      {fmtEGP(p.amountCents)} EGP
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.08em] uppercase font-[700]"
                        style={{ background: tone.bg, color: tone.text }}
                      >
                        {p.method}
                      </span>
                      {isFlash && (
                        <span className="ml-1.5 inline-flex items-center rounded-full bg-[#1a1614] px-2 py-1 font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.08em] uppercase font-[700] text-white">
                          Flash
                        </span>
                      )}
                    </td>
                    <td className="max-w-[14rem] truncate px-4 py-3 font-[family-name:var(--font-roboto-mono)] text-[0.75rem] text-[#6b6460]">
                      {p.reference ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <DeletePaymentButton
                        paymentId={p.id}
                        guestName={p.booking?.name ?? ""}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-[#ece8e3] bg-[#FBF8F3]">
                <td
                  colSpan={3}
                  className="px-4 py-3 font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.12em] uppercase font-[700] text-[#6b6460]"
                >
                  Total
                </td>
                <td className="px-4 py-3 font-[family-name:var(--font-roboto-mono)] text-[0.85rem] font-[600] text-[#1a1614] whitespace-nowrap tabular-nums">
                  {fmtEGP(totalCents)} EGP
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </main>
  );
}
