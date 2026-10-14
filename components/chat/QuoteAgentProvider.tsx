"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { brand, type AgentKind } from "@/config/brand";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { Launcher } from "@/components/chat/Launcher";

type QuoteAgentContext = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const Ctx = createContext<QuoteAgentContext | null>(null);

export function useQuoteAgent(): QuoteAgentContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useQuoteAgent must be used inside QuoteAgentProvider");
  return ctx;
}

/**
 * `agent` is the whole of the difference between the three demo routes: it
 * names the persona in the header and on the launcher, and travels with every
 * turn so the API knows which prompt and tools to run.
 */
export function QuoteAgentProvider({
  agent = "quote",
  children,
}: {
  agent?: AgentKind;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const value = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <ChatWidget agent={agent} isOpen={isOpen} onClose={close} />
      <Launcher name={brand.agents[agent].name} isOpen={isOpen} onClick={toggle} />
    </Ctx.Provider>
  );
}
