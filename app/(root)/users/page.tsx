import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Role } from "@prisma/client";

import { listUsers } from "@/lib/actions/user.actions";
import { ADMIN_ROLES, requireRolePage } from "@/lib/auth-guard";
import { DeleteUserButton } from "@/components/users/DeleteUserButton";
import { ExportUsersButton } from "@/components/users/ExportUsersButton";

type Props = {
  searchParams: Promise<{ q?: string; role?: string }>;
};

const ROLE_VALUES = Object.values(Role);

function titleCase(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function buildHref(role: string | null, q: string): string {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `/users?${qs}` : "/users";
}

export default async function UsersPage({ searchParams }: Props) {
  await requireRolePage(ADMIN_ROLES);
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const activeRole = ROLE_VALUES.includes(params.role as Role)
    ? (params.role as Role)
    : undefined;

  const users = await listUsers(q, activeRole);

  return (
    <div className="min-h-screen bg-[#FBF8F3]">
      {/* soft beach ambience: layered pastel gradient washes */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60rem 40rem at 85% -10%, #E4F1FA 0%, transparent 60%), radial-gradient(50rem 38rem at -10% 110%, #FFE4D6 0%, transparent 55%), radial-gradient(40rem 30rem at 50% 50%, #FAF4E8 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-5xl px-5 pt-7 pb-20 sm:px-6 sm:pt-10">
        {/* header */}
        <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <span className="font-[family-name:var(--font-raleway)] text-[0.62rem] font-[600] uppercase tracking-[0.28em] text-[#b0a89f]">
              Directory
            </span>
            <h1
              className="mt-2 font-[family-name:var(--font-raleway)] font-[200] leading-[1.04] tracking-[-0.015em] text-[#1a1614]"
              style={{ fontSize: "clamp(2.1rem, 7vw, 3.25rem)" }}
            >
              Users
            </h1>
            <div className="mt-2 font-[family-name:var(--font-roboto-mono)] text-[0.68rem] uppercase tracking-[0.12em] text-[#b0a89f]">
              {users.length} {users.length === 1 ? "person" : "people"}
              {activeRole ? ` · ${titleCase(activeRole)}` : ""}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ExportUsersButton q={q} role={activeRole} />
            <Link
              href="/users/new"
              className="group inline-flex items-center gap-2 rounded-full bg-[#1a1614] px-5 py-2 text-white transition-all hover:-translate-y-px hover:bg-[#2a2522]"
            >
              <Plus className="size-3.5" strokeWidth={1.5} />
              <span className="font-[family-name:var(--font-raleway)] text-[0.68rem] font-[600] uppercase tracking-[0.18em]">
                New user
              </span>
            </Link>
          </div>
        </header>

        {/* search */}
        <form method="GET" className="mb-5">
          {activeRole && <input type="hidden" name="role" value={activeRole} />}
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#b0a89f]"
              strokeWidth={1.5}
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name, email, phone…"
              className="w-full rounded-full border border-[#ece8e3] bg-white/70 py-2.5 pl-11 pr-4 font-[family-name:var(--font-raleway)] text-[0.9rem] text-[#1a1614] backdrop-blur-sm outline-none transition-colors placeholder:text-[#b0a89f] focus:border-[#d6d0c8]"
            />
          </div>
        </form>

        {/* role filter chips */}
        <div className="mb-8 flex flex-wrap gap-2">
          <RoleChip
            href={buildHref(null, q)}
            label="All"
            active={!activeRole}
          />
          {ROLE_VALUES.map((role) => (
            <RoleChip
              key={role}
              href={buildHref(role, q)}
              label={titleCase(role)}
              active={activeRole === role}
            />
          ))}
        </div>

        {/* list */}
        <div className="overflow-hidden rounded-2xl border border-[#ece8e3] bg-white/55 backdrop-blur-sm">
          {users.length === 0 ? (
            <div className="px-5 py-16 text-center font-[family-name:var(--font-raleway)] text-[0.9rem] text-[#8a8480]">
              No users found.
            </div>
          ) : (
            users.map((u, i) => (
              <div
                key={u.id}
                className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 ${
                  i > 0 ? "border-t border-[#ece8e3]" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/users/${u.id}`}
                    className="font-[family-name:var(--font-raleway)] text-[1rem] font-[400] text-[#1a1614] transition-colors hover:text-[#5b5650]"
                  >
                    {u.name || "—"}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-[family-name:var(--font-roboto-mono)] text-[0.7rem] text-[#8a8480]">
                    <span className="truncate">{u.email}</span>
                    {u.phone && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-[#d6d0c8]" />
                        <span>{u.phone}</span>
                      </>
                    )}
                  </div>
                </div>

                <span className="inline-flex items-center rounded-full border border-[#ece8e3] bg-white/70 px-3 py-1 font-[family-name:var(--font-raleway)] text-[0.62rem] font-[700] uppercase tracking-[0.16em] text-[#5b5650]">
                  {titleCase(u.role)}
                </span>

                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/users/edit/${u.id}`}
                    className="px-2 font-[family-name:var(--font-raleway)] text-[0.78rem] font-[500] text-[#1a1614] hover:underline"
                  >
                    Edit
                  </Link>
                  <DeleteUserButton
                    userId={u.id}
                    userLabel={u.name || u.email}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function RoleChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "inline-flex items-center rounded-full bg-[#1a1614] px-4 py-1.5 font-[family-name:var(--font-raleway)] text-[0.68rem] font-[600] uppercase tracking-[0.16em] text-white"
          : "inline-flex items-center rounded-full border border-[#ece8e3] bg-white/70 px-4 py-1.5 font-[family-name:var(--font-raleway)] text-[0.68rem] font-[600] uppercase tracking-[0.16em] text-[#5b5650] backdrop-blur-sm transition-colors hover:border-[#d6d0c8] hover:text-[#1a1614]"
      }
    >
      {label}
    </Link>
  );
}
