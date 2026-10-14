import { brand, type AgentKind, type Mode } from "@/config/brand";
import type { Quote } from "@/lib/rates";

/**
 * Conversation engine for the demo, backed by the model.
 *
 * The parsing half of this file used to be a deterministic slot-filler. It has
 * been replaced by a real agent: `advance()` posts the transcript to
 * `/api/quote`, where the model runs a function-calling loop over
 * `computeQuote`. `Slots`, `Step` and the message shapes are unchanged, so the
 * widget and the admin views did not have to move.
 *
 * Pricing still never comes from the model — it comes from `lib/rates.ts` via
 * the `get_quote` tool, so the figure on the slip is the figure the desk sees.
 */

export type Step =
  | "origin"
  | "destination"
  | "mode"
  | "measure"
  | "name"
  | "email"
  | "done";

export type Slots = {
  origin?: string;
  destination?: string;
  mode?: Mode;
  weightKg?: number;
  volumeCbm?: number;
  containers?: number;
  containerType?: "20GP" | "40GP" | "40HC";
  name?: string;
  email?: string;
};

export type ChatMessage =
  | { id: string; at: number; role: "agent"; kind: "text"; text: string }
  | { id: string; at: number; role: "agent"; kind: "quote"; text: string; quote: Quote }
  | { id: string; at: number; role: "agent"; kind: "handoff"; text: string }
  | { id: string; at: number; role: "visitor"; kind: "text"; text: string };

export type QuickReply = { label: string; value: string };

/** Distributes over the union so each member keeps its own discriminant. */
export type DraftMessage = ChatMessage extends infer M
  ? M extends ChatMessage
    ? Omit<M, "id" | "at">
    : never
  : never;

/** What we round-trip to the API — the model's own Content shape. */
export type WireMessage = { role: "user" | "model"; parts: unknown[] };

export type AgentState = {
  step: Step;
  slots: Slots;
  quote: Quote | null;
  /** The transcript as the model sees it, including its tool calls. */
  history: WireMessage[];
};

export type AgentTurn = {
  state: AgentState;
  /** Agent messages to append, in order. */
  replies: DraftMessage[];
  quickReplies: QuickReply[];
  /** Set on the turn where contact details complete — the widget writes the lead. */
  captured: boolean;
};

export const initialState: AgentState = { step: "origin", slots: {}, quote: null, history: [] };

/* ── quick replies ─────────────────────────────────────────────────────── */

const MODE_CHIPS: QuickReply[] = [
  { label: "Air freight", value: "Air freight" },
  { label: "Ocean FCL", value: "Ocean FCL" },
  { label: "Ocean LCL", value: "Ocean LCL" },
  { label: "Road", value: "Road freight" },
];

function measureChips(mode: Mode): QuickReply[] {
  if (mode === "fcl") {
    return [
      { label: "1 × 20GP", value: "1 x 20GP" },
      { label: "1 × 40GP", value: "1 x 40GP" },
      { label: "1 × 40HC", value: "1 x 40HC" },
      { label: "2 × 40HC", value: "2 x 40HC" },
    ];
  }
  if (mode === "air") {
    return [
      { label: "Under 500 kg", value: "450 kg" },
      { label: "~1,200 kg", value: "1200 kg" },
      { label: "~3,000 kg", value: "3000 kg" },
    ];
  }
  if (mode === "lcl") {
    return [
      { label: "~3 cbm", value: "3 cbm" },
      { label: "~8 cbm", value: "8 cbm" },
      { label: "~15 cbm", value: "15 cbm" },
    ];
  }
  return [
    { label: "4 pallets", value: "4 pallets" },
    { label: "10 pallets", value: "10 pallets" },
    { label: "Full load", value: "Full load" },
  ];
}

function originChips(): QuickReply[] {
  const cities = Array.from(new Set(brand.lanes.map((lane) => lane.originCity))).slice(0, 4);
  return cities.map((city) => ({ label: city, value: city }));
}

function hasMeasure(slots: Slots): boolean {
  if (slots.mode === "fcl") return Boolean(slots.containers || slots.containerType);
  return Boolean(slots.weightKg || slots.volumeCbm);
}

/** Where the conversation stands, derived from what has actually been settled. */
function deriveStep(slots: Slots, quote: Quote | null, captured: boolean): Step {
  if (captured) return "done";
  if (quote) return slots.name ? "email" : "name";
  if (!slots.origin) return "origin";
  if (!slots.destination) return "destination";
  if (!slots.mode) return "mode";
  if (!hasMeasure(slots)) return "measure";
  return "measure";
}

/**
 * Chips are shortcuts through the quoting questions, so only the quote agent
 * gets them — an origin port is not a useful thing to offer someone asking
 * where their shipment has got to.
 */
function chipsFor(kind: AgentKind, step: Step, slots: Slots): QuickReply[] {
  if (kind !== "quote") return [];
  if (step === "origin") return originChips();
  if (step === "mode") return MODE_CHIPS;
  if (step === "measure" && slots.mode) return measureChips(slots.mode);
  return [];
}

/* ── the turn ──────────────────────────────────────────────────────────── */

type StreamEvent =
  | { type: "text"; text: string }
  | { type: "retry" }
  | { type: "quote"; quote: Quote }
  | { type: "captured"; name: string; email: string }
  | { type: "turn"; messages: WireMessage[] }
  | { type: "error"; message: string }
  | { type: "done" };

/**
 * One visitor turn.
 *
 * Text arrives as deltas but is collected into whole messages, so the widget
 * keeps its "typing indicator, then the reply lands" rhythm rather than having
 * to render a half-written sentence.
 */
export async function advance(
  state: AgentState,
  userText: string,
  options: {
    /** Which agent the page is running. Picks the prompt and the tools. */
    agent?: AgentKind;
    laneOverrides?: Record<string, boolean>;
    /** This browser session, so the quote reference identifies the enquiry. */
    enquiryId?: string;
    signal?: AbortSignal;
  } = {},
): Promise<AgentTurn> {
  const { agent = "quote", laneOverrides = {}, enquiryId = "", signal } = options;

  const outgoing: WireMessage[] = [
    ...state.history,
    { role: "user", parts: [{ text: userText }] },
  ];

  const replies: DraftMessage[] = [];
  const slots: Slots = { ...state.slots };
  let quote: Quote | null = state.quote;
  let captured = false;
  let history: WireMessage[] = outgoing;
  let buffer = "";

  /** Text before a card belongs above it, so flush on every non-text event. */
  const flushText = () => {
    const text = buffer.trim();
    buffer = "";
    if (text) replies.push({ role: "agent", kind: "text", text });
  };

  const fail = (message: string): AgentTurn => {
    flushText();
    replies.push({ role: "agent", kind: "text", text: message });
    const step = deriveStep(slots, quote, captured);
    return {
      state: { step, slots, quote, history },
      replies,
      quickReplies: chipsFor(agent, step, slots),
      captured: false,
    };
  };

  let response: Response;
  try {
    response = await fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: outgoing, agent, laneOverrides, enquiryId }),
      signal,
    });
  } catch {
    return fail("I could not reach the pricing desk just then. Try that again?");
  }

  if (!response.ok || !response.body) {
    const detail = (await response.json().catch(() => null)) as { error?: string } | null;
    return fail(detail?.error ?? "I could not reach the pricing desk just then. Try that again?");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let raw = "";

  const handle = (event: StreamEvent) => {
    switch (event.type) {
      case "text":
        buffer += event.text;
        break;
      case "retry":
        // The turn is being re-run upstream; bin the half-written sentence.
        buffer = "";
        break;
      case "quote":
        flushText();
        quote = event.quote;
        slots.origin = event.quote.origin;
        slots.destination = event.quote.destination;
        slots.mode = event.quote.mode;
        replies.push({ role: "agent", kind: "quote", text: "", quote: event.quote });
        break;
      case "captured":
        flushText();
        slots.name = event.name;
        slots.email = event.email;
        captured = true;
        break;
      case "turn":
        history = [...outgoing, ...event.messages];
        break;
      case "error":
        flushText();
        replies.push({ role: "agent", kind: "text", text: event.message });
        break;
      case "done":
        break;
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += decoder.decode(value, { stream: true });

      let boundary = raw.indexOf("\n\n");
      while (boundary !== -1) {
        const frame = raw.slice(0, boundary);
        raw = raw.slice(boundary + 2);
        const line = frame.split("\n").find((l) => l.startsWith("data: "));
        if (line) {
          try {
            handle(JSON.parse(line.slice(6)) as StreamEvent);
          } catch {
            /* A malformed frame should not kill the stream. */
          }
        }
        boundary = raw.indexOf("\n\n");
      }
    }
  } catch {
    return fail("That connection dropped before I finished. Try that again?");
  }

  flushText();

  if (captured) {
    replies.push({ role: "agent", kind: "handoff", text: `Sent to ${slots.email}` });
  }

  if (replies.length === 0) {
    replies.push({ role: "agent", kind: "text", text: "Sorry — say that once more?" });
  }

  const step = deriveStep(slots, quote, captured);
  return {
    state: { step, slots, quote, history },
    replies,
    quickReplies: chipsFor(agent, step, slots),
    captured,
  };
}

/** Opening turn, before the visitor has typed anything. No model call needed. */
export function openingTurn(kind: AgentKind = "quote"): AgentTurn {
  return {
    state: initialState,
    replies: [{ role: "agent", kind: "text", text: brand.agents[kind].greeting }],
    quickReplies: chipsFor(kind, "origin", {}),
    captured: false,
  };
}
