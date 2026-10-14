"use client";

import type { AgentKind, Mode } from "@/config/brand";
import { SCENARIOS } from "@/lib/demoScenarios";

export type LeadStatus = "new" | "quoted" | "won";

export type Lead = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  /** Which agent took this enquiry. The desk reads three of them now. */
  agent: AgentKind;
  origin: string;
  destination: string;
  /**
   * Null on an enquiry that never got as far as a quote — the support and
   * qualification agents do not price, so their leads carry contact details
   * and a transcript and nothing else. Better an honest gap than a made-up mode.
   */
  mode: Mode | null;
  /** Headline figure at the time of capture, kept so the list never re-prices. Null if unpriced. */
  amount: number | null;
  currency: "USD" | "EUR";
  reference: string;
  transit: string;
  status: LeadStatus;
  automated: boolean;
  /** Epoch millis. */
  createdAt: number;
  transcript: { role: "agent" | "visitor"; text: string }[];
};

/** Bumped alongside the conversations store — same stale-seed problem. */
const STORAGE_KEY = "iqd.leads.v2";
const LANE_KEY = "iqd.lanes.v1";

const MINUTE = 60_000;

/** Stamped once at module load, so nothing calls Date.now() during a render. */
export const DESK_NOW = Date.now();

/**
 * Built from the shared scenarios, so a customer reads the same on both pages.
 *
 * A scenario earns a lead by leaving contact details, quote or no quote — the
 * support and qualification agents never price, and their enquiries belong on
 * the desk just the same.
 */
function seedLeads(now: number): Lead[] {
  return SCENARIOS.filter((scenario) => scenario.leadStatus).map((scenario) => {
    const quote = scenario.quote;
    return {
      id: scenario.id.replace("cv-", "ld-"),
      name: scenario.name ?? "Unknown",
      email: scenario.email ?? "",
      company: scenario.company,
      agent: scenario.agent,
      origin: scenario.origin ?? "",
      destination: scenario.destination ?? "",
      mode: scenario.mode,
      amount: quote?.total ?? null,
      currency: quote?.currency ?? "USD",
      reference: quote?.reference ?? "—",
      transit: quote ? `${quote.transitMin}–${quote.transitMax} days` : "—",
      status: scenario.leadStatus!,
      automated: scenario.outcome !== "broker",
      createdAt: now - scenario.minutesAgo * MINUTE,
      transcript: scenario.lines.map((line) => ({ role: line.role, text: line.text })),
    };
  });
}

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Demo store — a full quota is not worth surfacing to the visitor. */
  }
}

export function loadLeads(): Lead[] {
  const stored = read<Lead[]>(STORAGE_KEY);
  if (stored && stored.length) return stored.map(withAgent);
  const seeded = seedLeads(DESK_NOW);
  write(STORAGE_KEY, seeded);
  return seeded;
}

/**
 * Rows written before the desk knew about three agents have no `agent` at all.
 * They can only have come from the quote agent, so say so rather than letting
 * an old demo store render a blank badge.
 */
function withAgent(lead: Lead): Lead {
  return lead.agent ? lead : { ...lead, agent: "quote" };
}

/**
 * Writes a batch in one go.
 *
 * A conversation can produce several quotes, and each one is an enquiry the
 * desk should see — so they are written together, newest first, rather than
 * only the last one surviving.
 */
export function saveLeads(leads: Lead[]): Lead[] {
  const existing = loadLeads();
  if (!leads.length) return existing;
  const next = [...leads].reverse().concat(existing);
  write(STORAGE_KEY, next);
  window.dispatchEvent(new CustomEvent("iqd:leads"));
  return next;
}

export function saveLead(lead: Lead): Lead[] {
  return saveLeads([lead]);
}

export function updateLeadStatus(id: string, status: LeadStatus): Lead[] {
  const next = loadLeads().map((lead) => (lead.id === id ? { ...lead, status } : lead));
  write(STORAGE_KEY, next);
  window.dispatchEvent(new CustomEvent("iqd:leads"));
  return next;
}

export function resetDemoData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(LANE_KEY);
  window.dispatchEvent(new CustomEvent("iqd:leads"));
  // Two stores, two events — without this the automation toggles keep showing
  // the state that was just cleared, and the button reads as though it did
  // nothing at all.
  window.dispatchEvent(new CustomEvent("iqd:lanes"));
}

/** Lane automation overrides, kept apart from the brand config so the toggle persists. */
export function loadLaneOverrides(): Record<string, boolean> {
  return read<Record<string, boolean>>(LANE_KEY) ?? {};
}

export function setLaneOverride(id: string, automated: boolean): Record<string, boolean> {
  const next = { ...loadLaneOverrides(), [id]: automated };
  write(LANE_KEY, next);
  window.dispatchEvent(new CustomEvent("iqd:lanes"));
  return next;
}

export function newLeadId(): string {
  return `ld-${Math.floor(Date.now() / 1000) % 100000}`;
}

/* ── external store ────────────────────────────────────────────────────────
   Read through useSyncExternalStore so React owns the subscription and the
   snapshots stay referentially stable between renders. */

const listeners = new Set<() => void>();
let leadsCache: Lead[] | null = null;
let lanesCache: Record<string, boolean> | null = null;

const EMPTY_LEADS: Lead[] = [];
const EMPTY_LANES: Record<string, boolean> = {};

function invalidate() {
  leadsCache = null;
  lanesCache = null;
  listeners.forEach((listener) => listener());
}

export function subscribeToDesk(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("iqd:leads", invalidate);
  window.addEventListener("iqd:lanes", invalidate);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("iqd:leads", invalidate);
      window.removeEventListener("iqd:lanes", invalidate);
    }
  };
}

export function getLeadsSnapshot(): Lead[] {
  if (!leadsCache) leadsCache = loadLeads();
  return leadsCache;
}

export function getLanesSnapshot(): Record<string, boolean> {
  if (!lanesCache) lanesCache = loadLaneOverrides();
  return lanesCache;
}

export function getLeadsServerSnapshot(): Lead[] {
  return EMPTY_LEADS;
}

export function getLanesServerSnapshot(): Record<string, boolean> {
  return EMPTY_LANES;
}
