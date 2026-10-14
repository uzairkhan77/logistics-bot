import type { ConversationOutcome } from "@/lib/conversations";

/** Outcomes described the way a freight desk would say them out loud. */
export const OUTCOME_LABEL: Record<ConversationOutcome, string> = {
  captured: "Left their details",
  quoted: "Got a price, no details",
  broker: "Passed to your team",
  abandoned: "Left mid-chat",
};

export const OUTCOME_SHORT: Record<ConversationOutcome, string> = {
  captured: "Details left",
  quoted: "Price only",
  broker: "Your team",
  abandoned: "Left",
};

/** Semantic, and deliberately separate from the brand accent. */
export const OUTCOME_TONE: Record<ConversationOutcome, string> = {
  captured: "border-positive/30 text-positive",
  quoted: "border-accent/40 bg-accent-wash text-accent",
  broker: "border-caution/30 text-caution",
  abandoned: "border-line text-mute",
};

/** Offset within the conversation, as a transcript would show it. */
export function offsetClock(ms: number): string {
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
