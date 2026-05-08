"use client";

import React, { useMemo, useRef, useState } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { CalendarDays, MoreHorizontal, Pencil, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateLessonBookingStatus } from "@/lib/actions/lessons.actions";
import {
  LessonSessionEditSheet,
  type SessionRow,
} from "./LessonSessionEditSheet";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={className}
      aria-label="WhatsApp"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function formatDuration(start: string, end: string) {
  const mins = Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000),
  );
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const STATUS_LABELS: Record<string, string> = {
  RESERVED: "Reserved",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  NO_SHOW: "No Show",
  CANCELED: "Canceled",
};

const STATUS_COLOR: Record<string, string> = {
  RESERVED:  "#f59e0b",
  CONFIRMED: "#22c55e",
  COMPLETED: "#6366f1",
  NO_SHOW:   "#ef4444",
  CANCELED:  "#9ca3af",
};

const ALL_STATUSES = ["RESERVED", "CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELED"];

const DATE_RANGES = [
  { value: "today",    label: "Today" },
  { value: "week",     label: "This week" },
  { value: "upcoming", label: "Upcoming" },
  { value: "all",      label: "All" },
] as const;

type DateRange = (typeof DATE_RANGES)[number]["value"];

function copyLessonDetails(lesson: SessionRow) {
  const date = format(new Date(lesson.startsAt), "dd/MM/yyyy");
  const timeStart = format(new Date(lesson.startsAt), "HH:mm");
  const timeEnd = format(new Date(lesson.endsAt), "HH:mm");
  const type = lesson.lessonType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const duration = formatDuration(lesson.startsAt, lesson.endsAt);
  const instructor =
    lesson.instructor?.name ?? lesson.instructor?.email ?? "Unassigned";
  const students = lesson.bookings.length
    ? lesson.bookings.map((b) => b.guest.name ?? b.guest.email).join(", ")
    : "—";
  const phone = lesson.bookings[0]?.guest.phone ?? "—";
  const status =
    STATUS_LABELS[lesson.bookings[0]?.status ?? ""] ??
    lesson.bookings[0]?.status ??
    "—";

  const lines = [
    `Date: ${date}`,
    `Time: ${timeStart}–${timeEnd}`,
    `Type: ${type}`,
    `Duration: ${duration}`,
    `Instructor: ${instructor}`,
    `Student(s): ${students}`,
    `Phone: ${phone}`,
    `Status: ${status}`,
  ];
  navigator.clipboard.writeText(lines.join("\n"));
  toast.success("Booking details copied!");
}

function StatusDropdown({
  bookingId,
  initialStatus,
}: {
  bookingId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [pending, setPending] = useState(false);
  const color = STATUS_COLOR[status] ?? "#9ca3af";

  async function handleSelect(next: string) {
    const prev = status;
    setStatus(next);
    setPending(true);
    const result = await updateLessonBookingStatus(bookingId, next as never);
    setPending(false);
    if (!result.success) {
      setStatus(prev);
      toast.error("Failed to update status");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={pending}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-opacity disabled:opacity-40 hover:opacity-75"
          style={{ borderColor: `${color}40`, background: `${color}12` }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
          <span
            className="text-[0.6rem] tracking-[0.1em] uppercase font-[700]"
            style={{ color }}
          >
            {STATUS_LABELS[status] ?? status}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {ALL_STATUSES.map((s) => (
          <DropdownMenuItem
            key={s}
            onSelect={() => handleSelect(s)}
            className="flex items-center gap-2"
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: STATUS_COLOR[s] }}
            />
            <span className="text-[0.72rem]">{STATUS_LABELS[s]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function groupByInstructor(rows: SessionRow[]) {
  const map = new Map<string, { label: string; lessons: SessionRow[] }>();
  for (const lesson of rows) {
    const key = lesson.instructor?.id ?? "__unassigned__";
    const label =
      lesson.instructor?.name ?? lesson.instructor?.email ?? "Unassigned";
    if (!map.has(key)) map.set(key, { label, lessons: [] });
    map.get(key)!.lessons.push(lesson);
  }
  return [...map.entries()].sort(([a], [b]) => {
    if (a === "__unassigned__") return 1;
    if (b === "__unassigned__") return -1;
    return map.get(a)!.label.localeCompare(map.get(b)!.label);
  });
}

const selectClass =
  "border border-[#ece8e3] bg-white rounded-full px-3 py-1.5 text-[0.72rem] font-[500] text-[#5a5450] tracking-[0.04em] focus:outline-none focus:border-[#1a1614] transition-colors appearance-none cursor-pointer";

export function LessonsTable({
  lessons,
  instructors,
}: {
  lessons: SessionRow[];
  instructors: { id: string; name: string | null }[];
}) {
  const [rows, setRows] = useState<SessionRow[]>(lessons);
  const [editTarget, setEditTarget] = useState<SessionRow | null>(null);

  // ── Filter state ─────────────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState<DateRange>("upcoming");
  const [instructorId, setInstructorId] = useState("all");
  const [studentQuery, setStudentQuery] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Apply filters ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const today = startOfDay(new Date());
    const weekEnd = addDays(today, 7);

    return rows.filter((lesson) => {
      const lessonDate = startOfDay(new Date(lesson.startsAt));

      // Date range
      if (dateRange === "today" && lessonDate.getTime() !== today.getTime()) return false;
      if (dateRange === "week" && (lessonDate < today || lessonDate > weekEnd)) return false;
      if (dateRange === "upcoming" && lessonDate < today) return false;

      // Instructor
      if (instructorId !== "all") {
        if (instructorId === "__unassigned__" && lesson.instructor) return false;
        if (instructorId !== "__unassigned__" && lesson.instructor?.id !== instructorId) return false;
      }

      // Student search
      if (studentQuery.trim()) {
        const q = studentQuery.toLowerCase();
        const match = lesson.bookings.some(
          (b) =>
            (b.guest.name ?? "").toLowerCase().includes(q) ||
            b.guest.email.toLowerCase().includes(q),
        );
        if (!match) return false;
      }

      return true;
    });
  }, [rows, dateRange, instructorId, studentQuery]);

  const groups = groupByInstructor(filtered);

  const isFiltered =
    dateRange !== "upcoming" || instructorId !== "all" || studentQuery !== "";

  function clearFilters() {
    setDateRange("upcoming");
    setInstructorId("all");
    setStudentQuery("");
  }

  return (
    <>
      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="mb-4 p-4 bg-white border border-[#ece8e3] rounded-xl space-y-3">
        {/* Row 1: student search + instructor + count + clear */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#b0a89f] pointer-events-none" />
            <input
              type="text"
              placeholder="Student name or email…"
              defaultValue={studentQuery}
              onChange={(e) => {
                clearTimeout(searchTimerRef.current);
                const val = e.target.value;
                searchTimerRef.current = setTimeout(() => setStudentQuery(val), 250);
              }}
              className="pl-8 pr-3 py-1.5 border border-[#ece8e3] bg-white rounded-full w-56 text-[0.82rem] text-[#1a1614] placeholder:text-[#b0a89f] focus:outline-none focus:border-[#1a1614] transition-colors"
            />
          </div>

          <select
            value={instructorId}
            onChange={(e) => setInstructorId(e.target.value)}
            className={selectClass}
          >
            <option value="all">All instructors</option>
            <option value="__unassigned__">Unassigned</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name ?? i.id}
              </option>
            ))}
          </select>

          {isFiltered && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-[0.65rem] font-[600] tracking-[0.08em] text-[#8a8480] hover:text-[#1a1614] transition-colors ml-1"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}

          <span className="ml-auto text-[0.68rem] tracking-[0.08em] text-[#8a8480]">
            {filtered.length} lesson{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Row 2: date range pill group */}
        <div className="flex items-center gap-1 border border-[#ece8e3] rounded-full p-0.5 bg-white w-fit">
          <CalendarDays className="h-3 w-3 text-[#b0a89f] ml-2 shrink-0" />
          {DATE_RANGES.map((o) => {
            const active = dateRange === o.value;
            return (
              <button
                key={o.value}
                onClick={() => setDateRange(o.value)}
                className={`px-3 py-1 rounded-full text-[0.65rem] font-[600] tracking-[0.06em] transition-colors ${
                  active
                    ? "bg-[#1a1614] text-white"
                    : "text-[#8a8480] hover:text-[#1a1614]"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Student(s)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No lessons match your filters.
                </TableCell>
              </TableRow>
            ) : (
              groups.map(([key, { label, lessons: group }]) => (
                <React.Fragment key={key}>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableCell
                      colSpan={6}
                      className="py-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {label}
                      <span className="ml-2 font-normal normal-case tracking-normal">
                        ({group.length})
                      </span>
                    </TableCell>
                  </TableRow>
                  {group.map((lesson) => {
                    const firstBooking = lesson.bookings[0];
                    const phone = firstBooking?.guest.phone;
                    const waPhone = phone?.replace(/\D/g, "");

                    return (
                      <TableRow key={lesson.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(lesson.startsAt), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(lesson.startsAt), "HH:mm")}–
                          {format(new Date(lesson.endsAt), "HH:mm")}
                        </TableCell>
                        <TableCell>
                          <span className="capitalize text-sm">
                            {lesson.lessonType.replace(/_/g, " ").toLowerCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {lesson.bookings.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {lesson.bookings.map((b) => (
                                <DropdownMenu key={b.id}>
                                  <DropdownMenuTrigger asChild>
                                    <button className="text-sm hover:underline underline-offset-2 text-left">
                                      {b.guest.name ?? b.guest.email}
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="w-44">
                                    <DropdownMenuItem asChild>
                                      <a href={`/users/edit/${b.guest.id}`} className="flex items-center gap-2">
                                        <Pencil className="h-3.5 w-3.5" />
                                        Edit user
                                      </a>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {firstBooking ? (
                            <StatusDropdown
                              bookingId={firstBooking.id}
                              initialStatus={firstBooking.status}
                            />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              {waPhone && (
                                <>
                                  <DropdownMenuItem asChild>
                                    <a
                                      href={`https://wa.me/${waPhone}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2"
                                    >
                                      <WhatsAppIcon className="h-3.5 w-3.5 text-green-500" />
                                      Open WhatsApp
                                    </a>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                onSelect={() => copyLessonDetails(lesson)}
                              >
                                Copy booking details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => setEditTarget(lesson)}
                                className="flex items-center gap-2"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editTarget && (
        <LessonSessionEditSheet
          session={editTarget}
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
          onDeleted={(id) => {
            setRows((prev) => prev.filter((r) => r.id !== id));
            setEditTarget(null);
          }}
        />
      )}
    </>
  );
}
