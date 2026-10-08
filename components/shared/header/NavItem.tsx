"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  variant: "menu" | "sheet";
  /** Only the exact path counts as current, never its child routes. */
  exact?: boolean;
  className?: string;
  children: React.ReactNode;
};

function isCurrent(pathname: string | null, href: string, exact?: boolean) {
  if (!pathname) return false;
  if (pathname === href) return true;
  return !exact && pathname.startsWith(`${href}/`);
}

// Shared by both variants. Highlight carves the row in (inset); the 2px
// neu-focus ring shows for keyboard focus only (focus-visible), not mouse hover.
const base =
  "relative min-h-11 rounded-[10px] px-3 py-2 text-sm font-[500] text-neu-fg font-[family-name:var(--font-raleway)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-neu-focus";
// Radix moves focus on pointer hover, so the menu highlights on focus; the
// sheet is plain links and highlights on hover. Same colours either way.
const menuItem = "cursor-pointer focus:bg-neu-inset focus:text-neu-primary-ink";
const sheetItem = "flex w-full items-center hover:bg-neu-inset hover:text-neu-primary-ink";
// Current page: inset well + 3px bar + ink text + heavier weight — four cues,
// so the state never rests on the bar's colour alone.
const current =
  "bg-neu-inset text-neu-primary-ink font-[600] shadow-(--shadow-neu-inset-sm)";

export function NavItem({ href, variant, exact, className, children }: Props) {
  const active = isCurrent(usePathname(), href, exact);
  const bar = active && (
    <span
      aria-hidden="true"
      className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-neu-primary-ink"
    />
  );

  // Menu: the classes go on DropdownMenuItem so tailwind-merge can override its
  // shadcn defaults (focus:bg-accent, rounded-sm, py-1.5). The Link inherits them.
  if (variant === "menu") {
    return (
      <DropdownMenuItem
        asChild
        className={cn(base, menuItem, className, active && current)}
      >
        <Link href={href} aria-current={active ? "page" : undefined}>
          {bar}
          {children}
        </Link>
      </DropdownMenuItem>
    );
  }

  return (
    <SheetClose asChild>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(base, sheetItem, className, active && current)}
      >
        {bar}
        {children}
      </Link>
    </SheetClose>
  );
}
