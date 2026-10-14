"use client";

import { useState } from "react";
import { MODE_LABEL, type AgentKind } from "@/config/brand";
import { formatMoney } from "@/lib/rates";
import { relativeTime } from "@/lib/time";
import { DESK_NOW, type Lead, type LeadStatus } from "@/lib/leads";
import { AGENT_KINDS, AGENT_SHORT, AGENT_TONE } from "@/components/admin/agentMeta";

/** Plain words a freight desk uses, not the state machine's names. */
export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "Needs a reply",
  quoted: "Replied",
  won: "Booked",
};

const STATUS_TONE: Record<LeadStatus, string> = {
  new: "border-accent/40 bg-accent-wash text-accent",
  quoted: "border-line text-mute",
  won: "border-positive/30 text-positive",
};

const FILTERS: { key: LeadStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "Needs a reply" },
  { key: "quoted", label: "Replied" },
  { key: "won", label: "Booked" },
];

export function LeadsTable({
  leads,
  ready,
  selectedId,
  onSelect,
}: {
  leads: Lead[];
  ready: boolean;
  selectedId: string | null;
  onSelect: (lead: Lead) => void;
}) {
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  // Which agent took it and where it has got to are separate questions, so the
  // two rows of chips narrow independently.
  const [agent, setAgent] = useState<AgentKind | "all">("all");

  const rows = leads.filter(
    (lead) =>
      (filter === "all" || lead.status === filter) && (agent === "all" || lead.agent === agent),
  );

  return (
    <section className="border border-line bg-surface" aria-labelledby="enquiries">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4">
        <h2 id="enquiries" className="text-[15.5px] font-bold tracking-[-0.02em]">
          Enquiries
        </h2>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter enquiries">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={filter === item.key}
              onClick={() => setFilter(item.key)}
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
      </header>

      <div
        className="flex flex-wrap items-center gap-1.5 border-b border-line-soft px-5 py-3"
        role="tablist"
        aria-label="Filter by agent"
      >
        <span className="mr-1 text-[13px] text-mute">Agent</span>
        {(["all", ...AGENT_KINDS] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={agent === key}
            onClick={() => setAgent(key)}
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line text-[13px] text-mute">
              <th className="whitespace-nowrap px-5 py-3 font-normal">Customer</th>
              <th className="whitespace-nowrap px-5 py-3 font-normal">Agent</th>
              <th className="whitespace-nowrap px-5 py-3 font-normal">Route</th>
              <th className="whitespace-nowrap px-5 py-3 text-right font-normal">Quoted</th>
              <th className="whitespace-nowrap px-5 py-3 font-normal">Received</th>
              <th className="whitespace-nowrap px-5 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {!ready ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-[14px] text-mute">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-[14px] text-mute">
                  Nothing here yet
                </td>
              </tr>
            ) : (
              rows.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => onSelect(lead)}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(lead);
                    }
                  }}
                  className={`group cursor-pointer border-b border-line-soft transition-colors last:border-b-0 hover:bg-paper ${
                    selectedId === lead.id ? "bg-paper" : ""
                  }`}
                >
                  <td className="relative px-5 py-4">
                    <span
                      aria-hidden
                      className={`absolute left-0 top-1/2 h-8 w-[2px] -translate-y-1/2 bg-accent transition-transform duration-200 ${
                        selectedId === lead.id ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"
                      }`}
                    />
                    <span className="block max-w-[220px] truncate text-[14.5px] font-medium leading-tight">
                      {lead.name}
                    </span>
                    <span className="mt-1.5 block max-w-[220px] truncate text-[13px] text-mute">
                      {lead.email}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={`inline-block rounded-[2px] border px-2 py-1 text-[12.5px] ${AGENT_TONE[lead.agent]}`}
                    >
                      {AGENT_SHORT[lead.agent]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="block text-[14.5px] leading-tight">
                      {lead.origin && lead.destination ? `${lead.origin} → ${lead.destination}` : "Not given"}
                    </span>
                    <span className="mt-1.5 block text-[13px] text-mute">
                      {lead.mode ? MODE_LABEL[lead.mode] : "No lane discussed"}
                    </span>
                  </td>
                  <td className="tnum whitespace-nowrap px-5 py-4 text-right text-[14.5px] font-medium">
                    {lead.amount === null ? (
                      <span className="text-mute">—</span>
                    ) : (
                      formatMoney(lead.amount, lead.currency)
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-[13.5px] text-mute">
                    {relativeTime(lead.createdAt, DESK_NOW)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-1.5 text-[12.5px] ${STATUS_TONE[lead.status]}`}
                    >
                      <i className="block size-[5px] rounded-full bg-current" aria-hidden />
                      {STATUS_LABEL[lead.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="border-t border-line px-5 py-4 text-[13px] text-mute">
        Click any row to read the conversation and change its status.
      </p>
    </section>
  );
}
