import { Resend } from "resend";
import BookingEmail, { type BookingEmailStage } from "@/emails/emailTemplate";
import { formatPaymentDeadline, formatPaymentDeadlineShort } from "@/lib/bookings/payment-window";
const resend = new Resend(process.env.RESEND_API_KEY);
import { APP_NAME, EMAIL_ADDRESS, PHARAOH_AIRSTYLE_DATE_KEY, SERVER_URL, STAFF_EMAILS } from "@/lib/constants";
import type { PriceBreakdown } from "@/lib/pricing";
import RegistrationEmail from "./registrationEmail";
import StaffNotificationEmail from "./staffNotificationEmail";
import PharaohAirstyleEmail from "./pharaohEmail";
import PharaohConfirmedEmail from "./pharaohConfirmedEmail";
import FullyBookedEmail from "./fullyBookedEmail";
import BulkEmail from "./bulkEmail";
import PasswordResetEmail from "./passwordResetEmail";
import VerifyEmail from "./verifyEmail";

// Recipients see a name in the From column, not a bare address.
const EMAIL_FROM = `${APP_NAME} <${EMAIL_ADDRESS}>`;

/** The format the booking actions already use for guest-facing dates. */
function formatBookingDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

const bookingSubjectPrefix: Record<string, { request: string; confirmed: string }> = {
  "kitesurfing-course": {
    request: "Kitesurf booking request",
    confirmed: "Kitesurf session booked",
  },
  "day-use": {
    request: "Day-use request received",
    confirmed: "Day-use booking confirmed",
  },
  restaurant: {
    request: "Table request received",
    confirmed: "Table booked",
  },
};

const fallbackSubjectPrefix = {
  request: "Booking request received",
  confirmed: "Booking confirmed",
};

interface BookingEmailOptions {
  bookingType?: string;
  numberOfPeople?: number;
  numberOfKids?: number;
  /** Passed whole so the emailed line items always sum to the emailed total. */
  priceBreakdown?: PriceBreakdown;
  bookingId?: string;
  /** Defaults to "request": only callers that hold a seat may say otherwise. */
  stage?: BookingEmailStage;
  /** Total taken so far. Confirmed only. */
  amountPaidCents?: number;
  /** What is still owed on arrival. Awaiting-payment and confirmed. */
  balanceDueCents?: number;
  /** The deposit still to pay online. Awaiting-payment only. */
  depositDueCents?: number;
  /** When the payment window closes. Awaiting-payment and cancelled. */
  deadline?: Date;
}

/** Where a guest whose hold was released can start over, if anywhere. */
function rebookUrlFor(bookingType: string | undefined, date: Date): string | undefined {
  if (bookingType === "day-use") {
    return `${SERVER_URL}/day-use/booking?date=${date.toISOString().slice(0, 10)}`;
  }
  if (bookingType === "pharaoh-airstyle") return `${SERVER_URL}/kitesurfing/booking/pharaoh`;
  return undefined;
}

export async function sendBookingEmail(
  to: string,
  name: string,
  date: Date,
  options: BookingEmailOptions = {},
) {
  const {
    bookingType,
    numberOfPeople,
    numberOfKids,
    priceBreakdown,
    bookingId,
    stage = "request",
    amountPaidCents,
    balanceDueCents,
    depositDueCents,
    deadline,
  } = options;

  // The event's own mail only replaces the request receipt; the payment and
  // release emails are the standard ones.
  if (bookingType === "pharaoh-airstyle" && stage === "request") {
    await resend.emails.send({
      from: EMAIL_FROM,
      replyTo: EMAIL_ADDRESS,
      to,
      subject: "Pharaoh Airstyle Event — Spot Reserved! 🎉",
      react: <PharaohAirstyleEmail username={name} />,
    });
    return;
  }

  const bookingUrl = bookingId ? `${SERVER_URL}/bookings/${bookingId}` : undefined;
  const formattedDate = formatBookingDate(date);

  // A confirmed seat on the Pharaoh Airstyle day gets the event email: the
  // schedule, and no "your payment came through" line for the free Kai
  // community registrations.
  if (
    stage === "confirmed" &&
    bookingType === "day-use" &&
    date.toISOString().slice(0, 10) === PHARAOH_AIRSTYLE_DATE_KEY
  ) {
    await resend.emails.send({
      from: EMAIL_FROM,
      replyTo: EMAIL_ADDRESS,
      to,
      subject: `Pharaoh Airstyle — you're confirmed for ${formattedDate}`,
      react: (
        <PharaohConfirmedEmail
          username={name}
          date={formattedDate}
          numberOfPeople={numberOfPeople}
          numberOfKids={numberOfKids}
          bookingUrl={bookingUrl}
          amountPaidCents={amountPaidCents}
          balanceDueCents={balanceDueCents}
        />
      ),
    });
    return;
  }
  const prefix =
    (bookingType ? bookingSubjectPrefix[bookingType] : undefined) ??
    fallbackSubjectPrefix;

  // Never the signup email's subject: identical subjects get threaded together
  // by Gmail and the confirmation disappears under the welcome mail.
  const subject =
    stage === "awaiting-payment"
      ? `Pay your deposit to hold ${formattedDate}`
      : stage === "cancelled"
        ? `${bookingType === "day-use" ? "Your spot" : "Your booking"} for ${formattedDate} was released`
        : `${stage === "confirmed" ? prefix.confirmed : prefix.request} — ${formattedDate}`;

  await resend.emails.send({
    from: EMAIL_FROM,
    replyTo: EMAIL_ADDRESS,
    to,
    subject,
    react: (
      <BookingEmail
        username={name}
        date={formattedDate}
        bookingType={bookingType}
        numberOfPeople={numberOfPeople}
        numberOfKids={numberOfKids}
        priceBreakdown={priceBreakdown}
        bookingUrl={bookingUrl}
        stage={stage}
        amountPaidCents={amountPaidCents}
        balanceDueCents={balanceDueCents}
        depositDueCents={depositDueCents}
        deadline={deadline ? formatPaymentDeadline(deadline) : undefined}
        deadlineShort={deadline ? formatPaymentDeadlineShort(deadline) : undefined}
        rebookUrl={stage === "cancelled" ? rebookUrlFor(bookingType, date) : undefined}
      />
    ),
  });
}

const serviceToStaffEmails: Record<string, string[]> = {
  "kitesurfing-course": STAFF_EMAILS.kitesurfing,
  "pharaoh-airstyle": STAFF_EMAILS.kitesurfing,
  "day-use": STAFF_EMAILS.dayUse,
  restaurant: STAFF_EMAILS.restaurant,
};

export async function sendStaffNotificationEmail(
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  date: Date,
  service: string,
  numberOfPeople: number,
  numberOfKids?: number,
  totalPriceCents?: number,
  bookingId?: string,
) {
  const staffEmails = serviceToStaffEmails[service];
  if (!staffEmails?.length) return;

  const subject =
    service === "kitesurfing-course"
      ? `Kitesurf booking at ${date.toDateString()}`
      : `New booking: ${customerName} — ${service}`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: staffEmails,
    subject,
    react: (
      <StaffNotificationEmail
        customerName={customerName}
        customerEmail={customerEmail}
        customerPhone={customerPhone}
        date={date.toDateString()}
        service={service}
        numberOfPeople={numberOfPeople}
        numberOfKids={numberOfKids}
        totalPriceCents={totalPriceCents}
        bookingId={bookingId}
      />
    ),
  });
}

export async function sendFullyBookedEmail(to: string, name: string, date: Date) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Update on your booking — ${date.toDateString()}`,
    react: <FullyBookedEmail username={name} date={date.toDateString()} />,
  });
}

export async function sendBulkEmail(
  to: string,
  name: string,
  subject: string,
  message: string,
) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    react: <BulkEmail username={name} message={message} />,
  });
}

export async function sendRegistrationEmail(to: string, name: string) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Welcome to ${APP_NAME}!`,
    react: <RegistrationEmail username={name} />,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string,
) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Reset your ${APP_NAME} password`,
    react: <PasswordResetEmail username={name} resetUrl={resetUrl} />,
  });
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  verifyUrl: string,
) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Verify your ${APP_NAME} email`,
    react: <VerifyEmail username={name} verifyUrl={verifyUrl} />,
  });
}
