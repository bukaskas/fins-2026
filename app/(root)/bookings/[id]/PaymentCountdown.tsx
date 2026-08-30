"use client";

import * as React from "react";
import { Clock } from "lucide-react";

/**
 * Live "cancels in …" countdown for a WAITING_PAYMENT booking. Reads from the
 * absolute `deadline` so it stays correct across refreshes; ticks every second.
 */
export default function PaymentCountdown({ deadline }: { deadline: string }) {
  const deadlineMs = React.useMemo(
    () => new Date(deadline).getTime(),
    [deadline],
  );
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = deadlineMs - now;

  if (!Number.isFinite(deadlineMs)) return null;

  if (remaining <= 0) {
    return (
      <div
        role="alert"
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#FBE3E1] px-4 py-2 ring-1 ring-[#F1C0BB]"
      >
        <Clock className="h-3.5 w-3.5 text-[#7E2A23]" strokeWidth={1.8} aria-hidden="true" />
        <span className="font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.06em] font-[600] text-[#7E2A23]">
          Time elapsed — this booking is being canceled
        </span>
      </div>
    );
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Above an hour: "23h 41m". Under an hour, surface seconds: "41m 05s".
  const label =
    hours > 0
      ? `${hours}h ${String(minutes).padStart(2, "0")}m`
      : `${minutes}m ${String(seconds).padStart(2, "0")}s`;

  // Turn urgent (amber → red) in the final hour.
  const urgent = hours < 1;
  const bg = urgent ? "#FBE3E1" : "#FFF4E0";
  const ring = urgent ? "#F1C0BB" : "#F2D9A6";
  const fg = urgent ? "#7E2A23" : "#7A5414";

  return (
    <div
      role="timer"
      aria-label={`Payment deadline: cancels in ${label}`}
      className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 ring-1"
      style={{ background: bg, borderColor: ring, boxShadow: `inset 0 0 0 1px ${ring}` }}
    >
      <Clock className="h-3.5 w-3.5" strokeWidth={1.8} style={{ color: fg }} aria-hidden="true" />
      <span
        aria-hidden="true"
        className="font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.06em] font-[600]"
        style={{ color: fg }}
      >
        Cancels in{" "}
        <span className="font-[family-name:var(--font-roboto-mono)] tabular-nums">
          {label}
        </span>
      </span>
    </div>
  );
}
