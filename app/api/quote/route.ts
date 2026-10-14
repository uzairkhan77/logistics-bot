/**
 * The agent endpoint, shared by all three demo agents.
 *
 * `agent` in the request body picks the persona: `quote` prices lanes and
 * captures, `support` answers tracking and service questions, `capture`
 * qualifies an enquiry. It decides the system prompt and which tools are on
 * the table — only the quote agent is given `get_quote`. Everything else here,
 * the loop and the stream, is identical for all three.
 *
 * Runs the function-calling loop server-side and streams the turn to the
 * browser as SSE. Text arrives as it is generated; tool results are forwarded
 * as typed events so the widget can render a real rate slip built from
 * `computeQuote` rather than numbers parsed out of the model's prose.
 *
 * This replaces the parsing half of `lib/agent.ts`. The message shapes the
 * widget consumes (`ChatMessage`, `Quote`, `Slots`) are unchanged.
 *
 * The API is stateless: conversation history lives in the browser and is POSTed
 * back each turn, along with the lane-automation overrides from the admin page
 * (which live in localStorage, so the server cannot read them itself).
 */

import {
  GoogleGenAI,
  ThinkingLevel,
  Type,
  type Content,
  type FunctionDeclaration,
  type Part,
} from "@google/genai";

import { MODE_LABEL, type AgentKind, type Mode } from "@/config/brand";
import { buildSystemPrompt } from "@/lib/prompt";
import { computeQuote, findLane, type Quote } from "@/lib/rates";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "gemini-3.6-flash";
/** How hard the model thinks before replying. Left explicit — the default is automatic. */
const THINKING_LEVEL = ThinkingLevel.LOW;
const MAX_OUTPUT_TOKENS = 4096;
/** quote → ask → capture. Six is generous headroom. */
const MAX_ITERATIONS = 6;
const MAX_HISTORY_MESSAGES = 80;
/**
 * Attempts per model turn. Gemini's flash tiers return transient 503s under
 * load, so a turn gets several goes with exponential backoff.
 *
 * Deliberately no cross-model fallback: Gemini mints a `thoughtSignature` per
 * model and requires it on every `functionCall` part replayed to it, so a
 * conversation containing a tool call cannot be handed to a different model.
 */
const MAX_ATTEMPTS = 5;
/** Kept under `maxDuration` so a retry chain never outlives the function. */
const TURN_BUDGET_MS = 50_000;
/** Latency on this tier swings wildly for identical requests; cap each call. */
const CALL_TIMEOUT_MS = 25_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MODES: Mode[] = ["air", "fcl", "lcl", "road"];
const CONTAINER_TYPES = ["20GP", "40GP", "40HC"] as const;

/* ── wire format ───────────────────────────────────────────────────────── */

export type QuoteStreamEvent =
  | { type: "text"; text: string }
  /** Upstream failed mid-sentence; drop the partial reply, the turn is retrying. */
  | { type: "retry" }
  | { type: "quote"; quote: Quote }
  | { type: "captured"; name: string; email: string }
  | { type: "turn"; messages: Content[] }
  | { type: "error"; message: string }
  | { type: "done" };

/* ── tools ─────────────────────────────────────────────────────────────── */

const GET_QUOTE: FunctionDeclaration = {
  name: "get_quote",
  description:
    "Price a shipment and return an indicative rate with a line-item breakdown and transit window. " +
    "This is the ONLY way to obtain a price — never state a rate that did not come from this tool. " +
    "Call it as soon as you have origin, destination, mode and a measure.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      origin: {
        type: Type.STRING,
        description: "Origin city or port, as the visitor stated it.",
      },
      destination: {
        type: Type.STRING,
        description: "Destination city or port, as the visitor stated it.",
      },
      mode: {
        type: Type.STRING,
        enum: [...MODES],
        description:
          "air, fcl (full container), lcl (part container / groupage) or road.",
      },
      weightKg: {
        type: Type.NUMBER,
        nullable: true,
        description:
          "Gross weight in kilograms. Used for air and road; omit for FCL.",
      },
      volumeCbm: {
        type: Type.NUMBER,
        nullable: true,
        description: "Volume in cubic metres. Primary measure for LCL.",
      },
      containers: {
        type: Type.INTEGER,
        nullable: true,
        description: "Number of containers for FCL. Defaults to 1.",
      },
      containerType: {
        type: Type.STRING,
        enum: [...CONTAINER_TYPES],
        nullable: true,
        description: "Container size for FCL. Defaults to 40HC.",
      },
    },
    required: ["origin", "destination", "mode"],
  },
};

/**
 * When to call it is the one thing that differs per agent: the quote agent
 * takes details after a price, the other two take them the moment they have
 * both. The prompt says the same — this keeps the tool from contradicting it.
 */
const CAPTURE_WHEN: Record<AgentKind, string> = {
  quote: "Call this only once you have BOTH a name and an email, and only after they have seen a price.",
  support: "Call this as soon as you have BOTH a name and an email for the colleague picking the query up.",
  capture: "Call this as soon as you have BOTH a name and an email, however little else you have learned.",
};

const captureLead = (kind: AgentKind): FunctionDeclaration => ({
  name: "capture_lead",
  description:
    `Pass the visitor's contact details to the ${kind === "quote" ? "quote desk" : "team"}. ` +
    `${CAPTURE_WHEN[kind]} Never invent contact details.`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The visitor's name, as they gave it.",
      },
      email: {
        type: Type.STRING,
        description: "The visitor's email address, as they gave it.",
      },
    },
    required: ["name", "email"],
  },
});

/** Only the quote agent prices. The other two capture and nothing else. */
function toolsFor(kind: AgentKind): FunctionDeclaration[] {
  return kind === "quote" ? [GET_QUOTE, captureLead(kind)] : [captureLead(kind)];
}

const asString = (v: unknown) =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;
const asNumber = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined;

type ToolOutcome = { data: Record<string, unknown>; event?: QuoteStreamEvent };

function runGetQuote(
  args: Record<string, unknown>,
  laneOverrides: Record<string, boolean>,
  enquiryId: string,
): ToolOutcome {
  const origin = asString(args.origin);
  const destination = asString(args.destination);
  const modeRaw = asString(args.mode);

  if (!origin || !destination || !modeRaw || !MODES.includes(modeRaw as Mode)) {
    return {
      data: {
        error:
          "origin, destination and a valid mode (air, fcl, lcl, road) are all required.",
      },
    };
  }
  const mode = modeRaw as Mode;

  const containerTypeRaw = asString(args.containerType);
  const containerType = CONTAINER_TYPES.includes(containerTypeRaw as never)
    ? (containerTypeRaw as (typeof CONTAINER_TYPES)[number])
    : undefined;

  const quote = computeQuote({
    origin,
    destination,
    mode,
    weightKg: asNumber(args.weightKg),
    volumeCbm: asNumber(args.volumeCbm),
    containers: asNumber(args.containers)
      ? Math.round(asNumber(args.containers)!)
      : undefined,
    containerType,
    enquiryId,
  });

  // The admin's automation toggle lives in the browser, so apply it here.
  const lane = findLane(origin, destination, mode);
  const automated = lane
    ? lane.id in laneOverrides
      ? laneOverrides[lane.id]
      : lane.automated
    : quote.automated;
  const priced: Quote = { ...quote, automated };

  const common = {
    reference: priced.reference,
    lane: lane
      ? `${lane.originCity} → ${lane.destCity}`
      : `${origin} → ${destination}`,
    on_published_schedule: Boolean(lane),
    mode: MODE_LABEL[mode],
    transit_days: { min: priced.transitMin, max: priced.transitMax },
    automated,
  };

  // The figure itself is withheld from the model on a hand-priced lane, so it
  // cannot leak a number the visitor is not meant to be given. The client event
  // still carries the full quote — the desk sees the guide figure, the visitor
  // sees a card saying the lane is going to a broker.
  return {
    data: automated
      ? {
          ...common,
          basis: priced.basis,
          currency: priced.currency,
          total: priced.total,
          indicative_range: { low: priced.low, high: priced.high },
          instruction:
            "A rate slip with the full line-item breakdown is already on screen — do NOT repeat the line items. " +
            "Give the headline figure, the transit window, and say it is indicative and subject to confirmation. " +
            "Then ask for their name and email so a broker can confirm it.",
        }
      : {
          ...common,
          instruction:
            "This lane is NOT priced automatically — no figure is available to you and none has been shown to " +
            "the visitor. Do NOT state, estimate or hint at any price. A card on screen already tells them the " +
            "enquiry is with the broker desk. Confirm we serve the lane, give the transit window, say a broker " +
            "will come back with a firm rate, then ask for their name and email so the desk can send it.",
        },
    event: { type: "quote", quote: priced },
  };
}

function runCaptureLead(args: Record<string, unknown>): ToolOutcome {
  const name = asString(args.name);
  const email = asString(args.email);

  if (!name || !email) {
    return { data: { error: "Both name and email are required." } };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return {
      data: {
        error: `'${email}' does not look like a valid email address.`,
        instruction: "Ask the visitor to confirm their email.",
      },
    };
  }

  // The lead itself is written client-side, where the desk store lives.
  return {
    data: {
      saved: true,
      instruction:
        "Confirm the enquiry has gone to the desk with the quote reference, and say a broker will follow up by " +
        "email. One or two sentences.",
    },
    event: { type: "captured", name, email },
  };
}

function executeTool(
  name: string,
  args: unknown,
  laneOverrides: Record<string, boolean>,
  enquiryId: string,
): ToolOutcome {
  const input = (args ?? {}) as Record<string, unknown>;
  switch (name) {
    case "get_quote":
      return runGetQuote(input, laneOverrides, enquiryId);
    case "capture_lead":
      return runCaptureLead(input);
    default:
      return { data: { error: `Unknown tool '${name}'.` } };
  }
}

/* ── request handling ──────────────────────────────────────────────────── */

function isRetryable(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  if (status && [429, 500, 502, 503, 504].includes(status)) return true;
  // "Incomplete JSON segment" is the SDK's SSE parser hitting a truncated
  // stream — a cut-off response, not a malformed request.
  return /UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand|internal error|Incomplete JSON|fetch failed|terminated|ECONNRESET|timed out|aborted/i.test(
    String((error as Error)?.message ?? ""),
  );
}

function errorMessageFor(error: unknown): string {
  const status = (error as { status?: number })?.status;
  const message = String((error as Error)?.message ?? "");

  if (
    status === 401 ||
    status === 403 ||
    /API key|PERMISSION_DENIED|UNAUTHENTICATED/i.test(message)
  ) {
    return "The quote agent is not configured correctly — please call the desk and we will price this by hand.";
  }
  if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(message)) {
    return "We are handling a lot of enquiries right now. Give it a few seconds and try again.";
  }
  if (status && status >= 500) {
    return "The quoting service is having a moment. Please try again shortly.";
  }
  return "Something went wrong working out that rate. Please try again.";
}

function isValidHistory(value: unknown): value is Content[] {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > MAX_HISTORY_MESSAGES
  )
    return false;
  return value.every((m) => {
    if (typeof m !== "object" || m === null) return false;
    const msg = m as { role?: unknown; parts?: unknown };
    return (
      (msg.role === "user" || msg.role === "model") && Array.isArray(msg.parts)
    );
  });
}

function readOverrides(value: unknown): Record<string, boolean> {
  if (typeof value !== "object" || value === null) return {};
  const out: Record<string, boolean> = {};
  for (const [key, val] of Object.entries(value)) {
    if (typeof val === "boolean") out[key] = val;
  }
  return out;
}

/** The enquiry id only ever salts a hash, so anything printable will do. */
function readEnquiryId(value: unknown): string {
  return typeof value === "string" ? value.slice(0, 64) : "";
}

const AGENT_KINDS = ["quote", "support", "capture"] as const;

/** Which agent the page is running. Anything unrecognised is the quote agent. */
function readAgentKind(value: unknown): AgentKind {
  return AGENT_KINDS.includes(value as AgentKind) ? (value as AgentKind) : "quote";
}

export async function POST(request: Request) {
  let body: {
    messages?: unknown;
    laneOverrides?: unknown;
    enquiryId?: unknown;
    agent?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isValidHistory(body.messages)) {
    return Response.json(
      { error: "messages must be a non-empty conversation array." },
      { status: 400 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "GEMINI_API_KEY is not set. Add it to .env.local and restart the dev server.",
      },
      { status: 500 },
    );
  }

  const laneOverrides = readOverrides(body.laneOverrides);
  const enquiryId = readEnquiryId(body.enquiryId);
  const agent = readAgentKind(body.agent);
  const history = body.messages;
  const encoder = new TextEncoder();

  /**
   * Set when the browser walks away mid-turn — it aborts the in-flight request
   * whenever the visitor sends again, closes the widget or resets the chat.
   * Nothing may be enqueued after that, and there is no point finishing the
   * model call either.
   */
  const clientGone = new AbortController();
  const abandon = () => clientGone.abort();
  request.signal.addEventListener("abort", abandon, { once: true });

  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: QuoteStreamEvent) => {
        if (closed || clientGone.signal.aborted) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        } catch {
          // The consumer went away between the check and the write.
          closed = true;
        }
      };

      try {
        const ai = new GoogleGenAI({ apiKey });
        const contents: Content[] = [...history];
        const produced: Content[] = [];

        const config = {
          systemInstruction: buildSystemPrompt(agent, laneOverrides),
          tools: [{ functionDeclarations: toolsFor(agent) }],
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          temperature: 0.4,
          thinkingConfig: { thinkingLevel: THINKING_LEVEL },
        };

        const startedAt = Date.now();

        /**
         * One model turn, with retries. Transient failures can land
         * mid-sentence, so when text is already out we tell the client to
         * discard it rather than leave a reply stopping halfway through.
         */
        const runTurn = async (): Promise<Part[]> => {
          let lastError: unknown;

          for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            if (clientGone.signal.aborted) return [];

            let emitted = false;
            const abort = new AbortController();
            const timer = setTimeout(() => abort.abort(), CALL_TIMEOUT_MS);

            try {
              const responseStream = await ai.models.generateContentStream({
                model: MODEL,
                contents,
                // A visitor who has moved on should not keep the call running.
                config: {
                  ...config,
                  abortSignal: AbortSignal.any([
                    abort.signal,
                    clientGone.signal,
                  ]),
                },
              });

              const parts: Part[] = [];
              for await (const chunk of responseStream) {
                for (const part of chunk.candidates?.[0]?.content?.parts ??
                  []) {
                  // Keep parts verbatim — thoughtSignature must survive the
                  // round trip or Gemini loses the thread across tool calls.
                  parts.push(part);
                  if (part.text && !part.thought) {
                    send({ type: "text", text: part.text });
                    emitted = true;
                  }
                }
              }
              return parts;
            } catch (rawError) {
              if (clientGone.signal.aborted) return [];
              const error = abort.signal.aborted
                ? new Error("Upstream call timed out")
                : rawError;
              lastError = error;
              const backoff = 400 * 2 ** attempt;
              const outOfTime =
                Date.now() - startedAt + backoff > TURN_BUDGET_MS;
              if (
                !isRetryable(error) ||
                attempt === MAX_ATTEMPTS - 1 ||
                outOfTime
              )
                throw error;
              if (emitted) send({ type: "retry" });
              await sleep(backoff);
            } finally {
              clearTimeout(timer);
            }
          }

          throw lastError;
        };

        for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
          if (clientGone.signal.aborted) break;
          const modelParts = await runTurn();

          if (modelParts.length > 0) {
            const modelTurn: Content = { role: "model", parts: modelParts };
            contents.push(modelTurn);
            produced.push(modelTurn);
          }

          const calls = modelParts.filter((p) => p.functionCall);
          if (calls.length === 0) break;

          const responseParts: Part[] = [];
          for (const part of calls) {
            const call = part.functionCall!;
            const outcome = executeTool(
              call.name ?? "",
              call.args,
              laneOverrides,
              enquiryId,
            );
            if (outcome.event) send(outcome.event);
            responseParts.push({
              functionResponse: {
                id: call.id,
                name: call.name,
                response: outcome.data,
              },
            });
          }

          const resultTurn: Content = { role: "user", parts: responseParts };
          contents.push(resultTurn);
          produced.push(resultTurn);
        }

        send({ type: "turn", messages: produced });
        send({ type: "done" });
      } catch (error) {
        // A visitor who sent again, closed the widget or reset the chat is not
        // an error worth logging or reporting back down a dead connection.
        if (!clientGone.signal.aborted) {
          console.error("[quote-agent]", error);
          send({ type: "error", message: errorMessageFor(error) });
        }
      } finally {
        request.signal.removeEventListener("abort", abandon);
        const wasOpen = !closed;
        closed = true;
        if (wasOpen) {
          try {
            controller.close();
          } catch {
            /* Already closed by the consumer cancelling. */
          }
        }
      }
    },

    /** The browser cancelled the read — stop the turn and enqueue nothing more. */
    cancel() {
      closed = true;
      clientGone.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
