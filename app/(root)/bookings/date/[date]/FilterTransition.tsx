"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type NavigateOptions = { replace?: boolean; scroll?: boolean };

type FilterTransitionValue = {
  isPending: boolean;
  navigate: (href: string, options?: NavigateOptions) => void;
};

const FilterTransitionContext = React.createContext<FilterTransitionValue | null>(null);

/**
 * One transition for every control that reloads this page (tabs, search, agent
 * filter, day links), so the list can dim while any of them is in flight.
 */
export function FilterTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const navigate = React.useCallback(
    (href: string, { replace = false, scroll = false }: NavigateOptions = {}) => {
      startTransition(() => {
        if (replace) router.replace(href, { scroll });
        else router.push(href, { scroll });
      });
    },
    [router],
  );

  const value = React.useMemo(() => ({ isPending, navigate }), [isPending, navigate]);

  return (
    <FilterTransitionContext.Provider value={value}>{children}</FilterTransitionContext.Provider>
  );
}

export function useFilterTransition() {
  const ctx = React.useContext(FilterTransitionContext);
  if (!ctx) throw new Error("useFilterTransition must be used inside FilterTransitionProvider");
  return ctx;
}

/**
 * A Link that runs inside the shared transition. Modified clicks (new tab,
 * new window) fall through to the browser untouched.
 */
export function TransitionLink({
  href,
  scroll = false,
  onClick,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "href"> & { href: string }) {
  const { navigate } = useFilterTransition();

  return (
    <Link
      href={href}
      scroll={scroll}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(href, { scroll: Boolean(scroll) });
      }}
      {...props}
    />
  );
}

/** Dims its children and marks them busy while a filter change is loading. */
export function PendingRegion({ children }: { children: React.ReactNode }) {
  const { isPending } = useFilterTransition();

  return (
    <div
      aria-busy={isPending}
      className={`transition-opacity duration-200 ease-out motion-reduce:transition-none ${
        isPending ? "pointer-events-none opacity-45" : "opacity-100"
      }`}
    >
      <span role="status" className="sr-only">
        {isPending ? "Updating bookings…" : ""}
      </span>
      {children}
    </div>
  );
}
