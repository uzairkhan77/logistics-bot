"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { brand, type AgentKind } from "@/config/brand";
import { advance, initialState, openingTurn, type AgentState, type AgentTurn, type ChatMessage, type QuickReply } from "@/lib/agent";
import { getLanesSnapshot, newLeadId, saveLead, saveLeads } from "@/lib/leads";
import { upsertConversation, type Conversation, type ConversationMessage } from "@/lib/conversations";
import { Message, Typing } from "@/components/chat/Message";

/**
 * Beat between the agent's messages once a turn arrives.
 *
 * The model supplies the thinking pause now, so there is no artificial delay
 * before the first message — `THINK_MS` is 0 and the typing indicator runs for
 * however long the real call takes. `BETWEEN_MS` only staggers a multi-part
 * reply so a wall of text does not appear at once.
 */
const THINK_MS = 0;
const BETWEEN_MS = 320;

export function ChatWidget({
  agent,
  isOpen,
  onClose,
}: {
  /** Which agent this page runs. Names the panel and travels with every turn. */
  agent: AgentKind;
  isOpen: boolean;
  onClose: () => void;
}) {
  const persona = brand.agents[agent];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [state, setState] = useState<AgentState>(initialState);
  const [isTyping, setIsTyping] = useState(false);
  const [draft, setDraft] = useState("");

  const seq = useRef(0);
  const greeted = useRef(false);
  const session = useRef<{ id: string; startedAt: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const inflight = useRef<AbortController | null>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    inflight.current?.abort();
    inflight.current = null;
  }, []);

  const nextId = useCallback(() => `m${++seq.current}`, []);

  /** Streams the agent's replies in with a typing beat between each. */
  const playTurn = useCallback(
    (turn: AgentTurn) => {
      setIsTyping(true);
      setQuickReplies([]);

      turn.replies.forEach((reply, index) => {
        const at = THINK_MS + index * BETWEEN_MS;
        timers.current.push(
          setTimeout(() => {
            setMessages((prev) => [...prev, { ...reply, id: nextId(), at: Date.now() } as ChatMessage]);
            if (index === turn.replies.length - 1) {
              setIsTyping(false);
              setQuickReplies(turn.quickReplies);
            }
          }, at),
        );
      });

      setState(turn.state);

      if (turn.captured) {
        const { slots, quote } = turn.state;
        const settled = messages.concat(
          turn.replies.map((reply) => ({ ...reply, id: "t", at: Date.now() }) as ChatMessage),
        );

        const transcript = settled
          .filter((m) => m.kind === "text")
          .map((m) => ({ role: m.role, text: m.text }));

        // Every lane the visitor asked about is an enquiry, not just the last
        // one — the desk should see all four if they asked about four.
        const quoted = settled.flatMap((m) => (m.kind === "quote" ? [m.quote] : []));
        const seen = new Set<string>();
        const distinct = quoted.filter((q) => {
          if (seen.has(q.reference)) return false;
          seen.add(q.reference);
          return true;
        });

        const at = Date.now();
        const base = newLeadId();

        // Written now, not on a timer: a visitor who carries on typing the
        // moment they hand over their details must not lose the enquiry.
        if (distinct.length) {
          saveLeads(
            distinct.map((q, index) => ({
              id: distinct.length > 1 ? `${base}-${index + 1}` : base,
              name: slots.name ?? "Unknown",
              email: slots.email ?? "",
              company: null,
              agent,
              origin: q.origin,
              destination: q.destination,
              mode: q.mode,
              amount: q.total,
              currency: q.currency,
              reference: q.reference,
              transit: `${q.transitMin}–${q.transitMax} days`,
              status: "new",
              automated: q.automated,
              createdAt: at,
              transcript,
            })),
          );
        } else {
          // Contact details without a quote on screen — still a lead.
          saveLead({
            id: base,
            name: slots.name ?? "Unknown",
            email: slots.email ?? "",
            company: null,
            agent,
            origin: slots.origin ?? "",
            destination: slots.destination ?? "",
            mode: slots.mode ?? null,
            amount: quote?.total ?? null,
            currency: quote?.currency ?? "USD",
            reference: quote?.reference ?? "—",
            transit: quote ? `${quote.transitMin}–${quote.transitMax} days` : "—",
            status: "new",
            automated: quote?.automated ?? true,
            createdAt: at,
            transcript,
          });
        }
      }
    },
    [agent, messages, nextId],
  );

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;
      clearTimers();
      setDraft("");
      setMessages((prev) => [...prev, { id: nextId(), at: Date.now(), role: "visitor", kind: "text", text: trimmed }]);

      // The typing indicator now covers the real round trip, not a fake pause.
      setIsTyping(true);
      setQuickReplies([]);

      const request = new AbortController();
      inflight.current = request;

      void advance(state, trimmed, {
        agent,
        laneOverrides: getLanesSnapshot(),
        enquiryId: session.current?.id ?? "",
        signal: request.signal,
      })
        .then((turn) => {
          if (request.signal.aborted) return;
          playTurn(turn);
        })
        .finally(() => {
          if (inflight.current === request) inflight.current = null;
        });
    },
    [agent, clearTimers, isTyping, nextId, playTurn, state],
  );

  const restart = useCallback(() => {
    clearTimers();
    seq.current = 0;
    session.current = { id: `cv-live-${Date.now()}`, startedAt: Date.now() };
    setMessages([]);
    setQuickReplies([]);
    setState(initialState);
    setDraft("");
    setIsTyping(true);
    const turn = openingTurn(agent);
    timers.current.push(
      setTimeout(() => {
        setMessages(turn.replies.map((reply) => ({ ...reply, id: `m${++seq.current}`, at: Date.now() }) as ChatMessage));
        setIsTyping(false);
        setQuickReplies(turn.quickReplies);
      }, THINK_MS),
    );
  }, [agent, clearTimers]);

  // Greet on first open, then leave the conversation where the visitor left it.
  useEffect(() => {
    if (!isOpen || greeted.current) return;
    greeted.current = true;
    const timer = setTimeout(restart, 0);
    return () => clearTimeout(timer);
  }, [isOpen, restart]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // Mirrors the live session onto the desk, converted or not.
  useEffect(() => {
    const current = session.current;
    if (!current) return;
    if (!messages.some((message) => message.role === "visitor")) return;

    // The latest quote, and the header's route and price both come from it —
    // reading the route from one quote and the figure from another shows the
    // desk a pairing that never happened.
    const quotes = messages.flatMap((message) => (message.kind === "quote" ? [message.quote] : []));
    const quote = quotes[quotes.length - 1];
    const outcome: Conversation["outcome"] = state.slots.email
      ? quote && !quote.automated
        ? "broker"
        : "captured"
      : quote
        ? "quoted"
        : "abandoned";

    const thread: ConversationMessage[] = messages
      .filter((message) => message.kind !== "handoff")
      .map((message) => ({
        role: message.role,
        text: message.text,
        at: Math.max(0, message.at - current.startedAt),
        ...(message.kind === "quote" ? { quote: message.quote } : {}),
      }));

    upsertConversation({
      id: current.id,
      visitor: state.slots.name ?? null,
      email: state.slots.email ?? null,
      agent,
      location: "This browser · live demo session",
      origin: quote?.origin ?? state.slots.origin ?? null,
      destination: quote?.destination ?? state.slots.destination ?? null,
      mode: quote?.mode ?? state.slots.mode ?? null,
      reference: quote?.reference ?? null,
      amount: quote?.total ?? null,
      currency: quote?.currency ?? "USD",
      outcome,
      startedAt: current.startedAt,
      messages: thread,
    });
  }, [agent, messages, state]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, quickReplies]);

  return (
    <div
      role="dialog"
      aria-label={persona.name}
      aria-hidden={!isOpen}
      className={`fixed z-50 flex flex-col border-ink bg-surface transition-[opacity,transform] duration-200 ease-out
        inset-0 border-0
        md:inset-auto md:bottom-24 md:right-6 md:h-[min(660px,calc(100vh-140px))] md:w-[400px] md:border
        md:shadow-[0_24px_60px_-20px_rgba(16,17,19,0.45)]
        ${isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-ink px-4 py-3.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-[2px] bg-ink text-paper">
          <span className="label-sm">{brand.company.name.slice(0, 2).toUpperCase()}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-[14px] font-medium leading-tight">{persona.name}</p>
          <p className="label-sm mt-1 flex items-center gap-1.5 truncate text-mute">
            <i className="block size-[5px] shrink-0 rounded-full bg-accent anim-blink" aria-hidden />
            <span className="truncate">{persona.status}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={restart}
          aria-label="Start again"
          className="label-sm rounded-[2px] border border-line px-2 py-1.5 text-mute transition-colors hover:border-ink hover:text-ink"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${persona.name}`}
          className="grid size-8 shrink-0 place-items-center rounded-[2px] text-mute transition-colors hover:bg-paper hover:text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div ref={scrollRef} className="thin-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {isTyping ? <Typing /> : null}
      </div>

      {quickReplies.length ? (
        <div className="flex shrink-0 flex-wrap gap-2 border-t border-line-soft px-4 py-3">
          {quickReplies.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => send(chip.value)}
              className="label-sm rounded-[2px] border border-line bg-surface px-2.5 py-2 text-ink-soft transition-colors hover:border-accent hover:bg-accent-wash hover:text-accent"
            >
              {chip.label}
            </button>
          ))}
        </div>
      ) : null}

      <form
        className="flex shrink-0 items-center gap-2 border-t border-ink px-3 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={agent === "quote" && state.step === "done" ? "Ask about another lane…" : "Type your reply…"}
          aria-label={`Message ${persona.name}`}
          className="h-9 min-w-0 flex-1 bg-transparent px-1 text-[14px] text-ink outline-none placeholder:text-mute/70"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isTyping}
          aria-label="Send"
          className="grid size-9 shrink-0 place-items-center rounded-[2px] bg-accent text-accent-ink transition-[opacity,filter] hover:brightness-[0.92] disabled:opacity-30"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  );
}
