import { brand, MODE_SHORT } from "@/config/brand";

/**
 * A sailing and uplift schedule — the thing a forwarder actually puts on its
 * homepage. Same paperwork language as the rest of the system, but it belongs
 * to the company rather than to the quote agent.
 */
export function ScheduleBoard() {
  const services = brand.lanes.slice(0, 6);

  return (
    <figure className="m-0 border border-ink bg-surface">
      <header className="label flex items-center justify-between border-b border-ink px-4 py-3">
        <span>Schedule</span>
        <span className="flex items-center gap-2 text-mute">
          <i className="block size-[5px] rounded-full bg-accent anim-blink" aria-hidden />
          Updated daily
        </span>
      </header>

      <div className="label-sm grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-line-soft px-4 py-2.5 text-mute">
        <span>Service</span>
        <span className="text-right">Cut-off</span>
        <span className="text-right">Transit</span>
      </div>

      <ul className="m-0 list-none p-0">
        {services.map((lane) => (
          <li
            key={lane.id}
            className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4 border-b border-line-soft px-4 py-3 last:border-b-0"
          >
            <span className="min-w-0">
              <span className="tnum block truncate font-mono text-[13px] font-medium text-ink">
                {lane.originCode} → {lane.destCode}
              </span>
              <span className="label-sm mt-1.5 block text-mute">
                {MODE_SHORT[lane.mode]} · {lane.frequency}
              </span>
            </span>
            <span className="tnum whitespace-nowrap text-right font-mono text-[13px] text-ink-soft">
              {lane.cutOff}
            </span>
            <span className="tnum whitespace-nowrap text-right font-mono text-[13px] text-ink-soft">
              {lane.transitMin}–{lane.transitMax} d
            </span>
          </li>
        ))}
      </ul>

      <figcaption className="label-sm border-t border-line px-4 py-3 text-mute">
        Port to port · excludes customs clearance
      </figcaption>
    </figure>
  );
}
