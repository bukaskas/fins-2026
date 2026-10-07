import type { BookingGroup } from "@prisma/client";
import { BOOKING_GROUP_META, bookingGroupLabel } from "@/lib/bookings/status";

/** Staff-only marker for event registrations, e.g. "Kai owner · Unit 12". */
export function GroupBadge({
  group,
  detail,
}: {
  group: BookingGroup | null | undefined;
  detail?: string | null;
}) {
  if (!group) return null;
  const meta = BOOKING_GROUP_META[group];
  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1.5 font-[family-name:var(--font-raleway)] text-[0.75rem] font-[700] uppercase tracking-[0.08em] sm:text-[0.68rem]"
      style={{ color: meta.text, background: meta.bg, borderColor: meta.ring }}
    >
      {bookingGroupLabel(group, detail)}
    </span>
  );
}
