"use client";

import { useEffect } from "react";
import { MODE_LABEL } from "@/config/brand";
import { formatMoney } from "@/lib/rates";
import { clockTime, relativeTime } from "@/lib/time";
import { DESK_NOW, type Lead, type LeadStatus } from "@/lib/leads";
import { STATUS_LABEL } from "@/components/admin/LeadsTable";
import { AGENT_NOTE, agentName } from "@/components/admin/agentMeta";

const STATUSES: LeadStatus[] = ["new", "quoted", "won"];

export function LeadDrawer({
  lead,
  onClose,
  onStatus,
}: {
  lead: Lead | null;
  onClose: () => void;
  onStatus: (id: string, status: LeadStatus) => void;
}) {
  useEffect(() => {
    if (!lead) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lead, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-40 bg-ink/25 transition-opacity duration-200 ${
          lead ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-label="Enquiry"
        aria-hidden={!lead}
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-line bg-surface transition-transform duration-200 ease-out sm:w-[460px] ${
          lead ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        {lead ? (
          <>
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-6 py-5">
              <div className="min-w-0">
                <h2 className="truncate text-[18px] font-bold tracking-[-0.02em]">{lead.name}</h2>
                <a
                  href={`mailto:${lead.email}`}
                  className="mt-2 block truncate text-[14px] text-mute transition-colors hover:text-ink"
                >
                  {lead.email}
                </a>
                <p className="mt-1.5 text-[13px] text-mute">
                  Came in {relativeTime(lead.createdAt, DESK_NOW)} at {clockTime(lead.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-8 shrink-0 place-items-center rounded-[2px] text-mute transition-colors hover:bg-paper hover:text-ink"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <div className="thin-scroll flex-1 overflow-y-auto">
              <dl className="m-0 border-b border-line">
                <Row k="Handled by" v={agentName(lead.agent)} />
                {/* Route, mode and price are the quote agent's business. On a
                    tracking or qualification enquiry every one of them reads
                    "Not given", which tells the desk nothing. */}
                {lead.agent === "quote" ? (
                  <>
                    <Row
                      k="Route"
                      v={lead.origin && lead.destination ? `${lead.origin} → ${lead.destination}` : "Not given"}
                    />
                    <Row k="How it moves" v={lead.mode ? MODE_LABEL[lead.mode] : "Not given"} />
                    <Row k="Transit time" v={lead.transit} />
                    <Row k="Quoted" v={lead.amount === null ? "Not quoted" : formatMoney(lead.amount, lead.currency)} />
                    <Row k="Quoted by" v={lead.automated ? agentName("quote") : "Your broker desk"} />
                  </>
                ) : (
                  <>
                    <Row k="What it was about" v={AGENT_NOTE[lead.agent]} />
                    <Row k="Chat length" v={`${lead.transcript.length} messages`} />
                  </>
                )}
              </dl>

              <div className="px-6 py-6">
                <p className="text-[13.5px] text-mute">What they said</p>
                <div className="mt-4 space-y-2.5">
                  {lead.transcript.map((line, index) => (
                    <div key={index} className={`flex ${line.role === "visitor" ? "justify-end" : "justify-start"}`}>
                      <p
                        className={`m-0 max-w-[86%] rounded-[3px] px-3.5 py-2.5 text-[14px] leading-[1.55] ${
                          line.role === "visitor"
                            ? "bg-ink text-paper"
                            : "border border-line bg-paper text-ink"
                        }`}
                      >
                        {line.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <footer className="shrink-0 border-t border-line px-6 py-5">
              <p className="text-[13.5px] text-mute">Mark this enquiry as</p>
              <div className="mt-3 flex gap-2">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onStatus(lead.id, status)}
                    className={`flex-1 rounded-[2px] border px-3 py-2.5 text-[13px] transition-colors ${
                      lead.status === status
                        ? "border-ink bg-ink text-paper"
                        : "border-line text-mute hover:border-ink hover:text-ink"
                    }`}
                  >
                    {STATUS_LABEL[status]}
                  </button>
                ))}
              </div>
            </footer>
          </>
        ) : null}
      </aside>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line-soft px-6 py-3.5 last:border-b-0">
      <dt className="text-[13.5px] text-mute">{k}</dt>
      <dd className="m-0 text-[14px] font-medium text-ink">{v}</dd>
    </div>
  );
}
