import { Resend } from "resend";
import BookingEmail from "@/emails/emailTemplate";
const resend = new Resend(process.env.RESEND_API_KEY);
import { APP_NAME, EMAIL_ADDRESS, SERVER_URL, STAFF_EMAILS } from "@/lib/constants";
import RegistrationEmail from "./registrationEmail";
import StaffNotificationEmail from "./staffNotificationEmail";
import PharaohAirstyleEmail from "./pharaohEmail";

export async function sendBookingEmail(
  to: string,
  name: string,
  date: Date,
  bookingType?: string,
  numberOfPeople?: number,
  numberOfKids?: number,
  totalPriceCents?: number,
  bookingId?: string,
) {
  if (bookingType === "pharaoh-airstyle") {
    await resend.emails.send({
      from: EMAIL_ADDRESS,
      to,
      subject: "Pharaoh Airstyle Event — Spot Reserved! 🎉",
      react: <PharaohAirstyleEmail username={name} />,
    });
    return;
  }

  const bookingUrl = bookingId ? `${SERVER_URL}/bookings/${bookingId}` : undefined;

  await resend.emails.send({
    from: EMAIL_ADDRESS,
    to,
    subject: `Welcome to ${APP_NAME}!`,
    react: (
      <BookingEmail
        username={name}
        date={date.toDateString()}
        bookingDateISO={date.toISOString()}
        bookingType={bookingType}
        numberOfPeople={numberOfPeople}
        numberOfKids={numberOfKids}
        totalPriceCents={totalPriceCents}
        bookingUrl={bookingUrl}
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
) {
  const staffEmails = serviceToStaffEmails[service];
  if (!staffEmails?.length) return;

  const subject =
    service === "kitesurfing-course"
      ? `Kitesurf booking at ${date.toDateString()}`
      : `New booking: ${customerName} — ${service}`;

  await resend.emails.send({
    from: EMAIL_ADDRESS,
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
      />
    ),
  });
}

export async function sendRegistrationEmail(to: string, name: string) {
  await resend.emails.send({
    from: EMAIL_ADDRESS,
    to,
    subject: `Welcome to ${APP_NAME}!`,
    react: <RegistrationEmail username={name} />,
  });
}
