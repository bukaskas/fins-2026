import { NextResponse } from "next/server";

import { cancelExpiredWaitingPayments } from "@/lib/actions/booking.actions";

// Cancels bookings whose 24h WAITING_PAYMENT window has elapsed.
//
// Wire any scheduler to call this on an interval (e.g. hourly):
//   GET ${SERVER_URL}/api/cron/cancel-expired-bookings
//   Authorization: Bearer ${CRON_SECRET}
//
// On-read cancellation (in getBookingById/getAllBookings) is the primary
// guarantee; this endpoint is the belt-and-suspenders path for when no one
// opens a page. If CRON_SECRET is unset, the endpoint is open (dev convenience).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const canceled = await cancelExpiredWaitingPayments();
    return NextResponse.json({ ok: true, canceled });
  } catch (error) {
    console.error("[cron] cancel-expired-bookings failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
