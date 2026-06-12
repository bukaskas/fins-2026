import Link from "next/link";

import { verifyEmail } from "@/lib/actions/auth.actions";

export const metadata = {
  title: "Verify email — Fins kitesurfing",
};

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const result = token
    ? await verifyEmail(token)
    : { success: false as const, message: "Missing verification token." };

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md border rounded-2xl p-6 shadow-sm bg-white text-center">
        <h1 className="text-2xl font-semibold mb-2">
          {result.success ? "Email verified" : "Verification failed"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">{result.message}</p>

        <Link
          href={result.success ? "/" : "/signin"}
          className="inline-block rounded-full bg-black text-white px-6 py-2 text-sm font-medium"
        >
          {result.success ? "Continue" : "Back to sign in"}
        </Link>
      </div>
    </main>
  );
}
