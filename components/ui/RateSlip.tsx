import { MODE_LABEL } from "@/config/brand";
import { formatMoney, type Quote } from "@/lib/rates";

/**
 * Freight paperwork, not a pricing card. The same component carries the hero's
 * sample quote, the chat agent's reply and the lead detail in the dashboard —
 * which is what makes the three surfaces read as one system.
 */
export function RateSlip({ quote, compact = false }: { quote: Quote; compact?: boolean }) {
  const symbol = quote.currency === "EUR" ? "€" : "$";

  return (
    <figure className="m-0 border border-ink bg-surface">
      <header className="label flex items-center justify-between border-b border-ink px-4 py-3">
        <span>Indicative rate</span>
        <span className="text-accent">{quote.reference}</span>
      </header>

      <dl className="m-0">
        <Row k="Origin" v={quote.origin} />
        <Row k="Destination" v={quote.destination} />
        <Row k="Mode" v={`${MODE_LABEL[quote.mode]} · ${quote.basis}`} />
        <Row k="Transit" v={`${quote.transitMin}–${quote.transitMax} days`} />
      </dl>

      {compact ? null : (
        <div className="border-b border-line-soft px-4 py-3">
          {quote.lines.map((line) => (
            <div
              key={line.label}
              className="label flex items-baseline justify-between gap-3 py-1 font-normal tracking-[0.06em] normal-case text-mute"
            >
              <span className="truncate">
                {line.label}
                {line.detail ? <span className="text-mute/70"> · {line.detail}</span> : null}
              </span>
              <span className="tnum shrink-0 text-ink-soft">
                {formatMoney(line.amount, quote.currency)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end justify-between gap-4 px-4 pb-4 pt-5">
        <div>
          <div className="tnum text-[clamp(2rem,5vw,2.75rem)] font-bold leading-none tracking-[-0.04em]">
            {formatMoney(quote.total, quote.currency)}
          </div>
          <div className="label-sm mt-2 text-mute">
            Range {symbol}
            {Math.round(quote.low).toLocaleString("en-US")}–{symbol}
            {Math.round(quote.high).toLocaleString("en-US")}
          </div>
        </div>
        <span className="label-sm pb-1 text-mute">{quote.currency} · all-in</span>
      </div>

      <figcaption className="label-sm border-t border-dashed border-line px-4 py-3 text-mute">
        Estimate — subject to confirmation
      </figcaption>
    </figure>
  );
}

/**
 * The same paperwork with the price withheld, for a lane the desk prices by
 * hand. It has to be unmistakably a different outcome from a priced slip —
 * that difference is the whole point of the automation toggle — so there is no
 * headline figure, no range and no breakdown, only what we can say for certain.
 */
export function RoutedSlip({ quote }: { quote: Quote }) {
  return (
    <figure className="m-0 border border-caution/50 bg-surface">
      <header className="label flex items-center justify-between border-b border-caution/50 bg-caution/8 px-4 py-3 text-caution">
        <span>Priced by your broker</span>
        <span>{quote.reference}</span>
      </header>

      <dl className="m-0">
        <Row k="Origin" v={quote.origin} />
        <Row k="Destination" v={quote.destination} />
        <Row k="Mode" v={MODE_LABEL[quote.mode]} />
        <Row k="Transit" v={`${quote.transitMin}–${quote.transitMax} days`} />
      </dl>

      <p className="m-0 px-4 py-4 text-[13.5px] leading-[1.55] text-ink-soft">
        We don&rsquo;t price this lane automatically. Your enquiry is with our broker desk and a
        member of the team will come back with a firm rate.
      </p>

      <figcaption className="label-sm border-t border-dashed border-line px-4 py-3 text-mute">
        No estimate given — priced on request
      </figcaption>
    </figure>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line-soft px-4 py-2.5">
      <dt className="label-sm text-mute">{k}</dt>
      <dd className="tnum m-0 font-mono text-[13px] font-medium text-ink">{v}</dd>
    </div>
  );
}
