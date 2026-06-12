"use server";

import bcryptjs from "bcryptjs";
import { getServerSession } from "next-auth/next";

import { prisma } from "@/db/prisma";
import { authOptions } from "@/lib/auth";
import { generateToken, hashToken } from "@/lib/tokens";
import { SERVER_URL } from "@/lib/constants";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/emails";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Generic response that never reveals whether an email is registered.
const GENERIC_RESET_MESSAGE =
  "If an account exists for that email, we've sent a password reset link.";

/* -------------------------------------------------------------------------- */
/*  Password reset                                                            */
/* -------------------------------------------------------------------------- */

export async function requestPasswordReset(email: string) {
  const normalized = email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, name: true, email: true },
    });

    if (user) {
      // Invalidate any outstanding reset tokens for this user.
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

      const rawToken = generateToken();
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(rawToken),
          expires: new Date(Date.now() + RESET_TTL_MS),
        },
      });

      const resetUrl = `${SERVER_URL}/reset-password?token=${rawToken}`;
      await sendPasswordResetEmail(user.email, user.name || "", resetUrl);
    }
  } catch (error) {
    // Log but still return the generic message so failures don't leak state.
    console.error("[requestPasswordReset] error:", error);
  }

  return { success: true as const, message: GENERIC_RESET_MESSAGE };
}

export async function resetPassword(token: string, newPassword: string) {
  if (!token || newPassword.length < 8) {
    return {
      success: false as const,
      message: "Invalid request. Please check your link and password.",
    };
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, expires: true, usedAt: true },
  });

  if (!record || record.usedAt || record.expires < new Date()) {
    return {
      success: false as const,
      message: "This reset link is invalid or has expired. Please request a new one.",
    };
  }

  const hashedPassword = await bcryptjs.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { password: hashedPassword },
    }),
    // Mark this token used and clear the rest for the account.
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId, usedAt: null },
    }),
  ]);

  return {
    success: true as const,
    message: "Your password has been reset. You can now sign in.",
  };
}

/* -------------------------------------------------------------------------- */
/*  Email verification                                                        */
/* -------------------------------------------------------------------------- */

// Internal: issue a fresh verification token for a user and email the link.
// Stored in the NextAuth `VerificationToken` table, namespaced by user id.
async function issueVerification(user: {
  id: string;
  email: string;
  name: string | null;
}) {
  await prisma.verificationToken.deleteMany({ where: { identifier: user.id } });

  const rawToken = generateToken();
  await prisma.verificationToken.create({
    data: {
      identifier: user.id,
      token: hashToken(rawToken),
      expires: new Date(Date.now() + VERIFY_TTL_MS),
    },
  });

  const verifyUrl = `${SERVER_URL}/verify-email?token=${rawToken}`;
  await sendVerificationEmail(user.email, user.name || "", verifyUrl);
}

/**
 * Send a verification email to a user by id, but only if they are still
 * unverified. Called right after self-signup. Safe to be a no-op for already
 * verified or missing accounts.
 */
export async function issueEmailVerificationForUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, emailVerified: true },
    });
    if (!user || user.emailVerified) return;
    await issueVerification(user);
  } catch (error) {
    console.error("[issueEmailVerificationForUser] error:", error);
  }
}

export async function verifyEmail(token: string) {
  if (!token) {
    return { success: false as const, message: "Missing verification token." };
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token: hashToken(token) },
  });

  if (!record || record.expires < new Date()) {
    if (record) {
      await prisma.verificationToken.delete({ where: { token: record.token } });
    }
    return {
      success: false as const,
      message: "This verification link is invalid or has expired.",
    };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.identifier },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier },
    }),
  ]);

  return { success: true as const, message: "Your email has been verified." };
}

export async function resendVerification() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return { success: false as const, message: "You must be signed in." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, emailVerified: true },
  });
  if (!user) {
    return { success: false as const, message: "Account not found." };
  }
  if (user.emailVerified) {
    return { success: true as const, message: "Your email is already verified." };
  }

  try {
    await issueVerification(user);
  } catch (error) {
    console.error("[resendVerification] error:", error);
    return {
      success: false as const,
      message: "Could not send the verification email. Please try again.",
    };
  }

  return {
    success: true as const,
    message: "Verification email sent. Check your inbox.",
  };
}
