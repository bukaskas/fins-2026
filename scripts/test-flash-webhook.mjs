// Test the Flash payment webhook by sending a correctly-signed POST.
//
// Usage:
//   node scripts/test-flash-webhook.mjs                 # safe: fake booking, ignored path
//   node scripts/test-flash-webhook.mjs <url>           # override target URL
//   node scripts/test-flash-webhook.mjs <url> succeeded <realBookingId>   # ⚠ mutates that booking
//
// The signature algorithm mirrors lib/flash.ts:
//   flatten(payload) -> drop null/undefined/"" -> sort keys -> "k=v,k=v" -> HMAC-SHA256 hex.
import crypto from "crypto";
import fs from "fs";
import path from "path";

// --- load FLASH_WEBHOOK_SECRET from .env (no dotenv dependency) ---
function loadEnv() {
  const env = {};
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      env[m[1]] = v;
    }
  } catch {}
  return env;
}

const env = loadEnv();
const secret = process.env.FLASH_WEBHOOK_SECRET || env.FLASH_WEBHOOK_SECRET;
if (!secret) {
  console.error("FLASH_WEBHOOK_SECRET not found in env or .env");
  process.exit(1);
}

const url =
  process.argv[2] ||
  "https://www.finskitesurfing.com/api/payments/flash/webhook";
const status = process.argv[3] || "pending";
const aggregatorOrderId =
  process.argv[4] || `test-${crypto.randomUUID()}`; // fake by default

function flatten(obj, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      flatten(value, p, out);
    } else if (Array.isArray(value)) {
      out[p] = JSON.stringify(value);
    } else {
      out[p] = value;
    }
  }
  return out;
}

function buildCanonical(payload) {
  const flat = flatten(payload);
  return Object.keys(flat)
    .filter((k) => flat[k] !== null && flat[k] !== undefined && flat[k] !== "")
    .sort()
    .map((k) => `${k}=${flat[k]}`)
    .join(",");
}

const payload = {
  transactionId: `txn-${crypto.randomUUID()}`,
  aggregatorOrderId,
  status,
  PaidAmountCents: 5000,
  order: { id: "ord-test", amountCents: 5000, currency: "USD" },
};

const canonical = buildCanonical(payload);
const signature = crypto
  .createHmac("sha256", secret)
  .update(canonical, "utf-8")
  .digest("hex");

console.log("POST", url);
console.log("payload:", JSON.stringify(payload));
console.log("canonical:", canonical);
console.log("signature:", signature);

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json", signature },
  body: JSON.stringify(payload),
});
console.log("\n<-- HTTP", res.status, res.statusText);
console.log(await res.text());
