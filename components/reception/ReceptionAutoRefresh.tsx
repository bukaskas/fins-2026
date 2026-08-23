"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

const REFRESH_INTERVAL_MS = 60_000;

function relativeAge(date: Date, now: number): string {
  const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}

export function ReceptionAutoRefresh({ generatedAt }: { generatedAt: string }) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  const generated = new Date(generatedAt);

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 10_000);
    const refreshTimer = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(refreshTimer);
    };
  }, [refresh]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#5B6B7C]" aria-live="polite">
        Updated {relativeAge(generated, now)}
      </span>
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        onClick={refresh}
        disabled={isRefreshing}
        aria-label="Refresh reception dashboard"
        className="size-10 rounded-xl border-[#8898aa]/35 bg-[#E3EBF3] sm:size-9"
      >
        <RefreshCw className={isRefreshing ? "animate-spin" : undefined} />
      </Button>
    </div>
  );
}
