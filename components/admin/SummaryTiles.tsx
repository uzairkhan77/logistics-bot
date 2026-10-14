"use client";

import { formatMoney } from "@/lib/rates";
import { DESK_NOW, type Lead } from "@/lib/leads";

/** Four plain figures. No charts — this page is read, not analysed. */
export function SummaryTiles({ leads, ready }: { leads: Lead[]; ready: boolean }) {
  const dayAgo = DESK_NOW - 24 * 60 * 60 * 1000;
  const today = leads.filter((lead) => lead.createdAt >= dayAgo);
  // An enquiry the agent never priced contributes nothing to the total.
  const quotedValue = leads.reduce(
    (sum, lead) => sum + (lead.amount === null ? 0 : lead.currency === "EUR" ? lead.amount * 1.09 : lead.amount),
    0,
  );

  // Only the quote agent can price, so only its enquiries belong in this
  // figure — a tracking question has no lane for anyone to have priced.
  const priceable = leads.filter((lead) => lead.agent === "quote");
  const withoutTeam = priceable.filter((lead) => lead.automated).length;

  const tiles = [
    { label: "Enquiries today", value: ready ? String(today.length) : "—", note: "In the last 24 hours" },
    {
      label: "Contact details captured",
      value: ready ? String(leads.filter((lead) => lead.email).length) : "—",
      note: "Name and email you can follow up",
    },
    {
      label: "Total quoted",
      value: ready ? formatMoney(quotedValue, "USD") : "—",
      note: "Across every priced enquiry below",
    },
    {
      label: "Priced without your team",
      value: ready && priceable.length ? `${Math.round((withoutTeam / priceable.length) * 100)}%` : "—",
      note: "Of the lanes the quote agent handled",
    },
  ];

  return (
    <dl className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="bg-surface px-6 py-6">
          <dt className="text-[13.5px] text-mute">{tile.label}</dt>
          <dd className="tnum mt-3 text-[clamp(1.9rem,3vw,2.4rem)] font-bold leading-none tracking-[-0.035em]">
            {tile.value}
          </dd>
          <p className="mt-3 text-[13px] leading-[1.5] text-mute">{tile.note}</p>
        </div>
      ))}
    </dl>
  );
}
