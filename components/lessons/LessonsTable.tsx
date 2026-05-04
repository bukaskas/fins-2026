"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LessonSessionEditSheet,
  type SessionRow,
} from "./LessonSessionEditSheet";

function formatDuration(start: string, end: string) {
  const mins = Math.max(
    0,
    Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) / 60000,
    ),
  );
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function LessonsTable({
  lessons,
  instructors,
}: {
  lessons: SessionRow[];
  instructors: { id: string; name: string | null }[];
}) {
  const [rows, setRows] = useState<SessionRow[]>(lessons);
  const [editTarget, setEditTarget] = useState<SessionRow | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Start</th>
              <th className="px-3 py-2 text-left">Duration</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Instructor</th>
              <th className="px-3 py-2 text-left">Student(s)</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No lessons found.
                </td>
              </tr>
            ) : (
              rows.map((lesson) => (
                <tr key={lesson.id} className="border-b">
                  <td className="px-3 py-2">
                    {new Date(lesson.startsAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    {formatDuration(lesson.startsAt, lesson.endsAt)}
                  </td>
                  <td className="px-3 py-2">{lesson.lessonType}</td>
                  <td className="px-3 py-2">
                    {lesson.instructor?.name ||
                      lesson.instructor?.email ||
                      "—"}
                  </td>
                  <td className="px-3 py-2">
                    {lesson.bookings.length === 0
                      ? "—"
                      : lesson.bookings
                          .map((b) => b.guest.name || b.guest.email)
                          .join(", ")}
                  </td>
                  <td className="px-3 py-2">
                    {lesson.bookings[0]?.status ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditTarget(lesson)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
