import Link from "next/link";
import { getBookingById } from "@/lib/actions/booking.actions";
import { format } from "date-fns";

const S = {
  page: {
    background: "#faf9f7",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem 1.5rem",
  } as React.CSSProperties,
  wrap: {
    width: "100%",
    maxWidth: 400,
  } as React.CSSProperties,
  label: {
    fontFamily: "var(--font-raleway)",
    fontSize: "0.58rem",
    letterSpacing: "0.32em",
    textTransform: "uppercase" as const,
    fontWeight: 600,
    color: "#8a8480",
  },
  headline: {
    fontFamily: "var(--font-raleway)",
    fontWeight: 100,
    fontSize: "clamp(1.9rem,8vw,2.75rem)",
    lineHeight: 0.92,
    letterSpacing: "-0.03em",
    color: "#1a1614",
  } as React.CSSProperties,
  accent: {
    width: 36,
    height: 2,
    background: "#f59e0b",
    margin: "20px 0 24px",
  } as React.CSSProperties,
  card: {
    border: "1px solid #ece8e3",
    background: "#ffffff",
    marginTop: 28,
  } as React.CSSProperties,
  row: (last: boolean) =>
    ({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "13px 20px",
      borderBottom: last ? "none" : "1px solid #ece8e3",
    }) as React.CSSProperties,
  rowKey: {
    fontFamily: "var(--font-raleway)",
    fontSize: "0.58rem",
    letterSpacing: "0.26em",
    textTransform: "uppercase" as const,
    fontWeight: 600,
    color: "#b0a89f",
  },
  rowVal: {
    fontFamily: "var(--font-raleway)",
    fontSize: "0.88rem",
    fontWeight: 500,
    color: "#1a1614",
    textAlign: "right" as const,
    maxWidth: "60%",
  },
  sectionTitle: {
    fontFamily: "var(--font-raleway)",
    fontSize: "0.58rem",
    letterSpacing: "0.3em",
    textTransform: "uppercase" as const,
    fontWeight: 600,
    color: "#8a8480",
    marginBottom: 14,
  },
  stepRow: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
  } as React.CSSProperties,
  stepNum: {
    flexShrink: 0,
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: "1px solid #1a1614",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-raleway)",
    fontSize: "0.58rem",
    fontWeight: 700,
    color: "#1a1614",
    marginTop: 1,
  } as React.CSSProperties,
  stepText: {
    fontFamily: "var(--font-raleway)",
    fontSize: "0.82rem",
    color: "#5a5450",
    lineHeight: 1.65,
  },
  divider: {
    borderBottom: "1px solid #ece8e3",
    margin: "28px 0",
  } as React.CSSProperties,
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0 24px",
  } as React.CSSProperties,
  colHead: {
    fontFamily: "var(--font-raleway)",
    fontSize: "0.58rem",
    letterSpacing: "0.26em",
    textTransform: "uppercase" as const,
    fontWeight: 600,
    color: "#1a1614",
    marginBottom: 10,
  },
  colItem: {
    fontFamily: "var(--font-raleway)",
    fontSize: "0.78rem",
    color: "#8a8480",
    lineHeight: 1.9,
  },
  btnPrimary: {
    display: "block",
    background: "#1a1614",
    color: "#ffffff",
    textAlign: "center" as const,
    padding: "15px 24px",
    fontFamily: "var(--font-raleway)",
    fontSize: "0.68rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    fontWeight: 700,
    textDecoration: "none",
    transition: "background 0.15s",
  } as React.CSSProperties,
  btnSecondary: {
    display: "block",
    border: "1px solid #ece8e3",
    color: "#5a5450",
    textAlign: "center" as const,
    padding: "15px 24px",
    fontFamily: "var(--font-raleway)",
    fontSize: "0.68rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    fontWeight: 600,
    textDecoration: "none",
    marginTop: 10,
  } as React.CSSProperties,
};

async function DayUseSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string; date?: string; type?: string }>;
}) {
  const params = await searchParams;
  const bookingId = params.bookingId;

  if (!bookingId) {
    return (
      <div style={S.page}>
        <div style={S.wrap}>
          <p style={S.label}>Day Use · Fins Sokhna</p>
          <div style={S.accent} />
          <h1 style={{ ...S.headline, fontSize: "clamp(2.5rem,10vw,3.5rem)" }}>
            Invalid<br />booking.
          </h1>
          <p style={{ ...S.stepText, marginTop: 16 }}>
            Missing booking information. Please try again.
          </p>
          <div style={{ marginTop: 28 }}>
            <Link href="/day-use/booking" style={S.btnPrimary}>
              Back to booking
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const booking = await getBookingById(bookingId);

  if (!booking) {
    return (
      <div style={S.page}>
        <div style={S.wrap}>
          <p style={S.label}>Day Use · Fins Sokhna</p>
          <div style={S.accent} />
          <h1 style={{ ...S.headline, fontSize: "clamp(2.5rem,10vw,3.5rem)" }}>
            Not<br />found.
          </h1>
          <p style={{ ...S.stepText, marginTop: 16 }}>
            We could not locate your booking. Please contact us.
          </p>
          <div style={{ marginTop: 28 }}>
            <Link href="/day-use/booking" style={S.btnPrimary}>
              Back to booking
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = format(new Date(booking.date), "d MMMM yyyy");
  const peopleLabel =
    `${booking.numberOfPeople} adult${booking.numberOfPeople !== 1 ? "s" : ""}` +
    ((booking.numberOfKids ?? 0) > 0
      ? `, ${booking.numberOfKids} kid${booking.numberOfKids !== 1 ? "s" : ""}`
      : "");

  const rows = [
    { key: "Date",   val: formattedDate },
    { key: "Name",   val: booking.name },
    { key: "Phone",  val: booking.phone },
    { key: "People", val: peopleLabel },
  ];

  const steps = [
    "Our team will review your request and reach out shortly to confirm your spot.",
    "We may ask you to share your Instagram account so we can get to know you.",
    "Once confirmed, show up and enjoy. Gates open at 9:00 AM, close at 11:00 PM.",
  ];

  return (
    <div style={S.page}>
      <div style={S.wrap}>

        {/* Mark + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "#1a1614",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
              <path d="M1 5L4.5 8.5L12 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={S.label}>Fins · Day Use</span>
        </div>

        {/* Headline */}
        <h1 style={S.headline}>
          Booking<br />received.
        </h1>
        <div style={S.accent} />
        <p style={{ ...S.label, letterSpacing: "0.2em" }}>
          {formattedDate}
        </p>

        {/* Booking detail rows */}
        <div style={S.card}>
          {rows.map((r, i) => (
            <div key={r.key} style={S.row(i === rows.length - 1)}>
              <span style={S.rowKey}>{r.key}</span>
              <span style={S.rowVal}>{r.val}</span>
            </div>
          ))}
        </div>

        <div style={S.divider} />

        {/* What happens next */}
        <p style={S.sectionTitle}>What happens next</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {steps.map((text, i) => (
            <div key={i} style={S.stepRow}>
              <span style={S.stepNum}>{i + 1}</span>
              <p style={S.stepText}>{text}</p>
            </div>
          ))}
        </div>

        <div style={S.divider} />

        {/* Included + Rules */}
        <div style={S.twoCol}>
          <div>
            <p style={S.colHead}>Included</p>
            {["Beach entrance", "Swimming pool", "Showers & lounges", "Lockers"].map(item => (
              <p key={item} style={S.colItem}>{item}</p>
            ))}
          </div>
          <div>
            <p style={S.colHead}>House rules</p>
            {["No pets or icebox", "No outside food", "Mixed groups only"].map(item => (
              <p key={item} style={S.colItem}>{item}</p>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: 36 }}>
          <a href="https://wa.me/201080500099" style={S.btnPrimary}>
            WhatsApp us
          </a>
          <Link href="/" style={S.btnSecondary}>
            Return home
          </Link>
        </div>

      </div>
    </div>
  );
}

export default DayUseSuccessPage;
