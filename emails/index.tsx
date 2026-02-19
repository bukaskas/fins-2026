import { Resend } from "resend";
import BookingEmail from "@/emails/emailTemplate";
const resend = new Resend(process.env.RESEND_API_KEY);
import { APP_NAME, EMAIL_ADDRESS } from "@/lib/constants";
import RegistrationEmail from "./registrationEmail";

export async function sendBookingEmail(to: string, name: string, date: Date) {
  await resend.emails.send({
    from: EMAIL_ADDRESS,
    to,
    subject: `Welcome to ${APP_NAME}!`,
    react: <BookingEmail username={name} date={date.toDateString()} />,
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
