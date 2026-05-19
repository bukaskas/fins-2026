import { ExpenseStatus, ExpenseType } from "@prisma/client";
import {
  listExpenses,
  getExpenseSummary,
} from "@/lib/actions/expense.actions";
import { listUsers } from "@/lib/actions/user.actions";
import { prisma } from "@/db/prisma";
import { formatEGP } from "@/lib/commission";
import { NewExpenseDialog } from "@/components/expenses/NewExpenseDialog";
import { ExpenseRowActions } from "@/components/expenses/ExpenseRowActions";
import { PayeeFilter } from "@/components/expenses/PayeeFilter";
import { ExportInvoiceButton } from "@/components/expenses/ExportInvoiceButton";
import { SettleExpensesButton } from "@/components/expenses/SettleExpensesDialog";

const apple =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', sans-serif";

const TYPE_LABEL: Record<ExpenseType, string> = {
  INSTRUCTOR_COMMISSION: "Instructor commission",
  TRANSPORTATION: "Transportation",
  MAINTENANCE: "Maintenance",
  SUPPLIES: "Supplies",
  OTHER: "Other",
};

const STATUS_STYLES: Record<
  ExpenseStatus,
  { bg: string; fg: string; label: string }
> = {
  PENDING: { bg: "#fff4cf", fg: "#9a5b00", label: "Pending" },
  PAID: { bg: "#d8f5e1", fg: "#0d6b2c", label: "Paid" },
  CANCELED: { bg: "#ebebed", fg: "#6e6e73", label: "Canceled" },
};

function StatusPill({ status }: { status: ExpenseStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      style={{
        fontFamily: apple,
        background: s.bg,
        color: s.fg,
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.01em",
        padding: "3px 10px",
        borderRadius: "999px",
        display: "inline-block",
        lineHeight: 1.5,
      }}
    >
      {s.label}
    </span>
  );
}

type SearchParams = { payeeId?: string };

export default async function AccountingExpensesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const payeeId = sp.payeeId || null;

  const users = await listUsers();
  const payeeOptions = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
  }));

  if (payeeId) {
    return (
      <StatementView payeeId={payeeId} payees={payeeOptions} />
    );
  }

  return <AllExpensesView payees={payeeOptions} />;
}

async function AllExpensesView({
  payees,
}: {
  payees: { id: string; name: string | null; email: string; phone: string | null }[];
}) {
  const [{ rows, totals }, summary] = await Promise.all([
    listExpenses(),
    getExpenseSummary(),
  ]);

  const typesWithPending = (Object.entries(summary.byType) as [
    ExpenseType,
    { pendingCents: number; count: number }
  ][]).filter(([, v]) => v.count > 0);

  return (
    <Shell title="Expenses" subtitle="Outgoing liabilities — manual entries and instructor payouts.">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
        <PayeeFilter payees={payees} selectedId={null} />
        <NewExpenseDialog payees={payees} />
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <SummaryTile
          label="Outstanding"
          value={formatEGP(summary.pendingCents)}
          sub={`${summary.pendingCount} pending`}
          accent="#9a5b00"
        />
        <SummaryTile
          label="Paid"
          value={formatEGP(summary.paidCents)}
          sub={`${totals.paid.count} settled`}
          accent="#0d6b2c"
        />
        <BreakdownTile types={typesWithPending} />
      </section>

      <Panel
        title="All expenses"
        right={
          <span style={{ fontSize: "13px", color: "#6e6e73" }}>
            {rows.length} entr{rows.length === 1 ? "y" : "ies"}
          </span>
        }
      >
        {rows.length === 0 ? (
          <EmptyState>No expenses yet.</EmptyState>
        ) : (
          <ExpenseTable rows={rows} showStatus showActions />
        )}
      </Panel>
    </Shell>
  );
}

async function StatementView({
  payeeId,
  payees,
}: {
  payeeId: string;
  payees: { id: string; name: string | null; email: string; phone: string | null }[];
}) {
  const payee = await prisma.user.findUnique({
    where: { id: payeeId },
    select: { id: true, name: true, email: true, phone: true },
  });

  if (!payee) {
    return (
      <Shell title="Expenses" subtitle="Payee not found.">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <PayeeFilter payees={payees} selectedId={null} />
        </div>
      </Shell>
    );
  }

  const { rows } = await listExpenses({ payeeId });
  const pending = rows.filter((r) => r.status === ExpenseStatus.PENDING);
  const paid = rows.filter((r) => r.status === ExpenseStatus.PAID);
  const canceled = rows.filter((r) => r.status === ExpenseStatus.CANCELED);

  const pendingCents = pending.reduce((s, r) => s + r.amountCents, 0);
  const paidCents = paid.reduce((s, r) => s + r.amountCents, 0);
  const payeeName = payee.name || payee.email;

  return (
    <Shell
      title="Statement"
      subtitle={
        <>
          Statement of expenses for{" "}
          <span style={{ color: "#1d1d1f", fontWeight: 500 }}>{payeeName}</span>
        </>
      }
    >
      <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
        <PayeeFilter payees={payees} selectedId={payeeId} />
        <div className="flex items-center gap-2">
          <ExportInvoiceButton payeeId={payeeId} disabled={rows.length === 0} />
          <SettleExpensesButton
            payeeId={payeeId}
            payeeName={payeeName}
            pendingCount={pending.length}
            pendingCents={pendingCents}
          />
        </div>
      </div>

      {/* Payee card */}
      <section
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          padding: "20px 22px",
          boxShadow:
            "0 1px 2px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.06)",
          marginBottom: "16px",
        }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "#86868b",
              marginBottom: "8px",
            }}
          >
            Payee
          </p>
          <p
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#1d1d1f",
              letterSpacing: "-0.022em",
            }}
          >
            {payeeName}
          </p>
          <p style={{ fontSize: "13px", color: "#6e6e73", marginTop: "2px" }}>
            {payee.email}
            {payee.phone ? ` · ${payee.phone}` : ""}
          </p>
        </div>
        <div className="flex gap-8">
          <Stat label="Outstanding" value={formatEGP(pendingCents)} count={pending.length} accent="#9a5b00" />
          <Stat label="Paid" value={formatEGP(paidCents)} count={paid.length} accent="#0d6b2c" />
        </div>
      </section>

      <Panel
        title="Outstanding"
        right={
          <span style={{ fontSize: "13px", color: "#6e6e73" }}>
            {pending.length} pending
          </span>
        }
      >
        {pending.length === 0 ? (
          <EmptyState>No outstanding expenses for this payee.</EmptyState>
        ) : (
          <ExpenseTable rows={pending} showActions />
        )}
      </Panel>

      <div style={{ height: "16px" }} />

      <Panel
        title="Already paid"
        right={
          <span style={{ fontSize: "13px", color: "#6e6e73" }}>
            {paid.length} settled
          </span>
        }
      >
        {paid.length === 0 ? (
          <EmptyState>Nothing has been paid yet.</EmptyState>
        ) : (
          <ExpenseTable rows={paid} showPaidAt />
        )}
      </Panel>

      {canceled.length > 0 && (
        <>
          <div style={{ height: "16px" }} />
          <Panel
            title="Canceled"
            right={
              <span style={{ fontSize: "13px", color: "#6e6e73" }}>
                {canceled.length}
              </span>
            }
          >
            <ExpenseTable rows={canceled} />
          </Panel>
        </>
      )}
    </Shell>
  );
}

function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        fontFamily: apple,
        background: "#f5f5f7",
        minHeight: "100vh",
        color: "#1d1d1f",
      }}
    >
      <main className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8">
          <h1
            style={{
              fontSize: "34px",
              fontWeight: 600,
              letterSpacing: "-0.022em",
              lineHeight: 1.1,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              marginTop: "6px",
              fontSize: "15px",
              color: "#6e6e73",
              letterSpacing: "-0.01em",
            }}
          >
            {subtitle}
          </p>
        </header>
        {children}
      </main>
    </div>
  );
}

function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
    >
      <div
        className="flex items-baseline justify-between px-6 py-4"
        style={{ borderBottom: "0.5px solid #d2d2d7" }}
      >
        <h2
          style={{
            fontSize: "15px",
            fontWeight: 600,
            letterSpacing: "-0.022em",
          }}
        >
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-6 py-12 text-center"
      style={{ fontSize: "14px", color: "#86868b" }}
    >
      {children}
    </div>
  );
}

type Row = {
  id: string;
  type: ExpenseType;
  description: string | null;
  amountCents: number;
  status: ExpenseStatus;
  createdAt: Date;
  paidAt: Date | null;
  payee: { id: string; name: string | null; email: string } | null;
};

function ExpenseTable({
  rows,
  showStatus,
  showActions,
  showPaidAt,
}: {
  rows: Row[];
  showStatus?: boolean;
  showActions?: boolean;
  showPaidAt?: boolean;
}) {
  const cols = [
    { key: "date", label: showPaidAt ? "Paid" : "Date" },
    { key: "type", label: "Type" },
    { key: "desc", label: "Description" },
    ...(showStatus ? [{ key: "payee", label: "Payee" }] : []),
    { key: "amount", label: "Amount", align: "right" as const },
    ...(showStatus ? [{ key: "status", label: "Status" }] : []),
    ...(showActions ? [{ key: "actions", label: "" }] : []),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full" style={{ fontFamily: apple }}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th
                key={c.key}
                className={
                  "px-6 py-3 whitespace-nowrap " +
                  (c.align === "right" ? "text-right" : "text-left")
                }
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#86868b",
                  background: "#fbfbfd",
                  borderBottom: "0.5px solid #d2d2d7",
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr
              key={r.id}
              style={{
                borderTop: idx === 0 ? "none" : "0.5px solid #ececef",
              }}
            >
              <td
                className="px-6 py-4 whitespace-nowrap"
                style={{ fontSize: "13px", color: "#1d1d1f" }}
              >
                {new Date(
                  showPaidAt && r.paidAt ? r.paidAt : r.createdAt
                ).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td
                className="px-6 py-4 whitespace-nowrap"
                style={{ fontSize: "13px", color: "#1d1d1f" }}
              >
                {TYPE_LABEL[r.type]}
              </td>
              <td
                className="px-6 py-4 max-w-[280px]"
                style={{ fontSize: "13px", color: "#1d1d1f" }}
              >
                {r.description ?? (
                  <span style={{ color: "#c7c7cc" }}>—</span>
                )}
              </td>
              {showStatus && (
                <td className="px-6 py-4">
                  {r.payee ? (
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#1d1d1f",
                          fontWeight: 500,
                        }}
                      >
                        {r.payee.name || "Unnamed"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#86868b" }}>
                        {r.payee.email}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: "#c7c7cc" }}>—</span>
                  )}
                </td>
              )}
              <td
                className="px-6 py-4 text-right whitespace-nowrap"
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1d1d1f",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.01em",
                }}
              >
                {formatEGP(r.amountCents)}
              </td>
              {showStatus && (
                <td className="px-6 py-4">
                  <StatusPill status={r.status} />
                </td>
              )}
              {showActions && (
                <td className="px-6 py-4 text-right">
                  <ExpenseRowActions
                    id={r.id}
                    type={r.type}
                    status={r.status}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        padding: "20px 22px",
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.06)",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "#86868b",
          marginBottom: "10px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "30px",
          fontWeight: 600,
          letterSpacing: "-0.022em",
          color: "#1d1d1f",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          marginTop: "8px",
          fontSize: "12px",
          color: accent,
          fontWeight: 500,
        }}
      >
        {sub}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  count,
  accent,
}: {
  label: string;
  value: string;
  count: number;
  accent: string;
}) {
  return (
    <div>
      <p
        style={{
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "#86868b",
          marginBottom: "4px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "20px",
          fontWeight: 600,
          letterSpacing: "-0.022em",
          color: "#1d1d1f",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </p>
      <p
        style={{
          marginTop: "2px",
          fontSize: "11px",
          color: accent,
          fontWeight: 500,
        }}
      >
        {count} item{count === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function BreakdownTile({
  types,
}: {
  types: [ExpenseType, { pendingCents: number; count: number }][];
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        padding: "20px 22px",
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.06)",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "#86868b",
          marginBottom: "12px",
        }}
      >
        Pending by type
      </p>
      {types.length === 0 ? (
        <p style={{ fontSize: "13px", color: "#86868b" }}>
          Nothing outstanding.
        </p>
      ) : (
        <ul className="space-y-2">
          {types.map(([t, v]) => (
            <li
              key={t}
              className="flex items-baseline justify-between gap-3"
              style={{ fontSize: "13px" }}
            >
              <span style={{ color: "#6e6e73" }}>{TYPE_LABEL[t]}</span>
              <span>
                <span
                  style={{
                    color: "#1d1d1f",
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatEGP(v.pendingCents)}
                </span>{" "}
                <span style={{ color: "#aeaeb2", fontSize: "12px" }}>
                  · {v.count}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
