"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  updateLessonSession,
  deleteLessonSession,
  addGuestToSession,
} from "@/lib/actions/lessons.actions";
import { searchUser } from "@/lib/actions/user.actions";
import { LESSON_TYPE_SKU } from "@/lib/lesson-products";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CommissionStatus, CommissionType, LessonType } from "@prisma/client";
import { CommissionCard, type CommissionCardData } from "@/components/commission/CommissionCard";

export type EditSheetServiceProduct = {
  id: string;
  sku: string;
  name: string;
  priceCents: number;
};

const apple = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif";

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

export type SessionRow = {
  id: string;
  startsAt: string;
  endsAt: string;
  lessonType: string;
  capacity: number;
  notes: string | null;
  instructor: { id: string; name: string | null; email?: string | null } | null;
  bookings: { id: string; status: string; guest: { id: string; name: string | null; email: string; phone: string | null } }[];
  commission?: {
    id: string;
    commissionType: CommissionType;
    durationMinutes: number;
    rateAtCreationCents: number;
    calculatedAmountCents: number;
    overrideAmountCents: number | null;
    finalAmountCents: number;
    status: CommissionStatus;
  } | null;
};

/* ─── Shared style helpers ─────────────────────────────────── */
const labelStyle: React.CSSProperties = {
  fontFamily: apple,
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "#6e6e73",
  display: "block",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  fontFamily: apple,
  width: "100%",
  background: "#f5f5f7",
  color: "#1d1d1f",
  fontSize: "15px",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  outline: "none",
  transition: "box-shadow 0.15s",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  paddingRight: "36px",
  cursor: "pointer",
};

function AppleSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{ ...selectStyle, opacity: disabled ? 0.5 : 1 }}
        onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,113,227,0.3)"; }}
        onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <svg
        width="10" height="6" viewBox="0 0 10 6" fill="none"
        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
      >
        <path d="M1 1L5 5L9 1" stroke="#6e6e73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────── */
export function LessonSessionEditSheet({
  session,
  instructors,
  serviceProducts,
  open,
  onOpenChange,
  onSaved,
  onDeleted,
}: {
  session: SessionRow;
  instructors: { id: string; name: string | null }[];
  serviceProducts: EditSheetServiceProduct[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Partial<SessionRow>) => void;
  onDeleted: (id: string) => void;
}) {
  const initialStartsAt = new Date(session.startsAt);
  const initialEndsAt = new Date(session.endsAt);

  const [instructorId, setInstructorId] = useState(session.instructor?.id ?? "unassigned");
  const [lessonType, setLessonType]     = useState(session.lessonType);
  const [date, setDate]                 = useState<Date>(initialStartsAt);
  const [time, setTime]                 = useState(format(initialStartsAt, "HH:mm"));
  const [endTime, setEndTime]           = useState(format(initialEndsAt, "HH:mm"));
  const [capacityInput, setCapacityInput] = useState(String(session.capacity));
  const [notes, setNotes]               = useState(session.notes ?? "");
  const [calOpen, setCalOpen]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]         = useState(false);

  async function handleSave() {
    const [h, m]   = time.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const startsAt = new Date(date); startsAt.setHours(h, m, 0, 0);
    const endsAt   = new Date(date); endsAt.setHours(eh, em, 0, 0);
    const capacity = parseInt(capacityInput, 10) || 1;

    setSaving(true);
    const result = await updateLessonSession(session.id, {
      lessonType: lessonType as any,
      instructorId: instructorId === "unassigned" ? null : instructorId,
      startsAt,
      endsAt,
      notes: notes.trim() || null,
      capacity,
    });
    setSaving(false);

    if (result.success) {
      toast.success("Session updated");
      const resolvedInstructor =
        instructorId === "unassigned"
          ? null
          : (instructors.find((i) => i.id === instructorId) ?? null);
      onSaved({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), lessonType, capacity, notes: notes.trim() || null, instructor: resolvedInstructor });
      onOpenChange(false);
    } else {
      toast.error(result.message ?? "Failed to update session");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteLessonSession(session.id);
    setDeleting(false);
    if (result.success) {
      toast.success("Session deleted");
      onDeleted(session.id);
    } else {
      toast.error(result.message ?? "Failed to delete session");
      setConfirmDelete(false);
    }
  }

  const studentNames = session.bookings.map((b) => b.guest.name ?? b.guest.email).join(", ");
  const instructorOptions = [
    { value: "unassigned", label: "Unassigned" },
    ...instructors.map((i) => ({ value: i.id, label: i.name ?? i.id })),
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        style={{ fontFamily: apple, background: "#ffffff", borderLeft: "0.5px solid #d2d2d7", padding: 0, display: "flex", flexDirection: "column" }}
        className="sm:max-w-md"
      >
        {/* Header */}
        <SheetHeader style={{ padding: "24px 24px 20px", borderBottom: "0.5px solid #d2d2d7" }}>
          <SheetTitle style={{ fontFamily: apple, fontSize: "17px", fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.022em" }}>
            Edit Session
          </SheetTitle>
          <p style={{ fontSize: "13px", color: "#6e6e73", marginTop: "2px", lineHeight: 1.4 }}>
            {format(initialStartsAt, "d MMM yyyy, HH:mm")}
            {" · "}
            <span style={{ textTransform: "capitalize" }}>
              {session.lessonType.replace(/_/g, " ").toLowerCase()}
            </span>
            {studentNames && ` · ${studentNames}`}
          </p>
        </SheetHeader>

        {/* Scrollable form body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }} className="flex flex-col gap-5">

          {/* Lesson Type */}
          <div>
            <label style={labelStyle}>Lesson Type</label>
            <AppleSelect
              value={lessonType}
              onChange={setLessonType}
              options={LESSON_TYPES}
            />
          </div>

          {/* Instructor */}
          <div>
            <label style={labelStyle}>Instructor</label>
            <AppleSelect
              value={instructorId}
              onChange={setInstructorId}
              options={instructorOptions}
            />
          </div>

          {/* Date */}
          <div>
            <label style={labelStyle}>Date</label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <button
                  style={{
                    ...inputStyle,
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,113,227,0.3)"; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                    <rect x="1" y="2.5" width="12" height="10.5" rx="2" stroke="#6e6e73" strokeWidth="1.2"/>
                    <path d="M1 5.5h12" stroke="#6e6e73" strokeWidth="1.2"/>
                    <path d="M4.5 1v3M9.5 1v3" stroke="#6e6e73" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  {format(date, "d MMM yyyy")}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border border-[#d2d2d7] shadow-lg rounded-xl" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => { if (d) { setDate(d); setCalOpen(false); } }}
                  defaultMonth={date}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Start / End time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Start Time</label>
              <AppleSelect value={time} onChange={setTime} options={TIME_OPTIONS.map((t) => ({ value: t, label: t }))} />
            </div>
            <div>
              <label style={labelStyle}>End Time</label>
              <AppleSelect value={endTime} onChange={setEndTime} options={TIME_OPTIONS.map((t) => ({ value: t, label: t }))} />
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label style={labelStyle}>Capacity</label>
            <input
              type="number"
              min={1}
              max={20}
              value={capacityInput}
              onChange={(e) => setCapacityInput(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,113,227,0.3)"; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              placeholder="Optional notes…"
              rows={3}
              style={{
                ...inputStyle,
                resize: "none",
                lineHeight: 1.5,
              }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,113,227,0.3)"; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          {/* Add guest + charge */}
          <AddGuestSection
            sessionId={session.id}
            lessonType={lessonType}
            serviceProducts={serviceProducts}
          />

          {/* Commission card */}
          <div>
            <label style={{ ...labelStyle, marginBottom: "8px" }}>Commission</label>
            <CommissionCard
              commission={(session.commission ?? null) as CommissionCardData | null}
              instructorId={session.instructor?.id ?? null}
              reason={
                session.commission
                  ? undefined
                  : !session.instructor
                    ? "no-instructor"
                    : session.bookings.some((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
                      ? "no-profile"
                      : "no-qualifying-booking"
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "0.5px solid #d2d2d7", background: "#ffffff" }}>
          {/* Save / Cancel */}
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginBottom: "10px" }}>
            <button
              onClick={() => onOpenChange(false)}
              disabled={saving}
              style={{
                fontFamily: apple, fontSize: "15px", fontWeight: 500,
                color: "#0071e3", background: "transparent", border: "none",
                padding: "7px 14px", borderRadius: "8px", cursor: "pointer",
                opacity: saving ? 0.4 : 1, transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,113,227,0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                fontFamily: apple, fontSize: "15px", fontWeight: 500,
                color: "#ffffff", background: "#0071e3", border: "none",
                padding: "7px 20px", borderRadius: "8px", cursor: "pointer",
                opacity: saving ? 0.6 : 1, transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#0077ed"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#0071e3"; }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>

          {/* Delete */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={saving || deleting}
              style={{
                fontFamily: apple, fontSize: "13px", fontWeight: 500,
                color: "#ff3b30", background: "transparent", border: "none",
                width: "100%", padding: "6px", borderRadius: "8px",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "6px", opacity: saving || deleting ? 0.4 : 1,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,59,48,0.07)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <Trash2 style={{ width: "13px", height: "13px" }} />
              Delete session
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontFamily: apple, fontSize: "12px", color: "#ff3b30", flex: 1 }}>
                Delete this session and all bookings?
              </span>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                style={{
                  fontFamily: apple, fontSize: "13px", fontWeight: 500,
                  color: "#6e6e73", background: "#f5f5f7", border: "none",
                  padding: "5px 12px", borderRadius: "7px", cursor: "pointer",
                }}
              >
                No
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  fontFamily: apple, fontSize: "13px", fontWeight: 500,
                  color: "#ffffff", background: "#ff3b30", border: "none",
                  padding: "5px 12px", borderRadius: "7px", cursor: "pointer",
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Add Guest sub-section ─────────────────────────────────── */
type GuestResult = { id: string; name: string | null; email: string; phone: string | null };

function AddGuestSection({
  sessionId,
  lessonType,
  serviceProducts,
}: {
  sessionId: string;
  lessonType: string;
  serviceProducts: EditSheetServiceProduct[];
}) {
  const router = useRouter();

  const productBySku = useMemo(() => {
    const m = new Map<string, EditSheetServiceProduct>();
    serviceProducts.forEach((p) => m.set(p.sku, p));
    return m;
  }, [serviceProducts]);

  const defaultProductIdFor = useCallback(
    (lt: string) => {
      const sku = LESSON_TYPE_SKU[lt as LessonType];
      return sku ? (productBySku.get(sku)?.id ?? "") : "";
    },
    [productBySku],
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GuestResult[]>([]);
  const [selected, setSelected] = useState<GuestResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [productId, setProductId] = useState<string>(() => defaultProductIdFor(lessonType));
  const [submitting, setSubmitting] = useState(false);

  // Re-default the product when lesson type changes (and no manual override yet for the new type)
  React.useEffect(() => {
    setProductId(defaultProductIdFor(lessonType));
  }, [lessonType, defaultProductIdFor]);

  async function handleSearch(q: string) {
    setQuery(q);
    setSelected(null);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const users = await searchUser(q);
      setResults(
        users.map((u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone })),
      );
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd() {
    if (!selected) {
      toast.error("Pick a guest first.");
      return;
    }
    if (!productId) {
      toast.error("No matching product for this lesson type — add it in /products or pick one.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await addGuestToSession(sessionId, {
        guestId: selected.id,
        productId,
      });
      if (result.success) {
        toast.success(`Added ${selected.name ?? selected.email} and charged.`);
        setQuery("");
        setSelected(null);
        setResults([]);
        setProductId(defaultProductIdFor(lessonType));
        router.refresh();
      } else {
        toast.error(result.message ?? "Failed to add guest.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <label style={{ ...labelStyle, marginBottom: "8px" }}>Add Guest</label>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, email, or phone"
          disabled={submitting}
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,113,227,0.3)"; }}
          onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
        />
        {searching && (
          <p style={{ fontFamily: apple, fontSize: "12px", color: "#6e6e73" }}>Searching…</p>
        )}
        {selected ? (
          <p style={{ fontFamily: apple, fontSize: "13px", color: "#0071e3" }}>
            Selected: {selected.name ?? selected.email}
          </p>
        ) : (
          results.length > 0 && (
            <div
              style={{
                maxHeight: "160px",
                overflowY: "auto",
                borderRadius: "10px",
                border: "0.5px solid #d2d2d7",
              }}
            >
              {results.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSelected(u);
                    setQuery(`${u.name ?? "Unnamed"} - ${u.email}`);
                    setResults([]);
                  }}
                  style={{
                    fontFamily: apple,
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 14px",
                    fontSize: "14px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "0.5px solid #ece8e3",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontWeight: 500, color: "#1d1d1f" }}>{u.name ?? "Unnamed"}</span>
                  <span style={{ marginLeft: "8px", color: "#6e6e73", fontSize: "12px" }}>{u.email}</span>
                </button>
              ))}
            </div>
          )
        )}

        <div>
          <label style={{ ...labelStyle, marginTop: "4px" }}>Product (charge)</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            disabled={submitting}
            style={selectStyle}
          >
            <option value="">— Select a product —</option>
            {serviceProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {(p.priceCents / 100).toLocaleString()} EGP
              </option>
            ))}
          </select>
          {!productId && (
            <p style={{ fontFamily: apple, fontSize: "12px", color: "#b45309", marginTop: "4px" }}>
              No matching product for this lesson type. Add it in <code>/products</code> or pick one manually.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={submitting || !selected || !productId}
          style={{
            fontFamily: apple,
            fontSize: "14px",
            fontWeight: 500,
            color: "#ffffff",
            background: "#0071e3",
            border: "none",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: submitting || !selected || !productId ? "not-allowed" : "pointer",
            opacity: submitting || !selected || !productId ? 0.5 : 1,
            alignSelf: "flex-start",
          }}
        >
          {submitting ? "Adding…" : "Add Guest"}
        </button>
      </div>
    </div>
  );
}
