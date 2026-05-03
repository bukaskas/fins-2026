import { quickAddBeachUse } from "@/lib/actions/beach-visit.actions";
import Link from "next/link";

type UserResult = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
};

export function UserResultCard({ user }: { user: UserResult }) {
  return (
    <div className="rounded-2xl bg-white overflow-hidden shadow-[0_1px_6px_rgba(26,22,20,0.08)]">
      <div className="flex items-center min-h-[76px]">

        {/* Left accent strip */}
        <div className="w-[3px] self-stretch shrink-0 bg-[#c8b9a8]" />

        {/* Guest info */}
        <div className="flex-1 px-4 py-3.5 min-w-0 space-y-0.5">
          <p className="font-[family-name:var(--font-raleway)] font-[700] text-[0.92rem] text-[#1a1614] truncate">
            {user.name || "Unnamed guest"}
          </p>
          <p className="font-[family-name:var(--font-raleway)] text-[0.75rem] text-[#8a8480] truncate">
            {user.email}
          </p>
          {user.phone && (
            <p className="font-[family-name:var(--font-roboto)] text-[0.72rem] text-[#a09890] tabular-nums">
              {user.phone}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 px-4 shrink-0 flex-wrap justify-end">
          <form action={quickAddBeachUse}>
            <input type="hidden" name="guestId" value={user.id} />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-[#fef3c7] text-[#78350f] font-[family-name:var(--font-raleway)] text-[0.68rem] tracking-[0.08em] uppercase font-[700] hover:bg-[#fde68a] transition-colors"
            >
              Beach Use
            </button>
          </form>

          <Link
            href={`/rentals/new?guestId=${user.id}`}
            className="px-3.5 py-2 rounded-xl bg-[#eff6ff] text-[#1d4ed8] font-[family-name:var(--font-raleway)] text-[0.68rem] tracking-[0.08em] uppercase font-[700] hover:bg-[#dbeafe] transition-colors"
          >
            Rental
          </Link>

          <Link
            href={`/lessons/new?guestId=${user.id}`}
            className="px-3.5 py-2 rounded-xl bg-[#f0fdf4] text-[#166534] font-[family-name:var(--font-raleway)] text-[0.68rem] tracking-[0.08em] uppercase font-[700] hover:bg-[#dcfce7] transition-colors"
          >
            Lesson
          </Link>
        </div>

      </div>
    </div>
  );
}
