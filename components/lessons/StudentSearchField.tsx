"use client";

import { useMemo, useState } from "react";

type Student = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
};

export default function StudentSearchField({
  students,
  initialStudentId,
}: {
  students: Student[];
  initialStudentId?: string;
}) {
  const initial = students.find((s) => s.id === initialStudentId) ?? null;
  const [query, setQuery] = useState(
    initial ? `${initial.name || ""} ${initial.email}`.trim() : "",
  );
  const [selectedId, setSelectedId] = useState(initial?.id ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students.slice(0, 20);
    return students
      .filter((s) =>
        `${s.name ?? ""} ${s.email} ${s.phone ?? ""}`.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [students, query]);

  return (
    <div className="relative">
      <label className="mb-1 block text-sm">Student</label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedId("");
        }}
        placeholder="Search by name, phone, or email"
        className="w-full rounded border px-3 py-2"
      />

      <input type="hidden" name="studentId" value={selectedId} required />

      <div className="mt-2 max-h-56 overflow-auto rounded border">
        {filtered.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => {
              setSelectedId(u.id);
              setQuery(
                `${u.name || "Unnamed"} • ${u.email}${u.phone ? ` • ${u.phone}` : ""}`,
              );
            }}
            className="block w-full border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted/40"
          >
            <div className="font-medium">{u.name || "Unnamed"}</div>
            <div className="text-xs text-muted-foreground">
              {u.email} {u.phone ? `• ${u.phone}` : ""}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
