"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { CommissionStatus } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  status?: CommissionStatus | "ALL";
};

export function CommissionsFilters({ status }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setStatus(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") params.delete("status");
    else params.set("status", value);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Status</span>
      <Select value={status ?? "ALL"} onValueChange={setStatus}>
        <SelectTrigger className="h-8 w-32 rounded-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value={CommissionStatus.PENDING}>Pending</SelectItem>
            <SelectItem value={CommissionStatus.PAID}>Paid</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
