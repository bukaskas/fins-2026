"use client";

import { useId, useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  GripVertical,
  Pencil,
  Plus,
  Save,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  batchUpdateSessionSchedule,
  createLessonSessionQuick,
  deleteLessonSession,
  getLessonSessionsByDate,
  updateLessonSession,
} from "@/lib/actions/lessons.actions";
import { LessonType } from "@prisma/client";
import { searchUser } from "@/lib/actions/user.actions";
import { toast } from "sonner";

// ---------- types ----------

export type SessionGuest = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
};

export type SessionBooking = {
  id: string;
  guestId: string;
  status: string;
  guest: SessionGuest;
};

export type SessionWithBookings = {
  id: string;
  startsAt: Date | string;
  endsAt: Date | string;
  lessonType: string;
  capacity: number;
  instructorId: string | null;
  notes: string | null;
  instructor: { id: string; name: string | null; email: string } | null;
  bookings: SessionBooking[];
};

type Instructor = { id: string; name: string | null };

// ---------- helpers ----------

const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

function timeFromDate(d: Date | string): string {
  const date = new Date(d);
  return format(date, "HH:mm");
}

function durationMs(s: SessionWithBookings): number {
  return new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime();
}

function replaceTime(original: Date | string, newTime: string): Date {
  const d = new Date(original);
  const [h, m] = newTime.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

const SLOT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

function slotSpan(s: SessionWithBookings): number {
  const dur = durationMs(s);
  return Math.max(1, Math.round(dur / SLOT_DURATION_MS));
}

// ---------- sub-components ----------

function DroppableCell({
  id,
  children,
  isOccupied,
  rowSpan = 1,
}: {
  id: string;
  children: React.ReactNode;
  isOccupied: boolean;
  rowSpan?: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <td
      ref={setNodeRef}
      rowSpan={rowSpan}
      className={cn(
        "border p-1 min-w-35 align-top transition-colors",
        rowSpan === 1 && "h-15",
        isOver && !isOccupied && "bg-primary/10",
        isOver && isOccupied && "bg-destructive/10",
      )}
    >
      {children}
    </td>
  );
}

function SessionCard({
  session,
  isChanged,
  overlay,
  onEditClick,
}: {
  session: SessionWithBookings;
  isChanged: boolean;
  overlay?: boolean;
  onEditClick?: (e: React.MouseEvent) => void;
}) {
  const students = session.bookings
    .map((b) => b.guest.name || b.guest.email)
    .join(", ");

  return (
    <div
      className={cn(
        "rounded-md border px-2 py-1 text-xs select-none h-full",
        "bg-card shadow-sm transition-shadow",
        overlay
          ? "shadow-lg ring-2 ring-primary"
          : "cursor-grab active:cursor-grabbing hover:shadow-md",
        isChanged && !overlay && "ring-2 ring-primary/50",
      )}
    >
      <div className="flex items-center gap-1">
        <GripVertical className="size-3 text-muted-foreground shrink-0" />
        <Badge variant="outline" className="text-[10px] px-1 py-0">
          {session.lessonType}
        </Badge>
        <div className="ml-auto flex items-center gap-0.5">
          {session.bookings.map((b) =>
            b.guest.phone ? (
              <a
                key={b.id}
                href={`https://wa.me/${b.guest.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="p-0.5 rounded opacity-60 hover:opacity-100"
                title={`WhatsApp ${b.guest.name || b.guest.email}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-2.5 fill-green-500"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            ) : null,
          )}
          {onEditClick && (
            <button
              onClick={onEditClick}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-0.5 rounded hover:bg-muted-foreground/20 opacity-60 hover:opacity-100"
            >
              <Pencil className="size-2.5" />
            </button>
          )}
        </div>
      </div>
      <div className="font-medium truncate mt-0.5">
        {students || "No students"}
      </div>
    </div>
  );
}

function DraggableSession({
  session,
  isChanged,
  instructors,
  onUpdated,
  onDeleted,
}: {
  session: SessionWithBookings;
  isChanged: boolean;
  instructors: Instructor[];
  onUpdated: (updated: SessionWithBookings) => void;
  onDeleted: (id: string) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: session.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="h-full"
      {...listeners}
      {...attributes}
    >
      <SessionCard
        session={session}
        isChanged={isChanged}
        onEditClick={(e) => {
          e.stopPropagation();
          setEditOpen(true);
        }}
      />
      <SessionEditSheet
        session={session}
        instructors={instructors}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={(updated) => {
          onUpdated(updated);
          setEditOpen(false);
        }}
        onDeleted={(id) => {
          onDeleted(id);
          setEditOpen(false);
        }}
      />
    </div>
  );
}

// ---------- session edit sheet ----------

function SessionEditSheet({
  session,
  instructors,
  open,
  onOpenChange,
  onSaved,
  onDeleted,
}: {
  session: SessionWithBookings;
  instructors: Instructor[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: SessionWithBookings) => void;
  onDeleted: (id: string) => void;
}) {
  const startsAtDate = new Date(session.startsAt);
  const durMs = new Date(session.endsAt).getTime() - startsAtDate.getTime();
  const durMin = Math.round(durMs / 60000);

  const [lessonType, setLessonType] = useState(session.lessonType);
  const [instructorId, setInstructorId] = useState(
    session.instructorId ?? "unassigned",
  );
  const [date, setDate] = useState<Date>(startsAtDate);
  const [time, setTime] = useState(format(startsAtDate, "HH:mm"));
  const [durationHours, setDurationHours] = useState(
    String(Math.floor(durMin / 60)),
  );
  const [durationMinutes, setDurationMinutes] = useState(String(durMin % 60));
  const [notes, setNotes] = useState(session.notes ?? "");
  const [calOpen, setCalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteLessonSession(session.id);
    setDeleting(false);
    if (result.success) {
      toast.success("Session deleted");
      onDeleted(session.id);
      onOpenChange(false);
    } else {
      toast.error(result.message || "Failed to delete session");
    }
  }

  async function handleSave() {
    const [h, m] = time.split(":").map(Number);
    const startsAt = new Date(date);
    startsAt.setHours(h, m, 0, 0);
    const totalMin =
      (parseInt(durationHours, 10) || 0) * 60 +
      (parseInt(durationMinutes, 10) || 0);
    if (totalMin <= 0) {
      toast.error("Duration must be greater than 0");
      return;
    }
    const endsAt = new Date(startsAt.getTime() + totalMin * 60 * 1000);
    setSaving(true);
    const result = await updateLessonSession(session.id, {
      lessonType: lessonType as LessonType,
      instructorId: instructorId === "unassigned" ? null : instructorId,
      startsAt,
      endsAt,
      notes: notes.trim() || null,
      capacity: session.capacity,
    });
    setSaving(false);
    if (result.success && result.data) {
      toast.success("Session updated");
      onSaved(result.data as SessionWithBookings);
    } else {
      toast.error(result.message || "Failed to update session");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Session</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4 px-1">
          {/* Lesson Type */}
          <div className="space-y-1">
            <Label>Lesson Type</Label>
            <Select
              value={lessonType}
              onValueChange={setLessonType}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {LESSON_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Instructor */}
          <div className="space-y-1">
            <Label>Instructor</Label>
            <Select
              value={instructorId}
              onValueChange={setInstructorId}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {instructors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name ?? "Unknown"}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label>Date</Label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start font-normal"
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) {
                      setDate(d);
                      setCalOpen(false);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div className="space-y-1">
            <Label>Time</Label>
            <Select value={time} onValueChange={setTime} disabled={saving}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {TIME_SLOTS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Hours</Label>
              <Input
                type="number"
                min="0"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-1">
              <Label>Minutes</Label>
              <Select
                value={durationMinutes}
                onValueChange={setDurationMinutes}
                disabled={saving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">00</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="45">45</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              disabled={saving}
            />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={saving || deleting}>
            {saving ? "Saving..." : "Save"}
          </Button>

          <div className="pt-2 border-t">
            {!confirmDelete ? (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setConfirmDelete(true)}
                disabled={saving || deleting}
              >
                <Trash2 className="size-4 mr-2" />
                Delete session
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-center text-muted-foreground">
                  This will permanently delete the session and all its bookings.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Confirm delete"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------- list view (mobile) ----------

function ListView({
  sessions,
  instructors,
}: {
  sessions: SessionWithBookings[];
  instructors: Instructor[];
}) {
  const instructorMap = useMemo(() => {
    const m = new Map<string, string>();
    instructors.forEach((i) => m.set(i.id, i.name || "Unknown"));
    return m;
  }, [instructors]);

  const sorted = useMemo(
    () =>
      [...sessions].sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ),
    [sessions],
  );

  if (sorted.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        No sessions for this date.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((s) => {
        const students = s.bookings
          .map((b) => b.guest.name || b.guest.email)
          .join(", ");
        return (
          <div
            key={s.id}
            className="rounded-md border p-3 bg-card text-sm flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{students || "No students"}</p>
              <p className="text-muted-foreground text-xs">
                {timeFromDate(s.startsAt)} &middot; {s.lessonType}
              </p>
            </div>
            <Badge variant="outline">
              {s.instructorId
                ? (instructorMap.get(s.instructorId) ?? "Unknown")
                : "Unassigned"}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

// ---------- create session sheet ----------

const LESSON_TYPES: { value: string; label: string }[] = [
  { value: "PRIVATE", label: "Private" },
  { value: "GROUP", label: "Group" },
  { value: "EXTRA_PRIVATE", label: "Extra Private" },
  { value: "EXTRA_GROUP", label: "Extra Group" },
  { value: "FOIL", label: "Foil" },
  { value: "KIDS", label: "Kids" },
];

function CreateSessionSheet({
  defaultDate,
  instructors,
  onCreated,
}: {
  defaultDate: Date;
  instructors: Instructor[];
  onCreated: (session: SessionWithBookings) => void;
}) {
  const [open, setOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState<Date>(defaultDate);
  const [time, setTime] = useState("");
  const [durationHours, setDurationHours] = useState("1");
  const [durationMinutes, setDurationMinutes] = useState("0");
  const [lessonType, setLessonType] = useState("PRIVATE");
  const [instructorId, setInstructorId] = useState("");
  const [notes, setNotes] = useState("");

  // student search
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState<SessionGuest[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<SessionGuest | null>(
    null,
  );
  const [searching, setSearching] = useState(false);

  const handleOpen = (v: boolean) => {
    if (v) setDate(defaultDate);
    setOpen(v);
  };

  const handleStudentSearch = useCallback(async (q: string) => {
    setStudentQuery(q);
    setSelectedStudent(null);
    if (q.trim().length < 2) {
      setStudentResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchUser(q);
      setStudentResults(
        results.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
        })),
      );
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!time || !date) {
      toast.error("Please select a date and time.");
      return;
    }

    const totalMinutes =
      (parseInt(durationHours, 10) || 0) * 60 +
      (parseInt(durationMinutes, 10) || 0);
    if (totalMinutes <= 0) {
      toast.error("Duration must be greater than 0.");
      return;
    }

    const startsAt = replaceTime(date, time);
    const endsAt = new Date(startsAt.getTime() + totalMinutes * 60 * 1000);

    setSubmitting(true);
    try {
      const result = await createLessonSessionQuick({
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        lessonType,
        instructorId: instructorId || null,
        notes: notes || null,
        guestId: selectedStudent?.id ?? null,
      });

      if (result.success && result.data) {
        toast.success("Session created");
        onCreated(result.data as SessionWithBookings);
        setOpen(false);
        // reset form
        setTime("");
        setDurationHours("1");
        setDurationMinutes("0");
        setLessonType("PRIVATE");
        setInstructorId("");
        setNotes("");
        setStudentQuery("");
        setSelectedStudent(null);
        setStudentResults([]);
      } else {
        toast.error(result.message || "Failed to create session.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1 size-4" />
          New Session
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Lesson Session</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4 px-1">
          {/* Student search */}
          <div className="space-y-1">
            <Label>Student</Label>
            <Input
              value={studentQuery}
              onChange={(e) => handleStudentSearch(e.target.value)}
              placeholder="Search by name, email, or phone"
              disabled={submitting}
            />
            {selectedStudent && (
              <p className="text-xs text-primary">
                Selected: {selectedStudent.name || selectedStudent.email}
              </p>
            )}
            {!selectedStudent && studentResults.length > 0 && (
              <div className="max-h-40 overflow-auto rounded border text-sm">
                {studentResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedStudent(u);
                      setStudentQuery(`${u.name || "Unnamed"} - ${u.email}`);
                      setStudentResults([]);
                    }}
                    className="block w-full border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted/40"
                  >
                    <span className="font-medium">{u.name || "Unnamed"}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {u.email}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {searching && (
              <p className="text-xs text-muted-foreground">Searching...</p>
            )}
          </div>

          {/* Instructor */}
          <div className="space-y-1">
            <Label>Instructor</Label>
            <Select
              value={instructorId}
              onValueChange={setInstructorId}
              disabled={submitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select instructor" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {instructors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name ?? "Unknown"}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label>Date *</Label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start font-normal"
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) {
                      setDate(d);
                      setCalOpen(false);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div className="space-y-1">
            <Label>Time *</Label>
            <Select value={time} onValueChange={setTime} disabled={submitting}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {TIME_SLOTS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Hours</Label>
              <Input
                type="number"
                min="0"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-1">
              <Label>Minutes</Label>
              <Select
                value={durationMinutes}
                onValueChange={setDurationMinutes}
                disabled={submitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">00</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="45">45</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lesson Type */}
          <div className="space-y-1">
            <Label>Lesson Type</Label>
            <Select
              value={lessonType}
              onValueChange={setLessonType}
              disabled={submitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {LESSON_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              disabled={submitting}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating..." : "Create Session"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ---------- main component ----------

export default function ScheduleBoard({
  instructors,
  initialSessions,
  initialDate,
}: {
  instructors: Instructor[];
  initialSessions: SessionWithBookings[];
  initialDate: string; // YYYY-MM-DD
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(initialDate + "T00:00:00"),
  );
  const [sessions, setSessions] =
    useState<SessionWithBookings[]>(initialSessions);
  const [originalMap, setOriginalMap] = useState<
    Map<string, { startsAt: string; instructorId: string | null }>
  >(() => {
    const m = new Map();
    initialSessions.forEach((s) =>
      m.set(s.id, {
        startsAt: new Date(s.startsAt).toISOString(),
        instructorId: s.instructorId,
      }),
    );
    return m;
  });
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSessionCreated = useCallback((session: SessionWithBookings) => {
    setSessions((prev) => [...prev, session]);
    setOriginalMap((prev) => {
      const next = new Map(prev);
      next.set(session.id, {
        startsAt: new Date(session.startsAt).toISOString(),
        instructorId: session.instructorId,
      });
      return next;
    });
  }, []);

  const handleSessionUpdated = useCallback((updated: SessionWithBookings) => {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setOriginalMap((prev) => {
      const next = new Map(prev);
      next.set(updated.id, {
        startsAt: new Date(updated.startsAt).toISOString(),
        instructorId: updated.instructorId,
      });
      return next;
    });
  }, []);

  const handleSessionDeleted = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setOriginalMap((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // filter sessions for selected date
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const daySessions = useMemo(
    () =>
      sessions.filter(
        (s) => format(new Date(s.startsAt), "yyyy-MM-dd") === dateKey,
      ),
    [sessions, dateKey],
  );

  // build grid lookup: cellId -> session, plus cells covered by row spans
  const { cellMap, coveredCells } = useMemo(() => {
    const m = new Map<string, SessionWithBookings>();
    const covered = new Set<string>();
    daySessions.forEach((s) => {
      if (s.instructorId) {
        const t = timeFromDate(s.startsAt);
        m.set(`${s.instructorId}::${t}`, s);
        const span = slotSpan(s);
        const startIdx = TIME_SLOTS.indexOf(t);
        if (startIdx !== -1) {
          for (let i = 1; i < span && startIdx + i < TIME_SLOTS.length; i++) {
            covered.add(`${s.instructorId}::${TIME_SLOTS[startIdx + i]}`);
          }
        }
      }
    });
    return { cellMap: m, coveredCells: covered };
  }, [daySessions]);

  // unassigned sessions (no instructor)
  const unassigned = useMemo(
    () => daySessions.filter((s) => !s.instructorId),
    [daySessions],
  );

  // changed sessions
  const changedIds = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      const orig = originalMap.get(s.id);
      if (
        orig &&
        (orig.startsAt !== new Date(s.startsAt).toISOString() ||
          orig.instructorId !== s.instructorId)
      ) {
        set.add(s.id);
      }
    });
    return set;
  }, [sessions, originalMap]);

  const activeSession = useMemo(
    () => (activeId ? (sessions.find((s) => s.id === activeId) ?? null) : null),
    [activeId, sessions],
  );

  // --- handlers ---

  const handleDateChange = useCallback(async (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setLoading(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const result = await getLessonSessionsByDate(dateStr);
      setSessions((prev) => {
        const otherDates = prev.filter(
          (s) => format(new Date(s.startsAt), "yyyy-MM-dd") !== dateStr,
        );
        return [...otherDates, ...result];
      });
      setOriginalMap((prev) => {
        const next = new Map(prev);
        result.forEach((s: SessionWithBookings) => {
          if (!next.has(s.id)) {
            next.set(s.id, {
              startsAt: new Date(s.startsAt).toISOString(),
              instructorId: s.instructorId,
            });
          }
        });
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = e;
      if (!over) return;

      const sessionId = active.id as string;
      const cellId = over.id as string;

      const parts = cellId.split("::");
      if (parts.length !== 2) return;
      const [targetInstructorId, targetTime] = parts;

      // check for conflict
      const existing = cellMap.get(cellId);
      if (existing && existing.id !== sessionId) {
        const studentNames = existing.bookings
          .map((b) => b.guest.name || b.guest.email)
          .join(", ");
        toast.error("Slot already occupied", {
          description: `${studentNames || "A session"} is already booked at ${targetTime}`,
        });
        return;
      }

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          const dur = durationMs(s);
          const newStartsAt = replaceTime(s.startsAt, targetTime);
          const newEndsAt = new Date(newStartsAt.getTime() + dur);
          return {
            ...s,
            startsAt: newStartsAt,
            endsAt: newEndsAt,
            instructorId: targetInstructorId,
          };
        }),
      );
    },
    [cellMap],
  );

  const handleSave = useCallback(async () => {
    const updates = sessions
      .filter((s) => changedIds.has(s.id))
      .map((s) => ({
        id: s.id,
        startsAt: new Date(s.startsAt).toISOString(),
        endsAt: new Date(s.endsAt).toISOString(),
        instructorId: s.instructorId,
      }));

    if (updates.length === 0) {
      toast.info("No changes to save.");
      return;
    }

    setSaving(true);
    const result = await batchUpdateSessionSchedule(updates);
    setSaving(false);

    if (result.success) {
      toast.success(`Saved ${updates.length} change(s).`);
      setOriginalMap((prev) => {
        const next = new Map(prev);
        updates.forEach((u) =>
          next.set(u.id, {
            startsAt: u.startsAt,
            instructorId: u.instructorId,
          }),
        );
        return next;
      });
    } else {
      toast.error(result.message);
    }
  }, [sessions, changedIds]);

  const handleReset = useCallback(() => {
    setSessions((prev) =>
      prev.map((s) => {
        const orig = originalMap.get(s.id);
        if (!orig) return s;
        const dur = durationMs(s);
        const newEndsAt = new Date(new Date(orig.startsAt).getTime() + dur);
        return {
          ...s,
          startsAt: new Date(orig.startsAt),
          endsAt: newEndsAt,
          instructorId: orig.instructorId,
        };
      }),
    );
  }, [originalMap]);

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-50 justify-start">
              <CalendarIcon className="mr-2 size-4" />
              {format(selectedDate, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
            />
          </PopoverContent>
        </Popover>

        <CreateSessionSheet
          defaultDate={selectedDate}
          instructors={instructors}
          onCreated={handleSessionCreated}
        />

        <div className="flex items-center gap-2 ml-auto">
          {changedIds.size > 0 && (
            <Badge variant="secondary">{changedIds.size} unsaved</Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={changedIds.size === 0}
          >
            <Undo2 className="mr-1 size-4" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={changedIds.size === 0 || saving}
          >
            <Save className="mr-1 size-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading sessions...</p>
      )}

      {/* desktop grid */}
      <div className="hidden md:block overflow-x-auto">
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <table className="border-collapse text-sm w-full">
            <thead>
              <tr>
                <th className="border p-2 bg-muted text-left sticky left-0 z-10 min-w-17.5">
                  Time
                </th>
                {instructors.map((inst) => (
                  <th key={inst.id} className="border p-2 bg-muted text-center">
                    {inst.name || "Unknown"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot) => (
                <tr key={slot}>
                  <td className="border p-2 font-mono text-xs bg-muted/50 sticky left-0 z-10">
                    {slot}
                  </td>
                  {instructors.map((inst) => {
                    const cellId = `${inst.id}::${slot}`;
                    if (coveredCells.has(cellId)) return null;
                    const session = cellMap.get(cellId);
                    const span = session ? slotSpan(session) : 1;
                    return (
                      <DroppableCell
                        key={cellId}
                        id={cellId}
                        isOccupied={!!session}
                        rowSpan={span}
                      >
                        {session && (
                          <DraggableSession
                            session={session}
                            isChanged={changedIds.has(session.id)}
                            instructors={instructors}
                            onUpdated={handleSessionUpdated}
                            onDeleted={handleSessionDeleted}
                          />
                        )}
                      </DroppableCell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <DragOverlay>
            {activeSession && (
              <SessionCard session={activeSession} isChanged={false} overlay />
            )}
          </DragOverlay>
        </DndContext>

        {/* unassigned sessions */}
        {unassigned.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">
              Unassigned ({unassigned.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {unassigned.map((s) => {
                const students = s.bookings
                  .map((b) => b.guest.name || b.guest.email)
                  .join(", ");
                return (
                  <div
                    key={s.id}
                    className="rounded-md border px-3 py-2 text-xs bg-muted"
                  >
                    <span className="font-medium">
                      {students || "No students"}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {s.lessonType} &middot; {timeFromDate(s.startsAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* mobile list view */}
      <div className="md:hidden">
        <ListView sessions={daySessions} instructors={instructors} />
      </div>
    </div>
  );
}
