"use client";

import { brand, MODE_LABEL } from "@/config/brand";
import { Container } from "@/components/ui/Container";
import { useQuoteAgent } from "@/components/chat/QuoteAgentProvider";

export function TradeLanes() {
  const { open } = useQuoteAgent();

  return (
    <section id="lanes" className="border-b border-line bg-surface">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line py-14 sm:py-16">
          <div>
            <p className="label text-accent">Trade lanes</p>
            <h2 className="display mt-4 max-w-[16ch] text-[clamp(1.9rem,4vw,2.9rem)]">
              Where we sail, fly and drive.
            </h2>
          </div>
          <p className="max-w-[40ch] text-[15px] leading-[1.6] text-mute">
            A sample of the {brand.network.lanes} lanes we hold contracted space on. Transit is port
            to port and excludes customs clearance.
          </p>
        </div>
      </Container>

      <div className="overflow-x-auto">
        <Container>
          <table className="w-full min-w-[660px] border-collapse text-left">
            <thead>
              <tr className="label-sm text-mute">
                <th className="py-3 pr-4 font-medium">Lane</th>
                <th className="py-3 pr-4 font-medium">Mode</th>
                <th className="py-3 pr-4 font-medium">Frequency</th>
                <th className="py-3 pr-4 font-medium">Cut-off</th>
                <th className="py-3 text-right font-medium">Transit</th>
              </tr>
            </thead>
            <tbody>
              {brand.lanes.map((lane) => (
                <tr key={lane.id} className="group border-t border-line-soft transition-colors hover:bg-paper">
                  <td className="whitespace-nowrap py-3.5 pr-4">
                    <span className="relative flex items-baseline gap-2.5">
                      <span
                        aria-hidden
                        className="absolute -left-4 top-1/2 h-5 w-[2px] -translate-y-1/2 scale-y-0 bg-accent transition-transform duration-200 group-hover:scale-y-100"
                      />
                      <span className="text-[15px] font-medium">
                        {lane.originCity} → {lane.destCity}
                      </span>
                      <span className="label-sm text-mute">
                        {lane.originCode}·{lane.destCode}
                      </span>
                    </span>
                  </td>
                  <td className="label-sm whitespace-nowrap py-3.5 pr-4 text-ink-soft">
                    {MODE_LABEL[lane.mode]}
                  </td>
                  <td className="label-sm whitespace-nowrap py-3.5 pr-4 text-mute">{lane.frequency}</td>
                  <td className="tnum whitespace-nowrap py-3.5 pr-4 font-mono text-[13px] text-mute">
                    {lane.cutOff}
                  </td>
                  <td className="tnum whitespace-nowrap py-3.5 text-right font-mono text-[13px] font-medium text-ink">
                    {lane.transitMin}–{lane.transitMax} d
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Container>
      </div>

      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line py-6">
          <p className="label-sm text-mute">Not on the list? We price most lanes on request.</p>
          <button
            type="button"
            onClick={open}
            className="label inline-flex h-10 items-center gap-2 rounded-[2px] border border-ink px-4 text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Get a rate for your lane
          </button>
        </div>
      </Container>
    </section>
  );
}
