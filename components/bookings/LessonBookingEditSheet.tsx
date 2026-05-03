"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { updateLessonBooking, deleteLessonSession } from "@/lib/actions/lessons.actions";
import type { LessonBookingRow } from "./LessonBookingsTable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

const STATUSES = [
  { value: "RESERVED", label: "Reserved" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "NO_SHOW", label: "No Show" },
  { value: "CANCELED", label: "Canceled" },
];

const LESSON_TYPES = [
  { value: "PRIVATE",       label: "Private" },
  { value: "GROUP",         label: "Group" },
  { value: "EXTRA_PRIVATE", label: "Extra Private" },
  { value: "EXTRA_GROUP",   label: "Extra Group" },
  { value: "FOIL",          label: "Foil" },
  { value: "KIDS",          label: "Kids" },
];

const TIME_OPTIONS = Array.from({ length: 25 }, (_, i) => {
  const totalMin = 8 * 60 + i * 30;
  const hh = String(Math.floor(totalMin / 60)).padStart(2, "0");
  const mm = String(totalMin % 60).padStart(2, "0");
  return `${hh}:${mm}`;
});

export function LessonBookingEditSheet({
  booking,
  instructors,
  open,
  onOpenChange,
  onSaved,
  onDeleted,
}: {
  booking: LessonBookingRow;
  instructors: { id: string; name: string | null }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Partial<LessonBookingRow>) => void;
  onDeleted: (id: string) => void;
}) {
  const initialStartsAt = new Date(booking.session.startsAt);
  const initialEndsAt = new Date(booking.session.endsAt);
  const [status, setStatus] = useState(booking.status);
  const [attended, setAttended] = useState(booking.attended ?? false);
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [instructorId, setInstructorId] = useState<string>(
    booking.session.instructor?.id ?? "unassigned",
  );
  const [lessonType, setLessonType] = useState(booking.session.lessonType);
  const [date, setDate] = useState<Date>(initialStartsAt);
  const [time, setTime] = useState(format(initialStartsAt, "HH:mm"));
  const [endTime, setEndTime] = useState(format(initialEndsAt, "HH:mm"));
  const [capacityInput, setCapacityInput] = useState(String(booking.session.capacity));
  const [calOpen, setCalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    const [h, m] = time.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const startsAt = new Date(date);
    startsAt.setHours(h, m, 0, 0);
    const endsAt = new Date(date);
    endsAt.setHours(eh, em, 0, 0);
    const capacity = parseInt(capacityInput, 10) || 1;

    setSaving(true);
    const result = await updateLessonBooking(booking.id, {
      status: status as any,
      attended,
      notes: notes.trim() || null,
      instructorId: instructorId === "unassigned" ? null : instructorId,
      startsAt,
      endsAt,
      lessonType: lessonType as any,
      capacity,
    });
    setSaving(false);
    if (result.success) {
      toast.success("Booking updated");
      const resolvedInstructor =
        instructorId === "unassigned"
          ? null
          : (instructors.find((i) => i.id === instructorId) ?? null);
      onSaved({
        status,
        attended,
        notes: notes.trim() || null,
        session: {
          ...booking.session,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          lessonType,
          capacity,
          instructor: resolvedInstructor,
        },
      });
      onOpenChange(false);
    } else {
      toast.error(result.message ?? "Failed to update booking");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteLessonSession(booking.sessionId);
    setDeleting(false);
    if (result.success) {
      toast.success("Session deleted");
      onDeleted(booking.id);
    } else {
      toast.error(result.message ?? "Failed to delete session");
      setConfirmDelete(false);
    }
  }

  const startsAt = new Date(booking.session.startsAt);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-6 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit Booking</SheetTitle>
          <SheetDescription>
            {booking.guest.name ?? "Guest"} ·{" "}
            {format(startsAt, "d MMM yyyy, HH:mm")} ·{" "}
            <span className="capitalize">
              {booking.session.lessonType.replace(/_/g, " ").toLowerCase()}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 overflow-y-auto">
          {/* Guest info */}
          <div className="rounded-lg border border-input bg-muted/30 px-3 py-2.5 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Guest</p>
            <p className="text-sm font-medium">{booking.guest.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{booking.guest.email}</p>
            {booking.guest.phone && (
              <a
                href={`https://wa.me/${booking.guest.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:underline"
              >
                {booking.guest.phone}
              </a>
            )}
          </div>

          {/* Lesson Type */}
          <div className="flex flex-col gap-2">
            <Label>Lesson Type</Label>
            <Select value={lessonType} onValueChange={setLessonType}>
              <SelectTrigger className="rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {LESSON_TYPES.map((lt) => (
                    <SelectItem key={lt.value} value={lt.value}>
                      {lt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Instructor */}
          <div className="flex flex-col gap-2">
            <Label>Instructor</Label>
            <Select value={instructorId} onValueChange={setInstructorId}>
              <SelectTrigger className="rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {instructors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name ?? i.id}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-2">
            <Label>Date</Label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start font-normal rounded-full"
                >
                  {format(date, "d MMM yyyy")}
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
                  defaultMonth={date}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Start / End time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Start Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>End Time</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger className="rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Capacity */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="capacity">Capacity (people)</Label>
            <input
              id="capacity"
              type="number"
              min={1}
              max={20}
              value={capacityInput}
              onChange={(e) => setCapacityInput(e.target.value)}
              className="w-full rounded-full border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Attended */}
          <div className="flex items-center gap-3">
            <input
              id="attended"
              type="checkbox"
              checked={attended}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAttended(e.target.checked)
              }
              className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
            />
            <Label htmlFor="attended" className="cursor-pointer">
              Guest attended
            </Label>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNotes(e.target.value)
              }
              placeholder="Optional notes…"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
        </div>

        <SheetFooter className="mt-auto flex-col gap-2">
          <div className="flex gap-2 w-full justify-end">
            <SheetClose asChild>
              <Button
                variant="outline"
                disabled={saving}
                className="rounded-full"
              >
                Cancel
              </Button>
            </SheetClose>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>

          {!confirmDelete ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full w-full"
              onClick={() => setConfirmDelete(true)}
              disabled={saving || deleting}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete session
            </Button>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-destructive flex-1">
                Delete this session and all its bookings?
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-full"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Confirm"}
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
