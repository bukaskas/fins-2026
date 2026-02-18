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
    <div className="rounded-md border p-4">
      <div className="mb-3">
        <div className="font-medium">{user.name || "Unnamed guest"}</div>
        <div className="text-sm text-muted-foreground">{user.email}</div>
        {user.phone ? (
          <div className="text-sm text-muted-foreground">{user.phone}</div>
        ) : null}
      </div>

      <div className="flex gap-2">
        <form action={quickAddBeachUse}>
          <input type="hidden" name="guestId" value={user.id} />
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white"
          >
            Add Beach Use
          </button>
        </form>
        <Link
          href={`/rentals/new?guestId=${user.id}`}
          className="rounded bg-slate-700 px-3 py-1.5 text-sm text-white"
        >
          Add Rental
        </Link>
        <Link
          href={`/lessons/new?guestId=${user.id}`}
          className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white"
        >
          Add Lesson
        </Link>
      </div>
    </div>
  );
}
