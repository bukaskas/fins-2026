"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { LessonType } from "@prisma/client";
import StudentSearchField from "@/components/lessons/StudentSearchField";
import BundleSearchField from "@/components/lessons/BundleSearchField";
import {
  createLessonSessionFromForm,
  getUserLessonHoursBalance,
} from "@/lib/actions/lessons.actions";

const LESSON_TYPE_LABELS: Record<string, string> = {
  PRIVATE:       "Private",
  GROUP:         "Group",
  EXTRA_PRIVATE: "Extra Private",
  EXTRA_GROUP:   "Extra Group",
  FOIL:          "Foil",
  KIDS:          "Kids",
};

type Student = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
};

type Instructor = {
  id: string;
  name: string | null;
  email: string;
};

type BundleProduct = {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  creditUnits: number;
  lessonType: LessonType | null;
};

export default function NewLessonForm({
  students,
  instructors,
  bundleProducts,
  initialStudentId,
  initialBalance,
}: {
  students: Student[];
  instructors: Instructor[];
  bundleProducts: BundleProduct[];
  initialStudentId?: string;
  initialBalance: number | null;
}) {
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId ?? "");
  const [balance, setBalance] = useState<number | null>(initialBalance);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [startsAtDate, setStartsAtDate] = useState("");
  const [startsAtHour, setStartsAtHour] = useState("");
  const [startsAtMinute, setStartsAtMinute] = useState("");
  const startsAtTime =
    startsAtHour && startsAtMinute ? `${startsAtHour}:${startsAtMinute}` : "";
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutesPart, setDurationMinutesPart] = useState(0);
  const [bundleProductId, setBundleProductId] = useState("");
  const [lessonType, setLessonType] = useState<LessonType>(LessonType.PRIVATE);
  const [submitting, startSubmit] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ref = document.referrer;
    if (!ref) return;
    try {
      const url = new URL(ref);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      setReturnTo(url.pathname + url.search);
    } catch {
      // ignore malformed referrer
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!selectedStudentId) {
      setBalance(null);
      return;
    }
    if (selectedStudentId === initialStudentId && balance != null) return;
    setBalanceLoading(true);
    getUserLessonHoursBalance(selectedStudentId)
      .then((v) => {
        if (!cancelled) setBalance(v);
      })
      .finally(() => {
        if (!cancelled) setBalanceLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId]);

  const requiredHours = useMemo(
    () => durationHours + durationMinutesPart / 60,
    [durationHours, durationMinutesPart],
  );

  const hasEnoughHours = balance != null && balance >= requiredHours;
  const needsBundle = selectedStudentId !== "" && !hasEnoughHours && requiredHours > 0;

  const selectedBundle = bundleProducts.find((p) => p.id === bundleProductId) ?? null;
  const bundleCoversDuration =
    selectedBundle != null && selectedBundle.creditUnits >= requiredHours;

  const lessonTypeFromBundle = selectedBundle?.lessonType ?? null;
  const effectiveLessonType = lessonTypeFromBundle ?? lessonType;
  const lessonTypeAutoDerived = lessonTypeFromBundle != null;

  const submitDisabled =
    submitting ||
    !selectedStudentId ||
    requiredHours <= 0 ||
    (needsBundle && (!selectedBundle || !bundleCoversDuration));

  const balanceLabel = balanceLoading
    ? "Checking…"
    : balance == null
      ? "—"
      : `${balance.toFixed(2)}h`;

  function handleSubmit(formData: FormData) {
    setError(null);
    startSubmit(async () => {
      try {
        await createLessonSessionFromForm(formData);
      } catch (err) {
        // Next.js redirect() throws NEXT_REDIRECT — let it bubble.
        if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        setError(err instanceof Error ? err.message : "Failed to create lesson.");
      }
    });
  }

  return (
    <form
      action={handleSubmit}
      className="rounded-3xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 24px rgba(14, 165, 233, 0.08), 0 1px 4px rgba(0,0,0,0.06)",
        border: "1px solid rgba(186, 230, 253, 0.5)",
      }}
    >
      <div className="px-7 pt-7 pb-6 space-y-5">

        {/* Student */}
        <StudentSearchField
          students={students}
          initialStudentId={initialStudentId}
          onSelect={(id) => setSelectedStudentId(id)}
        />

        {/* Balance panel */}
        {selectedStudentId && (
          <div
            className="rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{
              background: hasEnoughHours ? "#ecfdf5" : "#fff7ed",
              border: `1px solid ${hasEnoughHours ? "rgba(167, 243, 208, 0.6)" : "rgba(254, 215, 170, 0.7)"}`,
            }}
          >
            <span
              className="text-[0.6rem] tracking-[0.22em] uppercase font-[700]"
              style={{
                color: hasEnoughHours ? "#047857" : "#c2410c",
                fontFamily: "var(--font-raleway)",
              }}
            >
              Remaining hours
            </span>
            <span
              className="text-[0.92rem] font-[500]"
              style={{
                color: hasEnoughHours ? "#065f46" : "#9a3412",
                fontFamily: "var(--font-raleway)",
              }}
            >
              {balanceLabel}
            </span>
          </div>
        )}

        {/* Instructor */}
        <FieldBlock label="Instructor">
          <select
            name="instructorId"
            required
            className="w-full bg-transparent text-[0.92rem] font-[300] focus:outline-none appearance-none cursor-pointer"
            style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
            defaultValue=""
          >
            <option value="" disabled>Select instructor</option>
            {instructors.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>
        </FieldBlock>

        {/* Lesson type — hidden when a bundle with a built-in lessonType is selected */}
        {!lessonTypeAutoDerived && (
          <FieldBlock label="Lesson type">
            <select
              value={lessonType}
              onChange={(e) => setLessonType(e.target.value as LessonType)}
              className="w-full bg-transparent text-[0.92rem] font-[300] focus:outline-none appearance-none cursor-pointer"
              style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
            >
              {Object.values(LessonType).map((t) => (
                <option key={t} value={t}>
                  {LESSON_TYPE_LABELS[t] ?? t}
                </option>
              ))}
            </select>
          </FieldBlock>
        )}
        <input type="hidden" name="lessonType" value={effectiveLessonType} />

        {/* Start date/time */}
        <div>
          <p
            className="text-[0.55rem] tracking-[0.24em] uppercase font-[700] mb-2.5"
            style={{ color: "#94a3b8", fontFamily: "var(--font-raleway)" }}
          >
            Starts at
          </p>
          <div className="grid grid-cols-2 gap-3">
            <FieldBlock label="Date" compact>
              <input
                type="date"
                value={startsAtDate}
                onChange={(e) => setStartsAtDate(e.target.value)}
                required
                className="w-full bg-transparent text-[0.92rem] font-[300] focus:outline-none cursor-pointer"
                style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
              />
            </FieldBlock>
            <FieldBlock label="Time" compact>
              <div className="flex items-center gap-1.5">
                <select
                  value={startsAtHour}
                  onChange={(e) => setStartsAtHour(e.target.value)}
                  required
                  aria-label="Hour"
                  className="flex-1 bg-transparent text-[0.92rem] font-[300] focus:outline-none appearance-none cursor-pointer text-center"
                  style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
                >
                  <option value="" disabled>
                    HH
                  </option>
                  {Array.from({ length: 24 }, (_, i) => {
                    const v = String(i).padStart(2, "0");
                    return (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    );
                  })}
                </select>
                <span
                  className="text-[0.92rem] font-[300] select-none"
                  style={{ color: "#94a3b8", fontFamily: "var(--font-raleway)" }}
                >
                  :
                </span>
                <select
                  value={startsAtMinute}
                  onChange={(e) => setStartsAtMinute(e.target.value)}
                  required
                  aria-label="Minute"
                  className="flex-1 bg-transparent text-[0.92rem] font-[300] focus:outline-none appearance-none cursor-pointer text-center"
                  style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
                >
                  <option value="" disabled>
                    MM
                  </option>
                  <option value="00">00</option>
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="45">45</option>
                </select>
              </div>
            </FieldBlock>
          </div>
          <input
            type="hidden"
            name="startsAt"
            value={startsAtDate && startsAtTime ? `${startsAtDate}T${startsAtTime}` : ""}
          />
        </div>

        {/* Duration */}
        <div>
          <p
            className="text-[0.55rem] tracking-[0.24em] uppercase font-[700] mb-2.5"
            style={{ color: "#94a3b8", fontFamily: "var(--font-raleway)" }}
          >
            Duration
          </p>
          <div className="grid grid-cols-2 gap-3">
            <FieldBlock label="Hours" compact>
              <input
                type="number"
                name="durationHours"
                min={0}
                step={1}
                value={durationHours}
                onChange={(e) => setDurationHours(Math.max(0, Number(e.target.value) || 0))}
                required
                className="w-full bg-transparent text-[0.92rem] font-[300] focus:outline-none"
                style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
              />
            </FieldBlock>
            <FieldBlock label="Minutes" compact>
              <select
                name="durationMinutesPart"
                value={durationMinutesPart}
                onChange={(e) => setDurationMinutesPart(Number(e.target.value))}
                className="w-full bg-transparent text-[0.92rem] font-[300] focus:outline-none appearance-none cursor-pointer"
                style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
              >
                <option value={0}>00</option>
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={45}>45</option>
              </select>
            </FieldBlock>
          </div>
        </div>

        {/* Bundle product picker (only when student has insufficient hours) */}
        {needsBundle && (
          <BundleSearchField
            bundles={bundleProducts}
            selectedId={bundleProductId}
            onSelect={setBundleProductId}
            requiredHours={requiredHours}
            label={`Add hours — needs ${requiredHours.toFixed(2)}h`}
          />
        )}
        <input type="hidden" name="bundleProductId" value={needsBundle ? bundleProductId : ""} />
        <input type="hidden" name="returnTo" value={returnTo} />

        {/* Notes */}
        <FieldBlock label="Notes (optional)">
          <textarea
            name="notes"
            rows={3}
            placeholder="Any special requirements…"
            className="w-full bg-transparent text-[0.92rem] font-[300] focus:outline-none resize-none placeholder:text-[#cbd5e1]"
            style={{ color: "#0c2340", fontFamily: "var(--font-raleway)" }}
          />
        </FieldBlock>

      </div>

      {/* Footer */}
      <div
        className="px-7 py-5"
        style={{
          borderTop: "1px solid rgba(186, 230, 253, 0.4)",
          background: "linear-gradient(to bottom, transparent, rgba(240,249,255,0.3))",
        }}
      >
        {error && (
          <div
            className="mb-3 rounded-2xl px-4 py-3 text-[0.78rem] font-[500]"
            style={{
              background: "#fef2f2",
              border: "1px solid rgba(254, 202, 202, 0.7)",
              color: "#991b1b",
              fontFamily: "var(--font-raleway)",
            }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={submitDisabled}
          className="w-full py-3.5 rounded-2xl text-[0.78rem] font-[700] tracking-[0.16em] uppercase transition-all duration-200 hover:shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
            color: "#fff",
            fontFamily: "var(--font-raleway)",
            boxShadow: "0 2px 12px rgba(14, 165, 233, 0.3)",
          }}
        >
          {submitting ? "Creating…" : "Create Lesson"}
        </button>
      </div>
    </form>
  );
}

function FieldBlock({
  label,
  children,
  compact,
}: {
  label: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className="rounded-2xl px-4 py-3 transition-shadow focus-within:shadow-sm"
      style={{
        background: "#f8fbff",
        border: "1px solid rgba(186, 230, 253, 0.6)",
      }}
    >
      <p
        className={`${compact ? "text-[0.5rem]" : "text-[0.55rem]"} tracking-[0.22em] uppercase font-[700] mb-1.5`}
        style={{ color: "#94a3b8", fontFamily: "var(--font-raleway)" }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}
