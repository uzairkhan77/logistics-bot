"use client";

import type { AgentKind, Mode } from "@/config/brand";
import type { Quote } from "@/lib/rates";
import { SCENARIOS } from "@/lib/demoScenarios";

/**
 * Every chat the agent had, converted or not. The quote desk shows leads; this
 * shows what the visitor actually typed to get there — including the sessions
 * that went nowhere, which is the honest half of the picture.
 */

export type ConversationOutcome = "captured" | "quoted" | "broker" | "abandoned";

export type ConversationMessage = {
  role: "agent" | "visitor";
  text: string;
  /** Milliseconds after the conversation started. */
  at: number;
  /** Present on the turn where the agent returned a price. */
  quote?: Quote;
};

export type Conversation = {
  id: string;
  /** Null until the visitor gives a name. */
  visitor: string | null;
  email: string | null;
  /** Which agent held this conversation — the desk reads all three. */
  agent: AgentKind;
  /** Where the session came from, as a chat tool would show it. */
  location: string;
  origin: string | null;
  destination: string | null;
  mode: Mode | null;
  reference: string | null;
  amount: number | null;
  currency: "USD" | "EUR";
  outcome: ConversationOutcome;
  startedAt: number;
  messages: ConversationMessage[];
};

// Bumped when the seed itself changes shape. A browser that opened the demo
// before the support and qualification agents existed still has a v1 store of
// quote-only chats, and `loadConversations` prefers what is stored — so without
// a new key that stale seed hides every agent but one.
const STORAGE_KEY = "iqd.conversations.v2";
const MINUTE = 60_000;

/** Stamped once at module load, so nothing calls Date.now() during a render. */
export const CONV_NOW = Date.now();

function seed(now: number): Conversation[] {
  return SCENARIOS.map((scenario) => ({
    id: scenario.id,
    visitor: scenario.name,
    email: scenario.email,
    agent: scenario.agent,
    location: scenario.location,
    origin: scenario.origin,
    destination: scenario.destination,
    mode: scenario.mode,
    reference: scenario.quote?.reference ?? null,
    amount: scenario.quote?.total ?? null,
    currency: scenario.quote?.currency ?? "USD",
    outcome: scenario.outcome,
    startedAt: now - scenario.minutesAgo * MINUTE,
    messages: scenario.lines.map((line) => ({
      role: line.role,
      text: line.text,
      at: line.at * 1000,
      ...(line.showQuote && scenario.quote ? { quote: scenario.quote } : {}),
    })),
  }));
}

function read(): Conversation[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : null;
  } catch {
    return null;
  }
}

function write(value: Conversation[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* Demo store — a full quota is not worth surfacing to the visitor. */
  }
}

export function loadConversations(): Conversation[] {
  const stored = read();
  if (stored && stored.length) return stored.map(withAgent);
  const seeded = seed(CONV_NOW);
  write(seeded);
  return seeded;
}

/**
 * Chats stored before the desk knew about three agents have no `agent`. They
 * can only have come from the quote agent, so label them rather than letting
 * an old demo store render a blank badge.
 */
function withAgent(conversation: Conversation): Conversation {
  return conversation.agent ? conversation : { ...conversation, agent: "quote" };
}

/** Upserts the live session, so an abandoned chat still shows on the desk. */
export function upsertConversation(conversation: Conversation): void {
  const existing = loadConversations();
  const index = existing.findIndex((item) => item.id === conversation.id);
  const next =
    index === -1
      ? [conversation, ...existing]
      : existing.map((item, i) => (i === index ? conversation : item));
  write(next);
  window.dispatchEvent(new CustomEvent("iqd:conversations"));
}

export function resetConversations(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("iqd:conversations"));
}

/* ── external store ──────────────────────────────────────────────────────── */

const listeners = new Set<() => void>();
let cache: Conversation[] | null = null;
const EMPTY: Conversation[] = [];

function invalidate() {
  cache = null;
  listeners.forEach((listener) => listener());
}

export function subscribeToConversations(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("iqd:conversations", invalidate);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("iqd:conversations", invalidate);
  };
}

export function getConversationsSnapshot(): Conversation[] {
  if (!cache) cache = loadConversations();
  return cache;
}

export function getConversationsServerSnapshot(): Conversation[] {
  return EMPTY;
}
