import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { CommissionType, ExpenseType } from "@prisma/client";

const COMMISSION_LABEL: Record<CommissionType, string> = {
  PRIVATE: "Private",
  SEMI_PRIVATE: "Semi-private",
  EXTRA_PRIVATE: "Extra private",
  EXTRA_SEMI_PRIVATE: "Extra semi-private",
  FOIL: "Foil",
  KIDS: "Kids",
};

const EXPENSE_LABEL: Record<ExpenseType, string> = {
  INSTRUCTOR_COMMISSION: "Instructor commission",
  TRANSPORTATION: "Transportation",
  MAINTENANCE: "Maintenance",
  SUPPLIES: "Supplies",
  OTHER: "Other",
};

function formatEGP(cents: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(d: Date) {
  return new Date(d).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1d1d1f",
    backgroundColor: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 36,
  },
  brand: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.5,
    color: "#1d1d1f",
  },
  brandTag: {
    marginTop: 4,
    fontSize: 9,
    color: "#86868b",
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  invoiceMeta: { alignItems: "flex-end" },
  invoiceTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    color: "#86868b",
  },
  invoiceNumber: {
    marginTop: 4,
    fontSize: 14,
    color: "#1d1d1f",
    fontFamily: "Helvetica-Bold",
  },
  invoiceDate: { marginTop: 2, fontSize: 9, color: "#6e6e73" },
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  block: { flexBasis: "48%" },
  blockLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    color: "#86868b",
    marginBottom: 6,
  },
  blockName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#1d1d1f",
  },
  blockMuted: { fontSize: 10, color: "#6e6e73", marginTop: 2 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1d1d1f",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: 8,
    marginBottom: 8,
  },
  table: {
    width: "100%",
    borderTopWidth: 0.5,
    borderTopColor: "#d2d2d7",
    borderTopStyle: "solid",
  },
  tableHead: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#d2d2d7",
    borderBottomStyle: "solid",
  },
  tableHeadCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#86868b",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ececef",
    borderBottomStyle: "solid",
  },
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 8,
  },
  subtotalLabel: {
    width: "30%",
    fontSize: 10,
    color: "#6e6e73",
    textAlign: "right",
    paddingRight: 12,
  },
  subtotalValue: {
    width: "18%",
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1d1d1f",
    textAlign: "right",
  },
  totalCard: {
    marginTop: 24,
    padding: 18,
    backgroundColor: "#f5f5f7",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    color: "#6e6e73",
  },
  totalSub: { marginTop: 2, fontSize: 9, color: "#86868b" },
  totalAmount: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.5,
    color: "#1d1d1f",
  },
  emptyText: {
    fontSize: 10,
    color: "#86868b",
    fontStyle: "italic",
    marginVertical: 8,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 56,
    right: 56,
    fontSize: 8,
    color: "#aeaeb2",
    textAlign: "center",
    letterSpacing: 0.4,
  },
});

export type InvoiceCommission = {
  id: string;
  commissionType: CommissionType;
  durationMinutes: number;
  finalAmountCents: number;
  startsAt: Date;
  endsAt: Date;
  students: string;
};

export type InvoiceExpense = {
  id: string;
  type: ExpenseType;
  description: string | null;
  amountCents: number;
  createdAt: Date;
};

export type InstructorInvoiceProps = {
  invoiceNumber: string;
  issuedAt: Date;
  periodFrom: Date;
  periodTo: Date;
  instructor: { name: string | null; email: string; phone: string | null };
  commissions: InvoiceCommission[];
  otherExpenses: InvoiceExpense[];
};

function CommissionsSection({ rows }: { rows: InvoiceCommission[] }) {
  const subtotal = rows.reduce((s, r) => s + r.finalAmountCents, 0);
  return (
    <View>
      <Text style={styles.sectionTitle}>Commissions</Text>
      <View style={styles.table}>
        <View style={styles.tableHead}>
          <Text style={[styles.tableHeadCell, { width: "16%" }]}>Date</Text>
          <Text style={[styles.tableHeadCell, { width: "14%" }]}>Time</Text>
          <Text style={[styles.tableHeadCell, { width: "10%" }]}>Dur.</Text>
          <Text style={[styles.tableHeadCell, { width: "18%" }]}>Type</Text>
          <Text style={[styles.tableHeadCell, { width: "24%" }]}>Students</Text>
          <Text
            style={[
              styles.tableHeadCell,
              { width: "18%", textAlign: "right" },
            ]}
          >
            Amount
          </Text>
        </View>
        {rows.length === 0 ? (
          <Text style={styles.emptyText}>
            No outstanding commissions for this period.
          </Text>
        ) : (
          rows.map((r) => (
            <View key={r.id} style={styles.tableRow} wrap={false}>
              <Text style={{ width: "16%", fontSize: 10, color: "#1d1d1f" }}>
                {formatDate(r.startsAt)}
              </Text>
              <Text style={{ width: "14%", fontSize: 10, color: "#1d1d1f" }}>
                {formatTime(r.startsAt)}–{formatTime(r.endsAt)}
              </Text>
              <Text style={{ width: "10%", fontSize: 10, color: "#1d1d1f" }}>
                {formatDuration(r.durationMinutes)}
              </Text>
              <Text style={{ width: "18%", fontSize: 10, color: "#1d1d1f" }}>
                {COMMISSION_LABEL[r.commissionType]}
              </Text>
              <Text style={{ width: "24%", fontSize: 10, color: "#1d1d1f" }}>
                {r.students || "—"}
              </Text>
              <Text
                style={{
                  width: "18%",
                  fontSize: 10,
                  color: "#1d1d1f",
                  textAlign: "right",
                }}
              >
                {formatEGP(r.finalAmountCents)}
              </Text>
            </View>
          ))
        )}
        {rows.length > 0 && (
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Subtotal</Text>
            <Text style={styles.subtotalValue}>{formatEGP(subtotal)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function OtherExpensesSection({ rows }: { rows: InvoiceExpense[] }) {
  const subtotal = rows.reduce((s, r) => s + r.amountCents, 0);
  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>Other outstanding expenses</Text>
      <View style={styles.table}>
        <View style={styles.tableHead}>
          <Text style={[styles.tableHeadCell, { width: "18%" }]}>Date</Text>
          <Text style={[styles.tableHeadCell, { width: "22%" }]}>Type</Text>
          <Text style={[styles.tableHeadCell, { width: "42%" }]}>
            Description
          </Text>
          <Text
            style={[
              styles.tableHeadCell,
              { width: "18%", textAlign: "right" },
            ]}
          >
            Amount
          </Text>
        </View>
        {rows.map((r) => (
          <View key={r.id} style={styles.tableRow}>
            <Text style={{ width: "18%", fontSize: 10, color: "#1d1d1f" }}>
              {formatDate(r.createdAt)}
            </Text>
            <Text style={{ width: "22%", fontSize: 10, color: "#1d1d1f" }}>
              {EXPENSE_LABEL[r.type]}
            </Text>
            <Text style={{ width: "42%", fontSize: 10, color: "#1d1d1f" }}>
              {r.description || "—"}
            </Text>
            <Text
              style={{
                width: "18%",
                fontSize: 10,
                color: "#1d1d1f",
                textAlign: "right",
              }}
            >
              {formatEGP(r.amountCents)}
            </Text>
          </View>
        ))}
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalValue}>{formatEGP(subtotal)}</Text>
        </View>
      </View>
    </View>
  );
}

export function InstructorInvoicePdf({
  invoiceNumber,
  issuedAt,
  periodFrom,
  periodTo,
  instructor,
  commissions,
  otherExpenses,
}: InstructorInvoiceProps) {
  const commissionTotal = commissions.reduce(
    (s, r) => s + r.finalAmountCents,
    0
  );
  const otherTotal = otherExpenses.reduce((s, r) => s + r.amountCents, 0);
  const balance = commissionTotal + otherTotal;
  const items = commissions.length + otherExpenses.length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>FINS</Text>
            <Text style={styles.brandTag}>Commission invoice</Text>
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceTitle}>Invoice</Text>
            <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>
              Issued {formatDate(issuedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Instructor</Text>
            <Text style={styles.blockName}>
              {instructor.name || "Unnamed"}
            </Text>
            <Text style={styles.blockMuted}>{instructor.email}</Text>
            {instructor.phone && (
              <Text style={styles.blockMuted}>{instructor.phone}</Text>
            )}
          </View>
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Period</Text>
            <Text style={styles.blockName}>
              {formatDate(periodFrom)} – {formatDate(periodTo)}
            </Text>
            <Text style={styles.blockMuted}>
              {items} item{items === 1 ? "" : "s"}
            </Text>
          </View>
        </View>

        <CommissionsSection rows={commissions} />

        {otherExpenses.length > 0 && (
          <>
            <View style={{ height: 18 }} />
            <OtherExpensesSection rows={otherExpenses} />
          </>
        )}

        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>Balance due</Text>
            <Text style={styles.totalSub}>
              {commissions.length} commission
              {commissions.length === 1 ? "" : "s"}
              {otherExpenses.length > 0
                ? ` · ${otherExpenses.length} other expense${
                    otherExpenses.length === 1 ? "" : "s"
                  }`
                : ""}
            </Text>
          </View>
          <Text style={styles.totalAmount}>{formatEGP(balance)}</Text>
        </View>

        <Text style={styles.footer} fixed>
          Fins · Commission invoice · {formatDate(issuedAt)}
        </Text>
      </Page>
    </Document>
  );
}
