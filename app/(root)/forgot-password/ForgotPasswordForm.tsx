"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";

import { requestPasswordReset } from "@/lib/actions/auth.actions";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      setSubmitted(true);
      if (result?.message) toast.success(result.message);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md border rounded-2xl p-6 shadow-sm bg-white">
        <h1 className="text-2xl font-semibold mb-2">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter your email and we&apos;ll send you a link to reset it.
        </p>

        {submitted ? (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              If an account exists for <span className="font-medium">{email}</span>,
              a password reset link is on its way. Check your inbox (and spam
              folder).
            </p>
            <Link
              href="/signin"
              className="inline-block text-sm underline underline-offset-4 text-primary"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 rounded-full bg-black text-white py-2 text-sm font-medium disabled:opacity-60"
            >
              {isSubmitting ? "Sending..." : "Send reset link"}
            </button>

            <p className="mt-4 text-sm text-muted-foreground">
              Remembered it?{" "}
              <Link
                href="/signin"
                className="underline underline-offset-4 text-primary"
              >
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
