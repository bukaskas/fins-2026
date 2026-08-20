import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { cancelExpiredWaitingPayments } from "@/lib/actions/booking.actions";

// Cancels bookings whose 24h WAITING_PAYMENT window has elapsed.
//
// Wire any scheduler to call this on an interval (e.g. hourly):
//   GET ${SERVER_URL}/api/cron/cancel-expired-bookings
//   Authorization: Bearer ${CRON_SECRET}
//
// This endpoint is the primary guarantee — it runs hourly (see vercel.json).
// The bookings list no longer sweeps on read: doing writes plus cache
// revalidation inside a render is unsupported in the App Router, so a booking
// can sit in WAITING_PAYMENT for up to an hour past its deadline before this
// flips it. In production CRON_SECRET is required; without it the endpoint
// refuses to run (open only as a dev convenience).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const canceled = await cancelExpiredWaitingPayments();
    if (canceled > 0) revalidatePath("/bookings", "layout");
    return NextResponse.json({ ok: true, canceled });
  } catch (error) {
    console.error("[cron] cancel-expired-bookings failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
