"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Student = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
};

export default function StudentSearchField({
  students,
  initialStudentId,
  onSelect,
}: {
  students: Student[];
  initialStudentId?: string;
  onSelect?: (studentId: string) => void;
}) {
  const initial = students.find((s) => s.id === initialStudentId) ?? null;
  const [query, setQuery] = useState(
    initial ? `${initial.name || ""} ${initial.email}`.trim() : "",
  );
  const [selectedId, setSelectedId] = useState(initial?.id ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fire onSelect once for any initial selection so parent can fetch balance.
  useEffect(() => {
    if (initial && onSelect) onSelect(initial.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students.slice(0, 8);
    return students
      .filter((s) =>
        `${s.name ?? ""} ${s.email} ${s.phone ?? ""}`.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [students, query]);

  function select(u: Student) {
    setSelectedId(u.id);
    setQuery(`${u.name || "Unnamed"} · ${u.email}${u.phone ? ` · ${u.phone}` : ""}`);
    setOpen(false);
    onSelect?.(u.id);
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl px-4 py-3 transition-shadow focus-within:shadow-sm"
      style={{
        background: "#f8fbff",
        border: "1px solid rgba(186, 230, 253, 0.6)",
      }}
    >
      <p
        className="text-[0.55rem] tracking-[0.22em] uppercase font-[700] mb-1.5"
        style={{ color: "#94a3b8", fontFamily: "var(--font-raleway)" }}
      >
        Student
      </p>

      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (selectedId) {
            setSelectedId("");
            onSelect?.("");
          }
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search by name, phone, or email…"
        className="w-full bg-transparent text-[0.92rem] font-[300] focus:outline-none placeholder:text-[#cbd5e1]"
        style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
      />

      {/* Hidden real input for form submission */}
      <input type="hidden" name="studentId" value={selectedId} required />

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 overflow-hidden rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.97)",
            boxShadow: "0 8px 32px rgba(14, 165, 233, 0.12), 0 2px 8px rgba(0,0,0,0.08)",
            border: "1px solid rgba(186, 230, 253, 0.5)",
          }}
        >
          {filtered.map((u, i) => (
            <button
              key={u.id}
              type="button"
              onMouseDown={() => select(u)}
              className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors hover:bg-[#f0f9ff] group"
              style={{
                borderTop: i > 0 ? "1px solid rgba(186, 230, 253, 0.3)" : undefined,
              }}
            >
              {/* Avatar initial */}
              <span
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[0.65rem] font-[700] transition-colors"
                style={{
                  background: "rgba(14, 165, 233, 0.1)",
                  color: "#0ea5e9",
                  fontFamily: "var(--font-raleway)",
                }}
              >
                {(u.name || u.email).charAt(0).toUpperCase()}
              </span>

              <div className="min-w-0">
                <div
                  className="text-[0.85rem] font-[500] truncate"
                  style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
                >
                  {u.name || "Unnamed"}
                </div>
                <div
                  className="text-[0.7rem] truncate"
                  style={{ color: "#94a3b8", fontFamily: "var(--font-raleway)" }}
                >
                  {u.email}
                  {u.phone ? <span className="ml-2">· {u.phone}</span> : null}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
