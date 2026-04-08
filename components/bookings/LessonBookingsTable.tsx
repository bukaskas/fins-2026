"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { LessonBookingEditSheet } from "./LessonBookingEditSheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Instructor = { id: string; name: string | null; email?: string | null };

export type LessonBookingRow = {
  id: string;
  status: string;
  attended: boolean;
  notes: string | null;
  guest: { name: string | null; email: string; phone: string | null };
  session: {
    startsAt: string;
    endsAt: string;
    lessonType: string;
    capacity: number;
    instructor: Instructor | null;
  };
};

export function LessonBookingsTable({
  bookings,
  instructors,
}: {
  bookings: LessonBookingRow[];
  instructors: Instructor[];
}) {
  const [selectedInstructor, setSelectedInstructor] = useState("all");
  const [rows, setRows] = useState<LessonBookingRow[]>(bookings);
  const [editTarget, setEditTarget] = useState<LessonBookingRow | null>(null);

  const filtered =
    selectedInstructor === "all"
      ? rows
      : selectedInstructor === "unassigned"
        ? rows.filter((b) => !b.session.instructor)
        : rows.filter((b) => b.session.instructor?.id === selectedInstructor);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          Instructor
        </span>
        <Select
          value={selectedInstructor}
          onValueChange={setSelectedInstructor}
        >
          <SelectTrigger className="w-48 rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All instructors</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {instructors.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.name ?? i.email ?? i.id}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {selectedInstructor !== "all" && (
          <span className="text-sm text-muted-foreground">
            {filtered.length} booking{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No bookings match this filter.
        </p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>People</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(b.session.startsAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(b.session.startsAt), "HH:mm")}–
                    {format(new Date(b.session.endsAt), "HH:mm")}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-sm">
                      {b.session.lessonType.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </TableCell>
                  <TableCell>{b.guest.name ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {b.guest.phone ? (
                      <a
                        href={`https://wa.me/${b.guest.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline"
                      >
                        {b.guest.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {b.session.capacity}
                  </TableCell>
                  <TableCell className="text-sm">
                    {b.session.instructor ? (
                      (b.session.instructor.name ??
                      b.session.instructor.email ??
                      "—")
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <LessonBookingStatusBadge status={b.status} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditTarget(b)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editTarget && (
        <LessonBookingEditSheet
          booking={editTarget}
          instructors={instructors}
          open={!!editTarget}
          onOpenChange={(o) => {
            if (!o) setEditTarget(null);
          }}
          onSaved={(updated) => {
            setRows((prev) =>
              prev.map((r) =>
                r.id === editTarget.id ? { ...r, ...updated } : r,
              ),
            );
          }}
        />
      )}
    </div>
  );
}

function LessonBookingStatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    RESERVED: "secondary",
    CONFIRMED: "default",
    COMPLETED: "outline",
    NO_SHOW: "destructive",
    CANCELED: "destructive",
  };
  const labels: Record<string, string> = {
    RESERVED: "Reserved",
    CONFIRMED: "Confirmed",
    COMPLETED: "Completed",
    NO_SHOW: "No Show",
    CANCELED: "Canceled",
  };
  return (
    <Badge variant={variants[status] ?? "secondary"}>
      {labels[status] ?? status}
    </Badge>
  );
}
