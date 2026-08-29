export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Fins kitesurfing center';
// Confirmed-people limit per day; reaching it auto-closes the date for bookings.
export const DAILY_CAPACITY = 80;
// Bookings rendered per page on /bookings before "Load more".
export const BOOKINGS_PAGE_SIZE = 100;
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Beautiful restaurant and kitesurfing center near Sokhna';
export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.finskitesurfing.com';
export const WHATSAPP_PHONE = '01222144388';
export const KITESURFING_BOOKING_URL = 'https://school.finskitesurfing.com/book';
export const EMAIL_ADDRESS = 'info@finskitesurfing.com';
function parseEmails(raw: string | undefined, fallback: string): string[] {
  const src = raw?.trim() || fallback;
  return src.split(",").map((e) => e.trim()).filter(Boolean);
}

export const STAFF_EMAILS = {
  kitesurfing: parseEmails(process.env.STAFF_EMAIL_KITESURFING, 'audriusb88@gmail.com'),
  dayUse: parseEmails(process.env.STAFF_EMAIL_DAY_USE, 'audriusb88@gmail.com',),
  restaurant: parseEmails(process.env.STAFF_EMAIL_RESTAURANT, 'audriusb88@gmail.com'),
};
// Visit hours shown on a confirmed booking page.
// Heads up: this string was hardcoded on the booking detail page as
// "9:30 am - 12 pm", which disagrees with the "9:00 AM - 11:00 PM" stated in
// the confirmation email (emails/emailTemplate.tsx) and on /day-use. The value
// is preserved verbatim here rather than silently changed - confirm which is
// correct, then fix it in this one place.
// How long a WAITING_PAYMENT booking is held before the cron sweep cancels
// it. The countdown, the server action and the guest card all read this.
export const WAITING_PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000;

export const VISIT_WORKING_HOURS = '9:30 am - 12 pm';

export const LOCATION_ADDRESS = 'https://www.google.com/maps/place/FINS+KITESURFING+CENTER/@29.20638,32.6224863,17z/data=!3m1!4b1!4m6!3m5!1s0x1456ef93d8c22eb3:0x5fcfdd85d2724c11!8m2!3d29.2063753!4d32.6250612!16s%2Fg%2F11ry1qxk47?entry=ttu&g_ep=EgoyMDI2MDEwNy4wIKXMDSoASAFQAw%3D%3D';
export const INSTAGRAM_URL = 'https://www.instagram.com/finskitesurfing/';
export const FACEBOOK_URL = 'https://www.facebook.com/finskitesurfingkaisokhna';
