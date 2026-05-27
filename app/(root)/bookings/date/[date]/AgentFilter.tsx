"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type AgentOption = { id: string; label: string };

export function AgentFilter({
  agents,
  value,
}: {
  agents: AgentOption[];
  value: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    const v = e.target.value;
    if (v && v !== "all") {
      params.set("agent", v);
    } else {
      params.delete("agent");
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="relative mt-5 md:mt-0 md:ml-3 md:w-60">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b0a89f] pointer-events-none"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <select
        value={value}
        onChange={handleChange}
        className="appearance-none w-full pl-9 pr-9 py-2 text-sm bg-[#f5f3f0] border border-[#ece8e3] text-[#1a1614] focus:outline-none focus:border-[#8a8480] font-[family-name:var(--font-raleway)] rounded-sm"
      >
        <option value="all">All agents</option>
        <option value="unassigned">Unassigned</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0a89f] pointer-events-none"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}
