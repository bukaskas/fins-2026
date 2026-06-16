import Link from "next/link";
import { format } from "date-fns";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { getAllDepositPayments } from "@/lib/actions/booking.actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STAFF_ROLES: Role[] = [Role.ADMIN, Role.STAFF, Role.OWNER];

const SERVICE_LABEL: Record<string, string> = {
  "kitesurfing-course": "Kitesurfing course",
  "day-use": "Day use",
  restaurant: "Restaurant",
  "pharaoh-airstyle": "Pharaoh Airstyle",
};

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
    return <div className="p-6 max-w-5xl mx-auto">Error: {result.message}</div>;
  }
  const payments = result.data;
  const totalCents = payments.reduce((s, p) => s + p.amountCents, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-raleway)] text-3xl font-[200] tracking-tight text-[#1a1614]">
            Deposit transfers
          </h1>
          <p className="mt-1 font-[family-name:var(--font-raleway)] text-[0.8rem] text-[#8a8480]">
            {payments.length} {payments.length === 1 ? "payment" : "payments"} ·{" "}
            <span className="font-[family-name:var(--font-roboto-mono)] text-[#5b5650]">
              {fmtEGP(totalCents)} EGP
            </span>{" "}
            collected
          </p>
        </div>
        <Link
          href="/bookings"
          className="font-[family-name:var(--font-raleway)] text-[0.62rem] tracking-[0.22em] uppercase font-[600] text-[#b0a89f] hover:text-[#1a1614] transition-colors"
        >
          ← Bookings
        </Link>
      </div>

      {payments.length === 0 ? (
        <p className="text-[#8a8480] text-sm py-10 text-center font-[family-name:var(--font-raleway)]">
          No deposit payments recorded yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#ece8e3] bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#ece8e3] bg-[#FBF8F3]">
                {["Date", "Guest", "Service", "Amount", "Method", "Reference"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-[family-name:var(--font-raleway)] text-[0.58rem] tracking-[0.18em] uppercase font-[700] text-[#8a8480]"
                    >
                      {h}
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
                    <td className="px-4 py-3 font-[family-name:var(--font-roboto-mono)] text-[0.72rem] text-[#5b5650] whitespace-nowrap">
                      {format(new Date(p.createdAt), "d MMM yyyy")}
                      <span className="block text-[0.62rem] text-[#b0a89f]">
                        {format(new Date(p.createdAt), "HH:mm")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/bookings/${p.bookingId}`}
                        className="font-[family-name:var(--font-raleway)] text-[0.88rem] font-[500] text-[#1a1614] hover:underline"
                      >
                        {p.booking?.name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-[family-name:var(--font-raleway)] text-[0.78rem] text-[#5b5650]">
                      {p.booking
                        ? SERVICE_LABEL[p.booking.service] ??
                          p.booking.service.replace(/-/g, " ")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-[family-name:var(--font-roboto-mono)] text-[0.82rem] text-[#1a1614] whitespace-nowrap tabular-nums">
                      {fmtEGP(p.amountCents)} EGP
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 font-[family-name:var(--font-raleway)] text-[0.6rem] tracking-[0.1em] uppercase font-[700]"
                        style={{ background: tone.bg, color: tone.text }}
                      >
                        {p.method}
                      </span>
                      {isFlash && (
                        <span className="ml-1.5 inline-flex items-center rounded-full bg-[#1a1614] px-2 py-0.5 font-[family-name:var(--font-raleway)] text-[0.55rem] tracking-[0.1em] uppercase font-[700] text-white">
                          Flash
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-[family-name:var(--font-roboto-mono)] text-[0.68rem] text-[#b0a89f] max-w-[14rem] truncate">
                      {p.reference ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-[#ece8e3] bg-[#FBF8F3]">
                <td
                  colSpan={3}
                  className="px-4 py-3 font-[family-name:var(--font-raleway)] text-[0.62rem] tracking-[0.18em] uppercase font-[700] text-[#8a8480]"
                >
                  Total
                </td>
                <td className="px-4 py-3 font-[family-name:var(--font-roboto-mono)] text-[0.85rem] font-[600] text-[#1a1614] whitespace-nowrap tabular-nums">
                  {fmtEGP(totalCents)} EGP
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
