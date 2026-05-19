"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const apple =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', sans-serif";

type Payee = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
};

type Props = {
  payees: Payee[];
  selectedId: string | null;
};

export function PayeeFilter({ payees, selectedId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = payees.find((p) => p.id === selectedId) ?? null;

  const [query, setQuery] = useState(
    selected ? `${selected.name || "Unnamed"} · ${selected.email}` : ""
  );
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || (selected && query.includes("·"))) return payees.slice(0, 8);
    return payees
      .filter((u) =>
        `${u.name ?? ""} ${u.email} ${u.phone ?? ""}`.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [payees, query, selected]);

  function pushWith(payeeId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (payeeId) params.set("payeeId", payeeId);
    else params.delete("payeeId");
    router.push(`/accounting/expenses${params.toString() ? `?${params}` : ""}`);
  }

  function pick(u: Payee) {
    setQuery(`${u.name || "Unnamed"} · ${u.email}`);
    setOpen(false);
    pushWith(u.id);
  }

  function clear() {
    setQuery("");
    setOpen(false);
    pushWith(null);
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ width: "320px", maxWidth: "100%" }}
    >
      <input
        type="text"
        value={query}
        placeholder="Filter by payee…"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{
          fontFamily: apple,
          width: "100%",
          background: "#ffffff",
          color: "#1d1d1f",
          fontSize: "14px",
          padding: "10px 38px 10px 14px",
          borderRadius: "10px",
          border: "none",
          outline: "none",
          boxShadow: "0 0 0 0.5px rgba(0,0,0,0.1)",
        }}
      />

      {selected ? (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear payee filter"
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "#d2d2d7",
            color: "#1d1d1f",
            border: "none",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "13px",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>
      ) : (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        >
          <circle
            cx="6"
            cy="6"
            r="4.5"
            stroke="#86868b"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M9.5 9.5L12.5 12.5"
            stroke="#86868b"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      )}

      {open && filtered.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-auto"
          style={{
            maxHeight: "300px",
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow:
              "0 12px 32px rgba(0,0,0,0.16), 0 0 0 0.5px rgba(0,0,0,0.08)",
          }}
        >
          {filtered.map((u, i) => (
            <button
              key={u.id}
              type="button"
              onMouseDown={() => pick(u)}
              className="block w-full px-4 py-2.5 text-left"
              style={{
                fontFamily: apple,
                background: "transparent",
                border: "none",
                borderTop: i > 0 ? "0.5px solid #ececef" : "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f5f5f7";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{ fontSize: "13px", color: "#1d1d1f", fontWeight: 500 }}
              >
                {u.name || "Unnamed"}
              </div>
              <div style={{ fontSize: "12px", color: "#86868b" }}>
                {u.email}
                {u.phone ? ` · ${u.phone}` : ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
