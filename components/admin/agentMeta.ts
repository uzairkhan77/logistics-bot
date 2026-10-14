import { brand, type AgentKind } from "@/config/brand";

/**
 * How the desk names the three agents.
 *
 * Short labels for table cells and filter chips, where the full persona name
 * would not fit. Anywhere there is room — the drawer, a thread header — read
 * `brand.agents[kind].name` instead, so a rebrand still drives it.
 */
export const AGENT_SHORT: Record<AgentKind, string> = {
  quote: "Quote",
  support: "Support",
  capture: "Enquiry",
};

/** What each one is for, in the desk's own words. */
export const AGENT_NOTE: Record<AgentKind, string> = {
  quote: "Priced a shipment",
  support: "Tracking and service question",
  capture: "Qualified a new enquiry",
};

/** Semantic, and deliberately separate from the brand accent. */
export const AGENT_TONE: Record<AgentKind, string> = {
  quote: "border-accent/40 bg-accent-wash text-accent",
  support: "border-line text-mute",
  capture: "border-positive/30 text-positive",
};

/** Chip order for the filter rows — the quote agent first, as it shipped first. */
export const AGENT_KINDS: AgentKind[] = ["quote", "support", "capture"];

export function agentName(kind: AgentKind): string {
  return brand.agents[kind].name;
}
