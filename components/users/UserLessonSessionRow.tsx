"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  LessonSessionEditSheet,
  type SessionRow,
  type EditSheetServiceProduct,
} from "@/components/lessons/LessonSessionEditSheet";

function fmtDuration(start: Date, end: Date) {
  const mins = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function UserLessonSessionRow({
  session,
  bookingStatus,
  instructors,
  serviceProducts,
}: {
  session: SessionRow;
  bookingStatus: string;
  instructors: { id: string; name: string | null }[];
  serviceProducts: EditSheetServiceProduct[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const startsAt = new Date(session.startsAt);
  const endsAt = new Date(session.endsAt);
  const instructorName =
    session.instructor?.name ?? session.instructor?.email ?? "—";

  return (
    <>
      <TableRow
        onClick={() => setOpen(true)}
        className="cursor-pointer hover:bg-muted/40 transition-colors"
      >
        <TableCell>{format(startsAt, "PPp")}</TableCell>
        <TableCell>{session.lessonType.replace(/_/g, " ")}</TableCell>
        <TableCell>{instructorName}</TableCell>
        <TableCell>{fmtDuration(startsAt, endsAt)}</TableCell>
        <TableCell>{bookingStatus}</TableCell>
      </TableRow>

      <LessonSessionEditSheet
        session={session}
        instructors={instructors}
        serviceProducts={serviceProducts}
        open={open}
        onOpenChange={setOpen}
        onSaved={() => {
          router.refresh();
        }}
        onDeleted={() => {
          router.refresh();
        }}
      />
    </>
  );
}
