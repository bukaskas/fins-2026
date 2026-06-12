import "server-only";

import { randomBytes, createHash } from "crypto";

/**
 * Generate a high-entropy token (256 bits) to embed in a URL. The raw value is
 * emailed to the user and never stored; only its hash is persisted.
 */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Hash a token for storage / lookup. SHA-256 is appropriate here because the
 * input is already high-entropy random — no salting or slow hashing needed
 * (unlike user passwords, which use bcrypt).
 */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
