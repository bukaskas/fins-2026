"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserIcon } from "lucide-react";

type Props = {
  session: any;
  className?: string;
};

export function UserAuthButton({ session, className }: Props) {
  if (session?.user) {
    return (
      <Button
        type="button"
        variant="ghost"
        className={className}
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <UserIcon className="mr-2" /> Logout
      </Button>
    );
  }

  return (
    <Button asChild variant="ghost" className={className}>
      <Link href="/signin">
        <UserIcon className="mr-2" /> Sign In
      </Link>
    </Button>
  );
}
