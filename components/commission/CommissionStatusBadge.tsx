import { CommissionStatus } from "@prisma/client";

const apple = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif";

const STATUS: Record<CommissionStatus, { label: string; bg: string; color: string; dot: string }> = {
  PENDING: { label: "Pending",  bg: "rgba(255,159,10,0.12)", color: "#b25000", dot: "#ff9f0a" },
  PAID:    { label: "Paid",     bg: "rgba(52,199,89,0.12)",  color: "#1a7f37", dot: "#34c759" },
};

export function CommissionStatusBadge({ status }: { status: CommissionStatus }) {
  const { label, bg, color, dot } = STATUS[status];
  return (
    <span
      style={{
        fontFamily: apple,
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        background: bg,
        color,
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.02em",
        padding: "3px 8px 3px 6px",
        borderRadius: "20px",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: dot, display: "inline-block", flexShrink: 0 }} />
      {label}
    </span>
  );
}
