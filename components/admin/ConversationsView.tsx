"use client";

import { useState, useSyncExternalStore } from "react";
import type { AgentKind } from "@/config/brand";
import { Container } from "@/components/ui/Container";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageIntro } from "@/components/admin/PageIntro";
import { ConversationList } from "@/components/admin/ConversationList";
import { ConversationThread } from "@/components/admin/ConversationThread";
import { AGENT_KINDS, AGENT_SHORT } from "@/components/admin/agentMeta";
import {
  getConversationsServerSnapshot,
  getConversationsSnapshot,
  subscribeToConversations,
  type ConversationOutcome,
} from "@/lib/conversations";

const FILTERS: { key: ConversationOutcome | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "captured", label: "Details left" },
  { key: "quoted", label: "Price only" },
  { key: "abandoned", label: "Left" },
];

export function ConversationsView() {
  const conversations = useSyncExternalStore(
    subscribeToConversations,
    getConversationsSnapshot,
    getConversationsServerSnapshot,
  );

  const [filter, setFilter] = useState<ConversationOutcome | "all">("all");
  // How a chat ended and which agent held it are separate questions, so the
  // two chip groups narrow independently.
  const [agent, setAgent] = useState<AgentKind | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = conversations.filter(
    (c) => (filter === "all" || c.outcome === filter) && (agent === "all" || c.agent === agent),
  );
  const selected = rows.find((c) => c.id === selectedId) ?? rows[0] ?? null;

  const priced = conversations.filter((c) => c.amount !== null).length;
  const captured = conversations.filter((c) => c.email).length;

  const tiles = [
    { label: "Conversations", value: conversations.length, note: "Across all three of your agents" },
    { label: "Got a price", value: priced, note: "The quote agent priced them" },
    { label: "Left their details", value: captured, note: "Now on your enquiries list" },
  ];

  return (
    <AdminShell active="conversations">
      <Container size="wide">
        <PageIntro
          title="Conversations"
          blurb="Every chat your agents had on your website, word for word — quotes, tracking queries and new enquiries, including the people who asked and then left."
        />

        <dl className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-3">
          {tiles.map((tile) => (
            <div key={tile.label} className="bg-surface px-6 py-6">
              <dt className="text-[13.5px] text-mute">{tile.label}</dt>
              <dd className="tnum mt-3 text-[clamp(1.9rem,3vw,2.4rem)] font-bold leading-none tracking-[-0.035em]">
                {conversations.length ? tile.value : "—"}
              </dd>
              <p className="mt-3 text-[13px] leading-[1.5] text-mute">{tile.note}</p>
            </div>
          ))}
        </dl>

        <div className="mt-6 grid grid-cols-1 gap-6 pb-16 lg:grid-cols-12">
          <section className="flex flex-col border border-line bg-surface lg:col-span-4 lg:h-[calc(100vh-232px)] lg:min-h-165" aria-label="Conversations">
            <header className="shrink-0 space-y-2 border-b border-line px-5 py-4">
              <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter conversations">
                {FILTERS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={filter === item.key}
                    onClick={() => {
                      setFilter(item.key);
                      setSelectedId(null);
                    }}
                    className={`rounded-[2px] border px-2.5 py-1.5 text-[13px] transition-colors ${
                      filter === item.key
                        ? "border-ink bg-ink text-paper"
                        : "border-line text-mute hover:border-ink hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filter by agent">
                <span className="mr-1 text-[13px] text-mute">Agent</span>
                {(["all", ...AGENT_KINDS] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={agent === key}
                    onClick={() => {
                      setAgent(key);
                      setSelectedId(null);
                    }}
                    className={`rounded-[2px] border px-2.5 py-1.5 text-[13px] transition-colors ${
                      agent === key
                        ? "border-ink bg-ink text-paper"
                        : "border-line text-mute hover:border-ink hover:text-ink"
                    }`}
                  >
                    {key === "all" ? "All" : AGENT_SHORT[key]}
                  </button>
                ))}
              </div>
            </header>

            {conversations.length === 0 ? (
              <p className="px-5 py-12 text-center text-[14px] text-mute">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="px-5 py-12 text-center text-[14px] text-mute">Nothing here yet</p>
            ) : (
              <ConversationList
                conversations={rows}
                selectedId={selected?.id ?? null}
                onSelect={setSelectedId}
              />
            )}
          </section>

          <section className="border border-line bg-surface lg:col-span-8 lg:h-[calc(100vh-232px)] lg:min-h-165" aria-label="Conversation">
            <ConversationThread conversation={selected} />
          </section>
        </div>
      </Container>
    </AdminShell>
  );
}
