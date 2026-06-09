"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@prisma/client";

import { listUsersForExport } from "@/lib/actions/user.actions";

type Props = {
  q?: string;
  role?: Role;
};

function csvCell(value: string | null | undefined): string {
  const s = value ?? "";
  return `"${s.replace(/"/g, '""')}"`;
}

export function ExportUsersButton({ q, role }: Props) {
  const [pending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      try {
        const users = await listUsersForExport(q, role);

        if (users.length === 0) {
          toast.error("No users to export.");
          return;
        }

        const header = ["Name", "Email", "Phone", "Role"];
        const rows = users.map((u) =>
          [u.name, u.email, u.phone, u.role].map(csvCell).join(",")
        );
        const csv = [header.map(csvCell).join(","), ...rows].join("\r\n");

        const blob = new Blob(["﻿" + csv], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const date = new Date().toISOString().slice(0, 10);
        const link = document.createElement("a");
        link.href = url;
        link.download = `users-${date}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Exported ${users.length} users`);
      } catch (error) {
        console.error("Export failed:", error);
        toast.error("Failed to export users.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full border border-[#ece8e3] bg-white/70 px-4 py-2 text-[#5b5650] backdrop-blur-sm transition-colors hover:border-[#d6d0c8] hover:text-[#1a1614] disabled:opacity-60"
    >
      <Download className="size-3.5" strokeWidth={1.5} />
      <span className="font-[family-name:var(--font-raleway)] text-[0.68rem] font-[600] uppercase tracking-[0.18em]">
        {pending ? "Exporting…" : "Export CSV"}
      </span>
    </button>
  );
}
