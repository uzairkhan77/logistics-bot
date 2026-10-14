"use client";

import { MODE_LABEL } from "@/config/brand";
import { CONV_NOW, type Conversation } from "@/lib/conversations";
import { relativeTime } from "@/lib/time";
import { OUTCOME_SHORT, OUTCOME_TONE } from "@/components/admin/conversationMeta";
import { AGENT_SHORT, AGENT_TONE } from "@/components/admin/agentMeta";

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="thin-scroll m-0 max-h-[62vh] min-h-0 flex-1 list-none overflow-y-auto p-0 lg:max-h-none">
      {conversations.map((conversation) => {
        const last = conversation.messages[conversation.messages.length - 1];
        const selected = conversation.id === selectedId;
        const route =
          conversation.origin && conversation.destination
            ? `${conversation.origin} → ${conversation.destination}`
            : conversation.origin
              ? `${conversation.origin} → not given`
              : "No route given";

        return (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              aria-current={selected}
              className={`relative w-full border-b border-line-soft px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-paper ${
                selected ? "bg-paper" : ""
              }`}
            >
              <span
                aria-hidden
                className={`absolute left-0 top-0 h-full w-[2px] bg-accent transition-transform duration-200 ${
                  selected ? "scale-y-100" : "scale-y-0"
                }`}
              />

              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[14.5px] font-medium">
                  {conversation.visitor ?? "Someone on your website"}
                </span>
                <span className="shrink-0 text-[12.5px] text-mute">
                  {relativeTime(conversation.startedAt, CONV_NOW)}
                </span>
              </span>

              <span className="mt-2 flex items-center gap-2">
                <span
                  className={`shrink-0 rounded-[2px] border px-1.5 py-0.5 text-[11.5px] ${AGENT_TONE[conversation.agent]}`}
                >
                  {AGENT_SHORT[conversation.agent]}
                </span>
                {/* Only the quote agent fills a route in, so on the other two
                    this would always read "No route given". */}
                {conversation.agent === "quote" ? (
                  <span className="min-w-0 truncate text-[13.5px] text-mute">
                    {route}
                    {conversation.mode ? ` · ${MODE_LABEL[conversation.mode]}` : ""}
                  </span>
                ) : null}
              </span>

              <span className="mt-3 flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-[13px] text-mute">
                  {last
                    ? `${last.role === "visitor" ? "" : `${AGENT_SHORT[conversation.agent]}: `}${last.text}`
                    : "No messages"}
                </span>
                <span
                  className={`shrink-0 rounded-[2px] border px-2 py-1 text-[12px] ${OUTCOME_TONE[conversation.outcome]}`}
                >
                  {OUTCOME_SHORT[conversation.outcome]}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
