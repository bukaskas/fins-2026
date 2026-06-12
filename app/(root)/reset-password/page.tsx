import { Suspense } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = {
  title: "Reset password — Fins kitesurfing",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
