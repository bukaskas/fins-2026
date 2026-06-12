import "server-only";

import bcryptjs from "bcryptjs";

/** Hash a plaintext password for storage. */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcryptjs.hash(plainPassword, 10);
}

/** Constant-time compare of a plaintext password against a stored hash. */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcryptjs.compare(plainPassword, hashedPassword);
}
