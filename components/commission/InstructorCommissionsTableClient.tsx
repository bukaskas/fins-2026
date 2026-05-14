"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { CommissionStatus, CommissionType } from "@prisma/client";
import { COMMISSION_TYPE_LABELS, formatEGP } from "@/lib/commission";
import { CommissionStatusBadge } from "./CommissionStatusBadge";
import {
  LessonSessionEditSheet,
  type SessionRow,
  type EditSheetServiceProduct,
} from "@/components/lessons/LessonSessionEditSheet";

type CommissionRow = {
  id: string;
  commissionType: CommissionType;
  durationMinutes: number;
  rateAtCreationCents: number;
  calculatedAmountCents: number;
  overrideAmountCents: number | null;
  finalAmountCents: number;
  status: CommissionStatus;
  session: {
    id: string;
    startsAt: Date | string;
    endsAt: Date | string;
    lessonType: string;
    capacity: number;
    notes: string | null;
    instructor: { id: string; name: string | null; email: string | null } | null;
    bookings: {
      id: string;
      status: string;
      guest: { id: string; name: string | null; email: string; phone: string | null };
    }[];
  };
  payment: {
    id: string;
    method: string;
    reference: string | null;
  } | null;
};

function toSessionRow(r: CommissionRow): SessionRow {
  return {
    id: r.session.id,
    startsAt: new Date(r.session.startsAt).toISOString(),
    endsAt: new Date(r.session.endsAt).toISOString(),
    lessonType: r.session.lessonType,
    capacity: r.session.capacity,
    notes: r.session.notes,
    instructor: r.session.instructor,
    bookings: r.session.bookings,
    commission: {
      id: r.id,
      commissionType: r.commissionType,
      durationMinutes: r.durationMinutes,
      rateAtCreationCents: r.rateAtCreationCents,
      calculatedAmountCents: r.calculatedAmountCents,
      overrideAmountCents: r.overrideAmountCents,
      finalAmountCents: r.finalAmountCents,
      status: r.status,
    },
  };
}

type Props = {
  rows: CommissionRow[];
  instructors: { id: string; name: string | null }[];
  serviceProducts: EditSheetServiceProduct[];
};

export function InstructorCommissionsTableClient({ rows, instructors, serviceProducts }: Props) {
  const router = useRouter();
  const [editSession, setEditSession] = useState<SessionRow | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-left">Duration</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Student(s)</th>
              <th className="px-3 py-2 text-right">Calculated</th>
              <th className="px-3 py-2 text-right">Override</th>
              <th className="px-3 py-2 text-right">Final</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Payment</th>
              <th className="px-3 py-2" />
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
              const paymentLabel = r.payment
                ? `${r.payment.method.toLowerCase()}${r.payment.reference ? ` · ${r.payment.reference}` : ""}`
                : "—";

              return (
                <tr key={r.id} className="border-b">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {format(startsAt, "dd MMM yyyy")}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {format(startsAt, "HH:mm")}–{format(endsAt, "HH:mm")}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{dur}</td>
                  <td className="px-3 py-2">
                    {COMMISSION_TYPE_LABELS[r.commissionType]}
                  </td>
                  <td className="px-3 py-2">{students}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {formatEGP(r.calculatedAmountCents)}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {r.overrideAmountCents != null
                      ? formatEGP(r.overrideAmountCents)
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap font-medium">
                    {formatEGP(r.finalAmountCents)}
                  </td>
                  <td className="px-3 py-2">
                    <CommissionStatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                    {paymentLabel}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => setEditSession(toSessionRow(r))}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Edit session"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editSession && (
        <LessonSessionEditSheet
          session={editSession}
          instructors={instructors}
          serviceProducts={serviceProducts}
          open={!!editSession}
          onOpenChange={(open) => { if (!open) setEditSession(null); }}
          onSaved={() => { setEditSession(null); router.refresh(); }}
          onDeleted={() => { setEditSession(null); router.refresh(); }}
        />
      )}
    </>
  );
}
