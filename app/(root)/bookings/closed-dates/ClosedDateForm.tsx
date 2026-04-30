"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { addClosedDate, removeClosedDate } from "@/lib/actions/closedDate.actions";
import type { ClosedDate } from "@prisma/client";

export function ClosedDateForm({ closedDates }: { closedDates: ClosedDate[] }) {
  const router = useRouter();
  const [date, setDate] = React.useState<Date | undefined>();
  const [reason, setReason] = React.useState("");
  const [calOpen, setCalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  async function handleAdd() {
    if (!date) return;
    setSaving(true);
    const result = await addClosedDate(date, reason.trim() || undefined);
    setSaving(false);
    if (result.success) {
      toast.success("Date closed");
      setDate(undefined);
      setReason("");
      router.refresh();
    } else {
      toast.error(result.message);
    }
  }

  async function handleRemove(closedDate: ClosedDate) {
    setRemovingId(closedDate.id);
    const result = await removeClosedDate(new Date(closedDate.date));
    setRemovingId(null);
    if (result.success) {
      toast.success("Date re-opened");
      router.refresh();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div className="space-y-10">
      {/* ── Closed dates list ── */}
      {closedDates.length === 0 ? (
        <p className="font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.2em] uppercase text-[#b0a89f]">
          No upcoming closed dates
        </p>
      ) : (
        <div className="space-y-px">
          {closedDates.map((cd) => (
            <div
              key={cd.id}
              className="flex items-center justify-between bg-white border border-[#ece8e3] px-5 py-3"
            >
              <div className="flex items-center gap-6">
                <span className="font-[family-name:var(--font-raleway)] font-[600] text-sm text-[#1a1614]">
                  {format(new Date(cd.date), "EEE, MMM d, yyyy")}
                </span>
                {cd.reason && (
                  <span className="text-[0.7rem] text-[#8a8480] italic">{cd.reason}</span>
                )}
              </div>
              <button
                onClick={() => handleRemove(cd)}
                disabled={removingId === cd.id}
                className="text-[0.62rem] tracking-[0.18em] uppercase font-[600] font-[family-name:var(--font-raleway)] text-[#ef4444] hover:text-red-700 disabled:opacity-40 transition-colors"
              >
                {removingId === cd.id ? "Removing…" : "Re-open"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Add new closed date ── */}
      <div className="bg-white border border-[#ece8e3] p-6 space-y-4">
        <p className="font-[family-name:var(--font-raleway)] text-[0.62rem] tracking-[0.32em] uppercase font-[600] text-[#8a8480]">
          Close a date
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start font-normal w-52">
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setCalOpen(false);
                }}
                disabled={{ before: new Date() }}
              />
            </PopoverContent>
          </Popover>

          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1"
          />

          <Button onClick={handleAdd} disabled={!date || saving}>
            {saving ? "Closing…" : "Close Date"}
          </Button>
        </div>
      </div>
    </div>
  );
}
