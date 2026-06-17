import { NextResponse } from "next/server";

import {
  verifyWebhookSignature,
  computeWebhookSignature,
} from "@/lib/flash";
import { recordFlashPayment } from "@/lib/actions/booking.actions";

const DEBUG = process.env.FLASH_WEBHOOK_DEBUG === "true";

// Quick reachability check — open this URL in a browser. A 200 here means the
// route is deployed and publicly reachable (it does NOT process payments).
export async function GET() {
  return NextResponse.json({ ok: true, route: "flash-webhook", method: "GET" });
}

// Flash posts payment transaction notifications here.
// Register this URL with Flash: `${NEXT_PUBLIC_SERVER_URL}/api/payments/flash/webhook`
export async function POST(req: Request) {
  // Unconditional hit log — proves Flash actually called us, even if the body
  // is unparseable or the signature is wrong. Remove once the integration is
  // confirmed working.
  const rawBody = await req.text();
  console.info("[flash-webhook] HIT", {
    time: new Date().toISOString(),
    headers: Object.fromEntries(req.headers.entries()),
    rawBody,
  });

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    console.warn("[flash-webhook] received non-JSON body");
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const signature = req.headers.get("signature");

  if (DEBUG) {
    let expected = "<error computing>";
    try {
      expected = computeWebhookSignature(payload);
    } catch (e) {
      expected = `<${e instanceof Error ? e.message : String(e)}>`;
    }
    console.info("[flash-webhook] incoming", {
      aggregatorOrderId: payload.aggregatorOrderId,
      transactionId: payload.transactionId,
      status: payload.status,
      receivedSignature: signature,
      expectedSignature: expected,
      signatureMatches: signature === expected,
    });
  }

  if (!verifyWebhookSignature(payload, signature)) {
    console.warn("[flash-webhook] signature verification failed", {
      aggregatorOrderId: payload.aggregatorOrderId,
      transactionId: payload.transactionId,
      hasSignatureHeader: Boolean(signature),
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const result = await recordFlashPayment(payload);
  if (DEBUG) console.info("[flash-webhook] result", result);

  // Only ask Flash to retry on unexpected failures. Handled, ignored, and
  // duplicate events return 200 so Flash stops retrying.
  if (!result.success && "retry" in result && result.retry) {
    return NextResponse.json({ error: result.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
