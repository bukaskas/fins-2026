"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { createLessonSessionQuick } from "@/lib/actions/lessons.actions";
import { searchUser } from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const TIME_SLOTS = [
  "09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00",
];

const LESSON_TYPES = [
  { value: "PRIVATE",       label: "Private" },
  { value: "GROUP",         label: "Group" },
  { value: "EXTRA_PRIVATE", label: "Extra Private" },
  { value: "EXTRA_GROUP",   label: "Extra Group" },
  { value: "FOIL",          label: "Foil" },
  { value: "KIDS",          label: "Kids" },
];

type UserResult = { id: string; name: string | null; email: string; phone: string | null };

function replaceTime(base: Date, time: string): Date {
  const d = new Date(base);
  const [h, m] = time.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

export default function CreateSessionSheet({
  instructorId,
  instructorName,
}: {
  instructorId: string;
  instructorName: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState("");
  const [durationHours, setDurationHours] = useState("1");
  const [durationMinutes, setDurationMinutes] = useState("0");
  const [lessonType, setLessonType] = useState("PRIVATE");
  const [notes, setNotes] = useState("");

  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState<UserResult[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<UserResult | null>(null);
  const [searching, setSearching] = useState(false);

  async function handleStudentSearch(q: string) {
    setStudentQuery(q);
    setSelectedStudent(null);
    if (q.length < 2) { setStudentResults([]); return; }
    setSearching(true);
    try {
      const results = await searchUser(q);
      setStudentResults(results as UserResult[]);
    } finally {
      setSearching(false);
    }
  }

  function reset() {
    setDate(new Date());
    setTime("");
    setDurationHours("1");
    setDurationMinutes("0");
    setLessonType("PRIVATE");
    setNotes("");
    setStudentQuery("");
    setStudentResults([]);
    setSelectedStudent(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!time) { toast.error("Please select a time"); return; }
    const totalMinutes = (parseInt(durationHours) || 0) * 60 + (parseInt(durationMinutes) || 0);
    if (totalMinutes <= 0) { toast.error("Duration must be greater than 0"); return; }

    const startsAt = replaceTime(date, time);
    const endsAt = new Date(startsAt.getTime() + totalMinutes * 60 * 1000);

    setSubmitting(true);
    try {
      const result = await createLessonSessionQuick({
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        lessonType,
        instructorId,
        notes: notes || null,
        guestId: selectedStudent?.id ?? null,
      });

      if (result.success) {
        toast.success("Session created");
        setOpen(false);
        reset();
        router.refresh();
      } else {
        toast.error(result.message || "Failed to create session");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1 size-4" />
          Add Session
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Session</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4 px-1">

          {/* Instructor (read-only) */}
          <div className="space-y-1">
            <Label>Instructor</Label>
            <p className="text-sm font-medium">{instructorName ?? "Unnamed"}</p>
          </div>

          {/* Student search */}
          <div className="space-y-1">
            <Label>Student (optional)</Label>
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
                      setStudentQuery(`${u.name || "Unnamed"} – ${u.email}`);
                      setStudentResults([]);
                    }}
                    className="block w-full border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted/40"
                  >
                    <span className="font-medium">{u.name || "Unnamed"}</span>
                    <span className="text-xs text-muted-foreground ml-2">{u.email}</span>
                  </button>
                ))}
              </div>
            )}
            {searching && <p className="text-xs text-muted-foreground">Searching…</p>}
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label>Date *</Label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal" type="button">
                  <CalendarIcon className="mr-2 size-4" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => { if (d) { setDate(d); setCalOpen(false); } }}
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
                    <SelectItem key={t} value={t}>{t}</SelectItem>
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
              <Select value={durationMinutes} onValueChange={setDurationMinutes} disabled={submitting}>
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
            <Select value={lessonType} onValueChange={setLessonType} disabled={submitting}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {LESSON_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
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
            {submitting ? "Creating…" : "Create Session"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
