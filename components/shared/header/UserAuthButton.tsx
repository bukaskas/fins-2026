"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserIcon } from "lucide-react";

type Props = {
  session: any;
  className?: string;
  /** Icon-only below xl, where the desktop header row is tight. */
  compact?: boolean;
};

export function UserAuthButton({ session, className, compact = false }: Props) {
  const text = (label: string) =>
    compact ? <span className="sr-only xl:not-sr-only">{label}</span> : label;
  const icon = compact ? "xl:mr-2" : "mr-2";

  if (session?.user) {
    return (
      <Button
        type="button"
        variant="ghost"
        className={className}
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <UserIcon className={icon} aria-hidden="true" /> {text("Logout")}
      </Button>
    );
  }

  return (
    <Button asChild variant="ghost" className={className}>
      <Link href="/signin">
        <UserIcon className={icon} aria-hidden="true" /> {text("Sign In")}
      </Link>
    </Button>
  );
}
