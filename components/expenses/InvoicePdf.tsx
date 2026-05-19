import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { ExpenseType } from "@prisma/client";

const TYPE_LABEL: Record<ExpenseType, string> = {
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
  invoiceMeta: {
    alignItems: "flex-end",
  },
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
  invoiceDate: {
    marginTop: 2,
    fontSize: 9,
    color: "#6e6e73",
  },
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  block: {
    flexBasis: "48%",
  },
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
  blockMuted: {
    fontSize: 10,
    color: "#6e6e73",
    marginTop: 2,
  },
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
  cellDate: { width: "18%", fontSize: 10, color: "#1d1d1f" },
  cellType: { width: "22%", fontSize: 10, color: "#1d1d1f" },
  cellDesc: { width: "40%", fontSize: 10, color: "#1d1d1f" },
  cellAmount: {
    width: "20%",
    fontSize: 10,
    color: "#1d1d1f",
    textAlign: "right",
  },
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 8,
  },
  subtotalLabel: {
    width: "40%",
    fontSize: 10,
    color: "#6e6e73",
    textAlign: "right",
    paddingRight: 12,
  },
  subtotalValue: {
    width: "20%",
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
  totalSub: {
    marginTop: 2,
    fontSize: 9,
    color: "#86868b",
  },
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
    marginVertical: 6,
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

export type InvoiceExpense = {
  id: string;
  type: ExpenseType;
  description: string | null;
  amountCents: number;
  createdAt: Date;
  paidAt: Date | null;
};

export type InvoicePayee = {
  name: string | null;
  email: string;
  phone: string | null;
};

export type InvoiceProps = {
  invoiceNumber: string;
  issuedAt: Date;
  periodFrom: Date | null;
  periodTo: Date | null;
  payee: InvoicePayee;
  pending: InvoiceExpense[];
  paid: InvoiceExpense[];
};

function Section({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: InvoiceExpense[];
  emptyText: string;
}) {
  const subtotal = rows.reduce((s, r) => s + r.amountCents, 0);
  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.table}>
        <View style={styles.tableHead}>
          <Text style={[styles.tableHeadCell, { width: "18%" }]}>Date</Text>
          <Text style={[styles.tableHeadCell, { width: "22%" }]}>Type</Text>
          <Text style={[styles.tableHeadCell, { width: "40%" }]}>
            Description
          </Text>
          <Text
            style={[
              styles.tableHeadCell,
              { width: "20%", textAlign: "right" },
            ]}
          >
            Amount
          </Text>
        </View>
        {rows.length === 0 ? (
          <Text style={styles.emptyText}>{emptyText}</Text>
        ) : (
          rows.map((r) => (
            <View key={r.id} style={styles.tableRow}>
              <Text style={styles.cellDate}>{formatDate(r.createdAt)}</Text>
              <Text style={styles.cellType}>{TYPE_LABEL[r.type]}</Text>
              <Text style={styles.cellDesc}>{r.description || "—"}</Text>
              <Text style={styles.cellAmount}>{formatEGP(r.amountCents)}</Text>
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

export function InvoicePdf({
  invoiceNumber,
  issuedAt,
  periodFrom,
  periodTo,
  payee,
  pending,
  paid,
}: InvoiceProps) {
  const pendingTotal = pending.reduce((s, r) => s + r.amountCents, 0);
  const paidTotal = paid.reduce((s, r) => s + r.amountCents, 0);

  const period =
    periodFrom && periodTo
      ? `${formatDate(periodFrom)} – ${formatDate(periodTo)}`
      : periodFrom
      ? `From ${formatDate(periodFrom)}`
      : periodTo
      ? `Through ${formatDate(periodTo)}`
      : "All time";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>FINS</Text>
            <Text style={styles.brandTag}>Statement of expenses</Text>
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceTitle}>Statement</Text>
            <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>
              Issued {formatDate(issuedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Payee</Text>
            <Text style={styles.blockName}>{payee.name || "Unnamed"}</Text>
            <Text style={styles.blockMuted}>{payee.email}</Text>
            {payee.phone && (
              <Text style={styles.blockMuted}>{payee.phone}</Text>
            )}
          </View>
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Period</Text>
            <Text style={styles.blockName}>{period}</Text>
            <Text style={styles.blockMuted}>
              {pending.length + paid.length} item
              {pending.length + paid.length === 1 ? "" : "s"}
            </Text>
          </View>
        </View>

        <Section
          title="Outstanding"
          rows={pending}
          emptyText="No outstanding expenses for this period."
        />

        <View style={{ height: 18 }} />

        <Section
          title="Already paid"
          rows={paid}
          emptyText="No paid expenses for this period."
        />

        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>Balance due</Text>
            <Text style={styles.totalSub}>
              {pending.length} outstanding · {formatEGP(paidTotal)} already paid
            </Text>
          </View>
          <Text style={styles.totalAmount}>{formatEGP(pendingTotal)}</Text>
        </View>

        <Text style={styles.footer} fixed>
          Generated by Fins · {formatDate(issuedAt)}
        </Text>
      </Page>
    </Document>
  );
}
