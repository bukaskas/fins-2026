"use client";

import * as React from "react";
import { toast } from "sonner";

import { resendVerification } from "@/lib/actions/auth.actions";

export function ResendVerificationButton() {
  const [isSending, setIsSending] = React.useState(false);

  async function handleClick() {
    setIsSending(true);
    try {
      const result = await resendVerification();
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    } catch {
      toast.error("Could not send the verification email. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSending}
      className="underline underline-offset-2 font-medium disabled:opacity-60"
    >
      {isSending ? "Sending…" : "Resend verification email"}
    </button>
  );
}
