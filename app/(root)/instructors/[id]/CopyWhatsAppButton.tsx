"use client";

import { useState } from "react";
import { getInstructorCommissions } from "@/lib/actions/commission.actions";
import { COMMISSION_TYPE_LABELS, formatEGP } from "@/lib/commission";
import { CommissionStatus } from "@prisma/client";
import { format } from "date-fns";

type Props = {
  instructorId: string;
  instructorName: string | null;
  from: string;
  to: string;
};

export function CopyWhatsAppButton({ instructorId, instructorName, from, to }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "copied">("idle");

  async function handleCopy() {
    setState("loading");
    try {
      const { rows, totals } = await getInstructorCommissions(instructorId, {
        from: new Date(`${from}T00:00:00.000Z`),
        to: new Date(`${to}T23:59:59.999Z`),
        status: CommissionStatus.PENDING,
      });

      const lines: string[] = [];
      lines.push(`*Commission Summary — ${instructorName ?? "Instructor"}*`);
      lines.push(`Period: ${format(new Date(`${from}T00:00:00Z`), "d MMM")} – ${format(new Date(`${to}T00:00:00Z`), "d MMM yyyy")}`);
      lines.push("");

      if (rows.length === 0) {
        lines.push("No outstanding commissions for this period.");
      } else {
        for (const r of rows) {
          const startsAt = new Date(r.session.startsAt);
          const endsAt = new Date(r.session.endsAt);
          const h = Math.floor(r.durationMinutes / 60);
          const m = r.durationMinutes % 60;
          const dur = h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
          const type = COMMISSION_TYPE_LABELS[r.commissionType];
          const time = `${format(startsAt, "HH:mm")}–${format(endsAt, "HH:mm")}`;
          const date = format(startsAt, "d MMM");
          const amount = formatEGP(r.finalAmountCents);
          lines.push(`• ${date} | ${time} | ${dur} | ${type} | ${amount}`);
        }

        lines.push("");
        lines.push(`*Total: ${formatEGP(totals.pending.cents)}* (${totals.pending.count} session${totals.pending.count !== 1 ? "s" : ""})`);
      }

      await navigator.clipboard.writeText(lines.join("\n"));
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      onClick={handleCopy}
      disabled={state === "loading"}
      className="rounded border px-3 py-1.5 text-sm hover:bg-muted/40 transition-colors disabled:opacity-50"
    >
      {state === "copied" ? "Copied!" : state === "loading" ? "Copying…" : "Copy for WhatsApp"}
    </button>
  );
}
