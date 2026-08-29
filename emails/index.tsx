import { Resend } from "resend";
import BookingEmail from "@/emails/emailTemplate";
const resend = new Resend(process.env.RESEND_API_KEY);
import { APP_NAME, EMAIL_ADDRESS, SERVER_URL, STAFF_EMAILS } from "@/lib/constants";
import type { PriceBreakdown } from "@/lib/pricing";
import RegistrationEmail from "./registrationEmail";
import StaffNotificationEmail from "./staffNotificationEmail";
import PharaohAirstyleEmail from "./pharaohEmail";
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
  /** Only for callers that actually hold a seat; everything else is a receipt. */
  confirmed?: boolean;
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
    confirmed = false,
  } = options;

  if (bookingType === "pharaoh-airstyle") {
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
  const prefix =
    (bookingType ? bookingSubjectPrefix[bookingType] : undefined) ??
    fallbackSubjectPrefix;

  await resend.emails.send({
    from: EMAIL_FROM,
    replyTo: EMAIL_ADDRESS,
    to,
    // Never the signup email's subject: identical subjects get threaded
    // together by Gmail and the confirmation disappears under the welcome mail.
    subject: `${confirmed ? prefix.confirmed : prefix.request} — ${formattedDate}`,
    react: (
      <BookingEmail
        username={name}
        date={formattedDate}
        bookingType={bookingType}
        numberOfPeople={numberOfPeople}
        numberOfKids={numberOfKids}
        priceBreakdown={priceBreakdown}
        bookingUrl={bookingUrl}
        confirmed={confirmed}
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
