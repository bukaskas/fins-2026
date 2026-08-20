"use client";

import { createContext, useContext } from "react";

export type AgentOption = { id: string; name: string | null; email: string };

const AgentsContext = createContext<AgentOption[]>([]);

/**
 * Holds the staff list for every booking row on the page.
 *
 * Rows are client components, so a per-row `allUsers` prop meant the whole
 * agent list was serialized into the RSC payload once per booking. Wrapping
 * the list serializes it once.
 */
export function AgentsProvider({
  agents,
  children,
}: {
  agents: AgentOption[];
  children: React.ReactNode;
}) {
  return <AgentsContext.Provider value={agents}>{children}</AgentsContext.Provider>;
}

export function useAgents() {
  return useContext(AgentsContext);
}
