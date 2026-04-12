import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function BookingGuidePage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session) {
    redirect("/signin");
  }

  if (role !== "ADMIN") {
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Guest Booking Process</h1>
        <p className="text-muted-foreground">
          Standard Operating Procedure — end-to-end booking workflow for Fins
          Beach Club.
        </p>
      </header>

      {/* Overview */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Overview</h2>
        <p>
          This document describes the booking workflow from the moment a guest
          submits a reservation request on the website to the point where staff
          confirm or decline it.
        </p>
      </section>

      {/* Step 1 */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">
          Step 1 — Guest Submits Booking Form
        </h2>
        <p>The guest fills out the booking form on the website, providing:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Name, email, and phone number</strong>
          </li>
          <li>
            <strong>Service</strong> — e.g. kitesurfing lesson, day use, etc.
          </li>
          <li>
            <strong>Date</strong> and preferred <strong>time</strong>
          </li>
          <li>
            <strong>Number of people</strong>
          </li>
          <li>
            Optionally: preferred <strong>instructor</strong>
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          On submission, a Booking record is created with status{" "}
          <code className="bg-muted px-1 rounded">PENDING</code> and payment
          status <code className="bg-muted px-1 rounded">UNPAID</code>.
        </p>
      </section>

      {/* Step 2 */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">
          Step 2 — Guest Receives Confirmation Email
        </h2>
        <p>
          Immediately after submitting, the guest receives an automated email
          confirming their request has been received. The email includes:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>A summary of their booking details</li>
          <li>
            A note that the booking is <strong>pending staff review</strong>
          </li>
          <li>A contact phone number for questions</li>
          <li>A WhatsApp button for one-tap contact</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          The contact number must be staffed during advertised hours.
        </p>
      </section>

      {/* Step 3 */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">
          Step 3 — Staff Receives Booking Notification
        </h2>
        <p>Staff receive a notification email containing:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Guest name, email, and phone</li>
          <li>Requested service, date, time, and number of people</li>
          <li>
            A prompt to review the guest&apos;s social media profile before
            confirming
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Notifications are routed per service type — configure the destination
          address via environment variables (e.g.{" "}
          <code className="bg-muted px-1 rounded">STAFF_EMAIL_DAY_USE</code>,{" "}
          <code className="bg-muted px-1 rounded">
            STAFF_EMAIL_KITESURFING
          </code>
          ).
        </p>
      </section>

      {/* Step 4 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Step 4 — Staff Reviews Guest &amp; Confirms or Declines
        </h2>
        <p>Standard vetting steps:</p>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Check the guest&apos;s social media profile</li>
          <li>
            If the profile is private with no mutual connections,{" "}
            <strong>request a referral name</strong> rather than automatically
            declining
          </li>
          <li>
            Decide to <strong>Confirm</strong> or <strong>Decline</strong>
          </li>
        </ol>

        <div className="space-y-2">
          <h3 className="text-xl font-medium">Staff Action in the System</h3>
          <p>
            Navigate to <strong>Admin → Bookings</strong> (
            <code className="bg-muted px-1 rounded">/bookings</code>) and update
            the booking status:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-6 font-semibold">Action</th>
                  <th className="text-left py-2 pr-6 font-semibold">
                    Status set to
                  </th>
                  <th className="text-left py-2 font-semibold">Next step</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-6">Confirm</td>
                  <td className="py-2 pr-6">
                    <code className="bg-muted px-1 rounded">CONFIRMED</code>
                  </td>
                  <td className="py-2">Send confirmation message to guest</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-6">Decline</td>
                  <td className="py-2 pr-6">
                    <code className="bg-muted px-1 rounded">DECLINED</code>
                  </td>
                  <td className="py-2">
                    Send polite decline message to guest
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-6">Cancel later</td>
                  <td className="py-2 pr-6">
                    <code className="bg-muted px-1 rounded">CANCELED</code>
                  </td>
                  <td className="py-2">No further action needed</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-medium">Sample WhatsApp Messages</h3>

          <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
            <p className="text-sm font-semibold text-muted-foreground">
              Requesting social account
            </p>
            <p className="text-sm">
              Hi [Guest Name], thank you for your booking request at Fins Beach
              Club! Could you please share your Instagram or Facebook profile so
              we can complete your reservation? Looking forward to welcoming
              you!
            </p>
          </div>

          <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
            <p className="text-sm font-semibold text-muted-foreground">
              Booking confirmed
            </p>
            <p className="text-sm">
              Hi [Guest Name], great news — your booking at Fins Beach Club is
              confirmed for [Date] at [Time]. Please arrive 15 minutes early.
              See you soon! Any questions, reach us at +20 XXX XXX XXXX.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
            <p className="text-sm font-semibold text-muted-foreground">
              Booking declined
            </p>
            <p className="text-sm">
              Hi [Guest Name], thank you for your interest in Fins Beach Club.
              Unfortunately we&apos;re unable to accommodate your request on
              this occasion. We hope to welcome you in the future!
            </p>
          </div>
        </div>
      </section>

      {/* Process overview */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Process Overview</h2>
        <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto leading-relaxed">
          {`Guest fills form
       ↓
Booking created (PENDING / UNPAID)
       ↓
Guest receives confirmation email
       ↓
Staff receive notification
       ↓
Staff reviews guest profile
       ↓
    ┌──────────────────────┐
    │                      │
CONFIRMED              DECLINED
    │                      │
Send confirmation      Send decline
message to guest       message to guest`}
        </pre>
      </section>

      {/* Notes */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Notes &amp; Customisation</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Replace all placeholder values in square brackets (e.g.{" "}
            <code className="bg-muted px-1 rounded">[Guest Name]</code>,{" "}
            <code className="bg-muted px-1 rounded">+20 XXX XXX XXXX</code>)
            before going live.
          </li>
          <li>
            The contact phone number in the guest email must be staffed during
            the advertised hours.
          </li>
          <li>
            Staff notification routing is configured via environment variables —
            one address per service type.
          </li>
          <li>
            A private social account with no mutual connections is{" "}
            <strong>not</strong> an automatic rejection — ask for a referral
            name if needed.
          </li>
          <li>
            Keep a log of confirmed, pending, and declined bookings to track
            patterns over time (Admin → Bookings).
          </li>
        </ul>
      </section>
    </main>
  );
}
