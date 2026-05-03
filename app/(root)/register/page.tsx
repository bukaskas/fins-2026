import { searchUser } from "@/lib/actions/user.actions";
import { UserResultCard } from "@/components/register/user-result-card";
import { AddGuestDialog } from "@/components/register/AddGuestDialog";

type RegisterPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const users = q ? await searchUser(q) : [];

  return (
    <div className="min-h-screen bg-[#faf9f7]">

      {/* ── Header ── */}
      <div className="bg-white border-b border-[#ece8e3]">
        <div className="max-w-4xl mx-auto px-6 pt-8 pb-6">

          <p className="font-[family-name:var(--font-raleway)] text-[0.62rem] tracking-[0.32em] uppercase font-[600] text-[#8a8480] mb-2">
            Admin · Kitesurfing
          </p>

          <h1 className="font-[family-name:var(--font-raleway)] text-[clamp(2rem,5vw,3rem)] font-[100] tracking-[-0.02em] text-[#1a1614] leading-none">
            Register Desk
          </h1>

          <p className="mt-2 font-[family-name:var(--font-raleway)] text-[0.8rem] text-[#8a8480]">
            Search guest by name and add any kite service
          </p>

          <div className="mt-6 flex gap-2">
            <form method="GET" className="flex flex-1 gap-2">
              <input
                type="text"
                name="q"
                defaultValue={q}
                autoFocus
                placeholder="Search by name, email or phone…"
                className="flex-1 border border-[#ece8e3] rounded-xl px-4 py-2.5 text-sm text-[#1a1614] bg-white placeholder:text-[#b0a89f] font-[family-name:var(--font-raleway)] focus:outline-none focus:border-[#1a1614] transition-colors"
              />
              <button
                type="submit"
                className="bg-[#1a1614] text-white font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.14em] uppercase font-[700] px-5 py-2.5 rounded-xl hover:bg-[#2a2420] transition-colors shrink-0"
              >
                Search
              </button>
            </form>
            <AddGuestDialog />
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {!q ? (
          <p className="font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.2em] uppercase text-[#b0a89f] text-center py-16">
            Type a guest name to start
          </p>
        ) : users.length === 0 ? (
          <p className="font-[family-name:var(--font-raleway)] text-[0.75rem] tracking-[0.2em] uppercase text-[#b0a89f] text-center py-16">
            No guests found for &ldquo;{q}&rdquo;
          </p>
        ) : (
          <>
            <p className="font-[family-name:var(--font-raleway)] text-[0.62rem] tracking-[0.28em] uppercase font-[500] text-[#8a8480] mb-3 pl-1">
              {users.length} {users.length === 1 ? "guest" : "guests"} found
            </p>
            <div className="space-y-2">
              {users.map((u) => (
                <UserResultCard key={u.id} user={u} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
