"use client";

import { usePathname } from "next/navigation";

import { isStaffPath } from "@/lib/routes";

/**
 * Hides marketing chrome on back-office surfaces.
 *
 * Staff are working in these pages, not browsing the site: the footer is ~960px
 * of marketing under a tool, and the guest WhatsApp widget is a floating target
 * that overlaps fixed action bars.
 *
 * The header is deliberately NOT gated — it carries the back-office navigation
 * (`AdminLinks`), so hiding it would strand staff with no way to move between
 * pages.
 */
export function StaffChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isStaffPath(pathname)) return null;
  return <>{children}</>;
}
