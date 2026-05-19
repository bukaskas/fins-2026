"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "@tanstack/react-form";
import { ExpenseType } from "@prisma/client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { createExpense } from "@/lib/actions/expense.actions";
import { newExpenseSchema } from "@/lib/validators";

const apple =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', sans-serif";

const TYPE_OPTIONS: Array<{
  value: Exclude<ExpenseType, "INSTRUCTOR_COMMISSION">;
  label: string;
}> = [
  { value: ExpenseType.TRANSPORTATION, label: "Transportation" },
  { value: ExpenseType.MAINTENANCE, label: "Maintenance" },
  { value: ExpenseType.SUPPLIES, label: "Supplies" },
  { value: ExpenseType.OTHER, label: "Other" },
];

type Payee = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
};

type Props = {
  payees: Payee[];
};

const fieldLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "#6e6e73",
  display: "block",
  marginBottom: "8px",
};

const inputBase: React.CSSProperties = {
  fontFamily: apple,
  width: "100%",
  background: "#f5f5f7",
  color: "#1d1d1f",
  fontSize: "14px",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  outline: "none",
};

export function NewExpenseDialog({ payees }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payeeQuery, setPayeeQuery] = useState("");
  const [payeeOpen, setPayeeOpen] = useState(false);
  const payeeContainer = useRef<HTMLDivElement>(null);

  const form = useForm({
    defaultValues: {
      type: ExpenseType.OTHER as Exclude<ExpenseType, "INSTRUCTOR_COMMISSION">,
      description: "",
      amount: "" as string,
      payeeId: "" as string,
    },
    validators: {
      onSubmit: ({ value }) => {
        const cents = Math.round(Number(value.amount) * 100);
        const parsed = newExpenseSchema.safeParse({
          type: value.type,
          description: value.description || undefined,
          amountCents: Number.isFinite(cents) ? cents : NaN,
          payeeId: value.payeeId || undefined,
        });
        if (!parsed.success) {
          const flat = parsed.error.flatten().fieldErrors;
          return {
            type: flat.type?.[0],
            description: flat.description?.[0],
            amount: flat.amountCents?.[0],
            payeeId: flat.payeeId?.[0],
          };
        }
        return;
      },
    },
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      try {
        const cents = Math.round(Number(value.amount) * 100);
        const res = await createExpense({
          type: value.type,
          description: value.description || undefined,
          amountCents: cents,
          payeeId: value.payeeId || undefined,
        });
        if (!res.success) {
          toast.error(res.message ?? "Failed to create expense");
          return;
        }
        toast.success("Expense created");
        setOpen(false);
        form.reset();
        setPayeeQuery("");
        router.refresh();
      } finally {
        setSubmitting(false);
      }
    },
  });

  const filteredPayees = useMemo(() => {
    const q = payeeQuery.trim().toLowerCase();
    if (!q) return payees.slice(0, 8);
    return payees
      .filter((u) =>
        `${u.name ?? ""} ${u.email} ${u.phone ?? ""}`.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [payees, payeeQuery]);

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) {
      form.reset();
      setPayeeQuery("");
      setPayeeOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          style={{
            fontFamily: apple,
            fontSize: "14px",
            fontWeight: 500,
            color: "#ffffff",
            background: "#0071e3",
            border: "none",
            padding: "8px 18px",
            borderRadius: "980px",
            cursor: "pointer",
            letterSpacing: "-0.01em",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#0077ed";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#0071e3";
          }}
        >
          Add expense
        </button>
      </DialogTrigger>

      <DialogContent
        className="p-0 border-0 overflow-hidden sm:max-w-[440px]"
        style={{
          fontFamily: apple,
          background: "#ffffff",
          borderRadius: "18px",
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.08)",
        }}
      >
        {/* Title bar */}
        <div
          className="px-6 pt-6 pb-5"
          style={{ borderBottom: "0.5px solid #d2d2d7" }}
        >
          <p
            style={{
              fontSize: "17px",
              fontWeight: 600,
              color: "#1d1d1f",
              letterSpacing: "-0.022em",
            }}
          >
            New Expense
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "#6e6e73",
              marginTop: "4px",
              lineHeight: 1.4,
            }}
          >
            Log a manual expense. Instructor commissions are tracked automatically.
          </p>
        </div>

        {/* Form body */}
        <form
          id="new-expense-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="px-6 py-5 space-y-4"
        >
          {/* Type */}
          <form.Field name="type">
            {(field) => (
              <div>
                <label htmlFor={field.name} style={fieldLabel}>
                  Type
                </label>
                <div className="relative">
                  <select
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value as Exclude<
                          ExpenseType,
                          "INSTRUCTOR_COMMISSION"
                        >
                      )
                    }
                    disabled={submitting}
                    style={{
                      ...inputBase,
                      appearance: "none",
                      paddingRight: "36px",
                      cursor: "pointer",
                    }}
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="#6e6e73"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <FieldErrorText errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          {/* Amount */}
          <form.Field name="amount">
            {(field) => (
              <div>
                <label htmlFor={field.name} style={fieldLabel}>
                  Amount{" "}
                  <span
                    style={{
                      textTransform: "none",
                      letterSpacing: 0,
                      fontWeight: 400,
                      color: "#aeaeb2",
                    }}
                  >
                    (EGP)
                  </span>
                </label>
                <input
                  id={field.name}
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={submitting}
                  placeholder="0.00"
                  style={{
                    ...inputBase,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
                <FieldErrorText errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          {/* Description */}
          <form.Field name="description">
            {(field) => (
              <div>
                <label htmlFor={field.name} style={fieldLabel}>
                  Description{" "}
                  <span
                    style={{
                      textTransform: "none",
                      letterSpacing: 0,
                      fontWeight: 400,
                      color: "#aeaeb2",
                    }}
                  >
                    (optional)
                  </span>
                </label>
                <input
                  id={field.name}
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={submitting}
                  placeholder="e.g. Tuk-tuk to airport"
                  style={inputBase}
                />
                <FieldErrorText errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          {/* Payee */}
          <form.Field name="payeeId">
            {(field) => {
              const selected = payees.find((u) => u.id === field.state.value);
              return (
                <div>
                  <label htmlFor={field.name} style={fieldLabel}>
                    Payee{" "}
                    <span
                      style={{
                        textTransform: "none",
                        letterSpacing: 0,
                        fontWeight: 400,
                        color: "#aeaeb2",
                      }}
                    >
                      (optional)
                    </span>
                  </label>
                  <div ref={payeeContainer} className="relative">
                    <input
                      id={field.name}
                      type="text"
                      autoComplete="off"
                      value={
                        selected && !payeeOpen
                          ? `${selected.name || "Unnamed"} · ${selected.email}`
                          : payeeQuery
                      }
                      onChange={(e) => {
                        setPayeeQuery(e.target.value);
                        if (field.state.value) field.handleChange("");
                        setPayeeOpen(true);
                      }}
                      onFocus={() => setPayeeOpen(true)}
                      onBlur={() => setTimeout(() => setPayeeOpen(false), 150)}
                      disabled={submitting}
                      placeholder="Search by name, email, or phone…"
                      style={inputBase}
                    />
                    {payeeOpen && filteredPayees.length > 0 && (
                      <div
                        className="absolute left-0 right-0 top-full z-50 mt-2 overflow-auto"
                        style={{
                          maxHeight: "260px",
                          background: "#ffffff",
                          borderRadius: "12px",
                          boxShadow:
                            "0 12px 32px rgba(0,0,0,0.16), 0 0 0 0.5px rgba(0,0,0,0.08)",
                        }}
                      >
                        {filteredPayees.map((u, i) => (
                          <button
                            key={u.id}
                            type="button"
                            onMouseDown={() => {
                              field.handleChange(u.id);
                              setPayeeQuery("");
                              setPayeeOpen(false);
                            }}
                            className="block w-full px-4 py-2.5 text-left transition-colors"
                            style={{
                              fontFamily: apple,
                              background: "transparent",
                              border: "none",
                              borderTop:
                                i > 0 ? "0.5px solid #ececef" : "none",
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
                              style={{
                                fontSize: "13px",
                                color: "#1d1d1f",
                                fontWeight: 500,
                              }}
                            >
                              {u.name || "Unnamed"}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#86868b",
                              }}
                            >
                              {u.email}
                              {u.phone ? ` · ${u.phone}` : ""}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <FieldErrorText errors={field.state.meta.errors} />
                </div>
              );
            }}
          </form.Field>
        </form>

        {/* Actions */}
        <div
          className="flex justify-end gap-2 px-6 py-4"
          style={{ borderTop: "0.5px solid #d2d2d7" }}
        >
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
            style={{
              fontFamily: apple,
              fontSize: "15px",
              fontWeight: 500,
              color: "#0071e3",
              background: "transparent",
              border: "none",
              padding: "7px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              opacity: submitting ? 0.4 : 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,113,227,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="new-expense-form"
            disabled={submitting}
            style={{
              fontFamily: apple,
              fontSize: "15px",
              fontWeight: 500,
              color: "#ffffff",
              background: "#0071e3",
              border: "none",
              padding: "7px 18px",
              borderRadius: "8px",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.4 : 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.background = "#0077ed";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#0071e3";
            }}
          >
            {submitting ? "Creating…" : "Create expense"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldErrorText({ errors }: { errors: unknown[] }) {
  const msg = errors
    .map((e) => {
      if (typeof e === "string") return e;
      if (e && typeof e === "object" && "message" in e)
        return String((e as { message: unknown }).message);
      return null;
    })
    .filter(Boolean)
    .join(" · ");
  if (!msg) return null;
  return (
    <p
      style={{
        marginTop: "6px",
        fontSize: "12px",
        color: "#d8313a",
        letterSpacing: "-0.01em",
      }}
    >
      {msg}
    </p>
  );
}
