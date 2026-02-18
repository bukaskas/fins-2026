import { searchUser } from "@/lib/actions/user.actions";
import { UserResultCard } from "@/components/register/user-result-card";

type RegisterPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const users = q ? await searchUser(q) : [];

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Register Desk</h1>

      <form method="GET" className="mb-6 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name, email, phone"
          className="w-full rounded border px-3 py-2"
        />
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Search
        </button>
      </form>

      {!q ? (
        <p className="text-sm text-muted-foreground">
          Type a guest name to start.
        </p>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No guests found.</p>
      ) : (
        <div className="grid gap-3">
          {users.map((u) => (
            <UserResultCard key={u.id} user={u} />
          ))}
        </div>
      )}
    </main>
  );
}
