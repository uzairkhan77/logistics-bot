"use client";

import { MODE_LABEL } from "@/config/brand";
import { formatMoney } from "@/lib/rates";
import { CONV_NOW, type Conversation } from "@/lib/conversations";
import { clockTime, relativeTime } from "@/lib/time";
import { RateSlip } from "@/components/ui/RateSlip";
import { OUTCOME_LABEL, OUTCOME_TONE, offsetClock } from "@/components/admin/conversationMeta";
import { AGENT_NOTE, AGENT_SHORT, agentName } from "@/components/admin/agentMeta";

export function ConversationThread({ conversation }: { conversation: Conversation | null }) {
  if (!conversation) {
    return (
      <div className="grid h-full min-h-[420px] place-items-center px-6 py-16 text-center text-[14px] text-mute">
        Pick a conversation on the left to read it
      </div>
    );
  }

  const duration = conversation.messages.length
    ? conversation.messages[conversation.messages.length - 1].at
    : 0;

  const length = `${conversation.messages.length} messages · ${offsetClock(duration)}`;

  // Route, mode and price are the quote agent's business. On a tracking or
  // qualification chat all three read "Not given", which fills the header with
  // nothing — so those show what the chat was actually for instead.
  const meta =
    conversation.agent === "quote"
      ? [
          { k: "Handled by", v: agentName(conversation.agent) },
          {
            k: "Route",
            v:
              conversation.origin && conversation.destination
                ? `${conversation.origin} → ${conversation.destination}`
                : "Not given",
          },
          { k: "How it moves", v: conversation.mode ? MODE_LABEL[conversation.mode] : "Not given" },
          {
            k: "Price given",
            v:
              conversation.amount !== null
                ? formatMoney(conversation.amount, conversation.currency)
                : "None",
          },
        ]
      : [
          { k: "Handled by", v: agentName(conversation.agent) },
          { k: "What it was about", v: AGENT_NOTE[conversation.agent] },
          { k: "Details left", v: conversation.email ? "Yes" : "No" },
          { k: "Chat length", v: length },
        ];

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-line px-6 py-5">
        <div className="min-w-0">
          <h2 className="truncate text-[17px] font-bold tracking-[-0.02em]">
            {conversation.visitor ?? "Someone on your website"}
          </h2>
          {conversation.email ? (
            <a
              href={`mailto:${conversation.email}`}
              className="mt-2 block truncate text-[14px] text-mute transition-colors hover:text-ink"
            >
              {conversation.email}
            </a>
          ) : (
            <p className="mt-2 text-[14px] text-mute">They did not leave contact details</p>
          )}
          <p className="mt-1.5 text-[13px] text-mute">
            {conversation.location} · {relativeTime(conversation.startedAt, CONV_NOW)} at{" "}
            {clockTime(conversation.startedAt)}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-[2px] border px-2.5 py-1.5 text-[12.5px] ${OUTCOME_TONE[conversation.outcome]}`}
        >
          {OUTCOME_LABEL[conversation.outcome]}
        </span>
      </header>

      <dl className="grid shrink-0 grid-cols-2 gap-px border-b border-line bg-line-soft lg:grid-cols-4">
        {meta.map((item) => (
          <div key={item.k} className="bg-surface px-6 py-3">
            <dt className="text-[13px] text-mute">{item.k}</dt>
            <dd className="m-0 mt-1.5 truncate text-[14px] font-medium">{item.v}</dd>
          </div>
        ))}
      </dl>

      <div className="thin-scroll min-h-75 flex-1 space-y-3.5 overflow-y-auto bg-paper px-6 py-5">
        {conversation.messages.map((message, index) => (
          <div key={index} className={message.quote ? "space-y-3" : undefined}>
            {/* A quote turn carries the slip, not prose — skip the empty bubble. */}
            {message.text.trim() ? (
              <Bubble
                role={message.role}
                text={message.text}
                at={message.at}
                agentLabel={AGENT_SHORT[conversation.agent]}
              />
            ) : null}
            {message.quote ? (
              <div className="max-w-[400px]">
                <RateSlip quote={message.quote} compact />
              </div>
            ) : null}
          </div>
        ))}

        {conversation.outcome === "abandoned" ? (
          <p className="border border-dashed border-line px-4 py-3 text-center text-[13px] text-mute">
            They closed the chat without replying
          </p>
        ) : null}
      </div>

      <footer className="shrink-0 border-t border-line px-6 py-4">
        <div className="flex items-center gap-3 border border-line bg-surface px-4 py-3">
          <span className="flex-1 text-[14px] text-mute/70">Reply yourself…</span>
          <button
            type="button"
            className="rounded-[2px] bg-ink px-3.5 py-2 text-[13px] text-paper transition-colors hover:bg-ink-soft"
          >
            Take over
          </button>
        </div>
        <p className="mt-2.5 text-[13px] leading-[1.6] text-mute">
          Taking over pauses {agentName(conversation.agent)} on this chat and hands it to you.
        </p>
      </footer>
    </div>
  );
}

function Bubble({
  role,
  text,
  at,
  agentLabel,
}: {
  role: "agent" | "visitor";
  text: string;
  at: number;
  /** Which agent said it — three of them post here now. */
  agentLabel: string;
}) {
  const visitor = role === "visitor";
  return (
    <div className={`flex flex-col gap-1.5 ${visitor ? "items-end" : "items-start"}`}>
      <p
        className={`m-0 max-w-[min(66ch,88%)] rounded-[3px] px-4 py-2.5 text-[14.5px] leading-[1.55] ${
          visitor ? "bg-ink text-paper" : "border border-line bg-surface text-ink"
        }`}
      >
        {text}
      </p>
      <span className="tnum text-[12px] text-mute">
        {visitor ? "Customer" : agentLabel} · {offsetClock(at)}
      </span>
    </div>
  );
}
