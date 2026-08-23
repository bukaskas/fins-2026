"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

function deadlineLabel(expiresAt: Date | null, now: number) {
  if (!expiresAt) return { label: "No payment deadline", urgent: false };
  const milliseconds = expiresAt.getTime() - now;
  if (milliseconds <= 0) return { label: "Payment expired", urgent: true };

  const hours = milliseconds / 3_600_000;
  if (hours < 1) {
    return { label: `${Math.max(1, Math.ceil(hours * 60))}m left`, urgent: true };
  }
  if (hours < 6) return { label: `${hours.toFixed(1)}h left`, urgent: true };
  return { label: `${Math.floor(hours)}h left`, urgent: false };
}

export function PaymentDeadline({ expiresAt }: { expiresAt: string | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const deadline = expiresAt ? new Date(expiresAt) : null;
  const state = deadlineLabel(deadline, now);

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ${
        state.urgent
          ? "bg-red-100 text-red-800"
          : "bg-violet-100 text-violet-800"
      }`}
    >
      <Clock3 className="size-3.5" aria-hidden="true" />
      {state.label}
    </span>
  );
}
