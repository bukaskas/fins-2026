import crypto from "crypto";

/**
 * Flash Payment API client.
 *
 * Docs: docs/payment-link.md
 *
 * The same REST API serves both "flash" and "instapay" — only the integration
 * id differs (see the headline note in the docs). We therefore use POST /v1/orders
 * for both products and switch `integrationId` based on the chosen product.
 */

export type FlashProduct = "flash" | "instapay";

type FlashConfig = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  flashIntegrationId: string;
  instapayIntegrationId: string;
  webhookSecret: string;
  defaultProduct: FlashProduct;
  merchantName?: string;
};

function getConfig(): FlashConfig {
  const baseUrl = process.env.FLASH_BASE_URL || "https://stg-api.useflash.app";
  const clientId = process.env.FLASH_CLIENT_ID ?? "";
  const clientSecret = process.env.FLASH_CLIENT_SECRET ?? "";
  const flashIntegrationId = process.env.FLASH_INTEGRATION_ID ?? "";
  const instapayIntegrationId = process.env.FLASH_INSTAPAY_INTEGRATION_ID ?? "";
  const webhookSecret = process.env.FLASH_WEBHOOK_SECRET ?? "";
  const defaultProduct =
    process.env.FLASH_PRODUCT === "instapay" ? "instapay" : "flash";
  const merchantName = process.env.FLASH_MERCHANT_NAME || undefined;

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    clientId,
    clientSecret,
    flashIntegrationId,
    instapayIntegrationId,
    webhookSecret,
    defaultProduct,
    merchantName,
  };
}

export class FlashError extends Error {
  code?: string;
  status?: number;
  constructor(message: string, opts?: { code?: string; status?: number }) {
    super(message);
    this.name = "FlashError";
    this.code = opts?.code;
    this.status = opts?.status;
  }
}

// ---------------------------------------------------------------------------
// Access token (cached in-memory with expiry + skew)
// ---------------------------------------------------------------------------

let cachedToken: { value: string; expiresAt: number } | null = null;
const TOKEN_SKEW_MS = 60_000; // refetch 60s before expiry

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - TOKEN_SKEW_MS) {
    return cachedToken.value;
  }

  const cfg = getConfig();
  if (!cfg.clientId || !cfg.clientSecret) {
    throw new FlashError("Flash credentials are not configured.");
  }

  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString(
    "base64"
  );

  const res = await fetch(`${cfg.baseUrl}/v1/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${basic}`,
    },
  });

  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new FlashError(
      data.error_description || data.error || "Failed to obtain Flash token.",
      { code: data.error, status: res.status }
    );
  }

  const expiresInMs = (data.expires_in ?? 3600) * 1000;
  cachedToken = { value: data.access_token, expiresAt: Date.now() + expiresInMs };
  return cachedToken.value;
}

// ---------------------------------------------------------------------------
// Create a payment order
// ---------------------------------------------------------------------------

export type CreatePaymentOrderInput = {
  /** Used as aggregatorOrderId (must be unique per order). */
  aggregatorOrderId: string;
  amountCents: number;
  currency: string;
  product?: FlashProduct;
  customer?: { name?: string; phone?: string };
  /** Link validity in seconds. */
  validity?: number;
  branch?: string;
};

export type CreatePaymentOrderResult = {
  flashOrderId: string;
  paymentLink: string;
  raw: unknown;
};

export async function createPaymentOrder(
  input: CreatePaymentOrderInput
): Promise<CreatePaymentOrderResult> {
  const cfg = getConfig();
  const product = input.product ?? cfg.defaultProduct;
  const integrationId =
    product === "instapay" ? cfg.instapayIntegrationId : cfg.flashIntegrationId;

  if (!integrationId) {
    throw new FlashError(
      `Flash integration id for product "${product}" is not configured.`
    );
  }

  const token = await getAccessToken();

  const body: Record<string, unknown> = {
    integrationId: Number.isNaN(Number(integrationId))
      ? integrationId
      : Number(integrationId),
    aggregatorOrderId: input.aggregatorOrderId,
    amountCents: input.amountCents,
    currency: input.currency,
    webEnabled: true,
  };
  if (cfg.merchantName) body.merchantName = cfg.merchantName;
  if (input.branch) body.branch = input.branch;
  if (input.validity) body.validity = input.validity;
  if (input.customer && (input.customer.name || input.customer.phone)) {
    body.customer = input.customer;
  }

  const res = await fetch(`${cfg.baseUrl}/v1/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as {
    order?: { id?: string };
    paymentLink?: string;
    error?: { code?: string; message?: string };
  };

  if (!res.ok || !data.paymentLink || !data.order?.id) {
    throw new FlashError(
      data.error?.message || `Flash order creation failed (HTTP ${res.status}).`,
      { code: data.error?.code, status: res.status }
    );
  }

  return {
    flashOrderId: data.order.id,
    paymentLink: data.paymentLink,
    raw: data,
  };
}

// ---------------------------------------------------------------------------
// Retrieve order status (reconciliation / webhook fallback)
// ---------------------------------------------------------------------------

export type FlashOrder = {
  id?: string;
  aggregatorOrderId?: string;
  amountCents?: number;
  currency?: string;
  status?: string;
  raw: unknown;
};

/** GET /v1/orders/aggregator/{aggregatorOrderId} — live order status from Flash. */
export async function getFlashOrder(
  aggregatorOrderId: string
): Promise<FlashOrder> {
  const cfg = getConfig();
  const token = await getAccessToken();

  const res = await fetch(
    `${cfg.baseUrl}/v1/orders/aggregator/${encodeURIComponent(
      aggregatorOrderId
    )}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = (await res.json().catch(() => ({}))) as {
    id?: string;
    aggregatorOrderId?: string;
    amountCents?: number;
    currency?: string;
    status?: string;
    error?: { code?: string; message?: string };
  };

  if (!res.ok) {
    throw new FlashError(
      data.error?.message || `Failed to fetch Flash order (HTTP ${res.status}).`,
      { code: data.error?.code, status: res.status }
    );
  }

  return {
    id: data.id,
    aggregatorOrderId: data.aggregatorOrderId,
    amountCents: data.amountCents,
    currency: data.currency,
    status: data.status,
    raw: data,
  };
}

// ---------------------------------------------------------------------------
// Webhook signature verification (HMAC-SHA256)
// ---------------------------------------------------------------------------

/**
 * Flatten a nested object into dot-path keys, e.g. { order: { id: 1 } } -> { "order.id": 1 }.
 * Arrays are JSON-stringified (the documented webhook payload contains no arrays).
 */
function flatten(
  obj: Record<string, unknown>,
  prefix = "",
  out: Record<string, unknown> = {}
): Record<string, unknown> {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      flatten(value as Record<string, unknown>, path, out);
    } else if (Array.isArray(value)) {
      out[path] = JSON.stringify(value);
    } else {
      out[path] = value;
    }
  }
  return out;
}

/**
 * Build the canonical "key=value,key=value" string per the docs:
 * flatten -> omit empty values -> sort keys alphabetically -> join.
 *
 * NOTE: the docs instruct a *generic* implementation that includes every
 * non-empty field so new fields don't break the signature. Their illustrative
 * example omitted a few fields (channelId, PaidAmountCents, AdditionalInfo);
 * if Flash's real signature diverges, this is the single place to adjust.
 * Validate against a real webhook during testing.
 */
export function buildCanonicalPayloadString(
  payload: Record<string, unknown>
): string {
  const flat = flatten(payload);
  return Object.keys(flat)
    .filter((k) => {
      const v = flat[k];
      return v !== null && v !== undefined && v !== "";
    })
    .sort()
    .map((k) => `${k}=${flat[k]}`)
    .join(",");
}

export function computeWebhookSignature(payload: Record<string, unknown>): string {
  const cfg = getConfig();
  if (!cfg.webhookSecret) {
    throw new FlashError("Flash webhook secret is not configured.");
  }
  const canonical = buildCanonicalPayloadString(payload);
  return crypto
    .createHmac("sha256", cfg.webhookSecret)
    .update(canonical, "utf-8")
    .digest("hex");
}

export function verifyWebhookSignature(
  payload: Record<string, unknown>,
  signature: string | null | undefined
): boolean {
  if (!signature) return false;
  let expected: string;
  try {
    expected = computeWebhookSignature(payload);
  } catch {
    return false;
  }
  const a = Buffer.from(expected, "utf-8");
  const b = Buffer.from(signature, "utf-8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
