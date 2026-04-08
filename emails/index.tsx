import { Resend } from "resend";
import BookingEmail from "@/emails/emailTemplate";
const resend = new Resend(process.env.RESEND_API_KEY);
import { APP_NAME, EMAIL_ADDRESS, STAFF_EMAILS } from "@/lib/constants";
import RegistrationEmail from "./registrationEmail";
import StaffNotificationEmail from "./staffNotificationEmail";

export async function sendBookingEmail(to: string, name: string, date: Date, bookingType?: string) {
  await resend.emails.send({
    from: EMAIL_ADDRESS,
    to,
    subject: `Welcome to ${APP_NAME}!`,
    react: <BookingEmail username={name} date={date.toDateString()} bookingType={bookingType} />,
  });
}

const serviceToStaffEmail: Record<string, string> = {
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
) {
  const staffEmail = serviceToStaffEmail[service];
  if (!staffEmail) return;

  await resend.emails.send({
    from: EMAIL_ADDRESS,
    to: staffEmail,
    subject: `New booking: ${customerName} — ${service}`,
    react: (
      <StaffNotificationEmail
        customerName={customerName}
        customerEmail={customerEmail}
        customerPhone={customerPhone}
        date={date.toDateString()}
        service={service}
        numberOfPeople={numberOfPeople}
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
