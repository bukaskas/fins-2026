"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { updateLessonBooking } from "@/lib/actions/lessons.actions";
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

export function LessonBookingEditSheet({
  booking,
  instructors,
  open,
  onOpenChange,
  onSaved,
}: {
  booking: LessonBookingRow;
  instructors: { id: string; name: string | null }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Partial<LessonBookingRow>) => void;
}) {
  const initialStartsAt = new Date(booking.session.startsAt);
  const [status, setStatus] = useState(booking.status);
  const [attended, setAttended] = useState(booking.attended ?? false);
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [instructorId, setInstructorId] = useState<string>(
    booking.session.instructor?.id ?? "unassigned",
  );
  const [date, setDate] = useState<Date>(initialStartsAt);
  const [time, setTime] = useState(format(initialStartsAt, "HH:mm"));
  const [calOpen, setCalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const [h, m] = time.split(":").map(Number);
    const startsAt = new Date(date);
    startsAt.setHours(h, m, 0, 0);
    const durationMs =
      new Date(booking.session.endsAt).getTime() -
      new Date(booking.session.startsAt).getTime();
    const endsAt = new Date(startsAt.getTime() + durationMs);

    setSaving(true);
    const result = await updateLessonBooking(booking.id, {
      status: status as any,
      attended,
      notes: notes.trim() || null,
      instructorId: instructorId === "unassigned" ? null : instructorId,
      startsAt,
      endsAt,
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
          instructor: resolvedInstructor,
        },
      });
      onOpenChange(false);
    } else {
      toast.error(result.message ?? "Failed to update booking");
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

          {/* Time */}
          <div className="flex flex-col gap-2">
            <Label>Time</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger className="rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Array.from({ length: 17 }, (_, i) => {
                    const totalMin = 9 * 60 + i * 30;
                    const hh = String(Math.floor(totalMin / 60)).padStart(
                      2,
                      "0",
                    );
                    const mm = String(totalMin % 60).padStart(2, "0");
                    return `${hh}:${mm}`;
                  }).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
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

        <SheetFooter className="mt-auto">
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
