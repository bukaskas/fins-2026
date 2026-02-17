import { Suspense } from "react";
import { SignInForm } from "./SignInForm";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading sign in…</div>}>
      <SignInForm />
    </Suspense>
  );
}
