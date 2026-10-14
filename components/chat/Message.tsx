import { RateSlip, RoutedSlip } from "@/components/ui/RateSlip";
import type { ChatMessage } from "@/lib/agent";

export function Message({ message }: { message: ChatMessage }) {
  if (message.role === "visitor") {
    return (
      <div className="anim-rise flex justify-end">
        <p className="m-0 max-w-[85%] rounded-[3px] bg-ink px-3.5 py-2.5 text-[14px] leading-[1.5] text-paper">
          {message.text}
        </p>
      </div>
    );
  }

  if (message.kind === "quote") {
    // A lane switched off in the admin must not look like a priced one.
    return (
      <div className="anim-rise">
        {message.quote.automated ? (
          <RateSlip quote={message.quote} />
        ) : (
          <RoutedSlip quote={message.quote} />
        )}
      </div>
    );
  }

  if (message.kind === "handoff") {
    return (
      <div className="anim-rise label-sm flex items-center gap-2 border border-positive/30 bg-positive/8 px-3 py-2.5 text-positive">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 12.5l5.5 5.5L20 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {message.text}
      </div>
    );
  }

  return (
    <div className="anim-rise flex justify-start">
      <p className="m-0 max-w-[88%] rounded-[3px] border border-line bg-paper px-3.5 py-2.5 text-[14px] leading-[1.55] text-ink">
        {message.text}
      </p>
    </div>
  );
}

export function Typing() {
  return (
    <div className="flex justify-start">
      <div className="label-sm flex items-center gap-2 rounded-[3px] border border-line bg-paper px-3 py-2.5 text-mute">
        <span className="flex gap-1" aria-hidden>
          <i className="block size-[4px] animate-pulse rounded-full bg-mute [animation-delay:0ms]" />
          <i className="block size-[4px] animate-pulse rounded-full bg-mute [animation-delay:160ms]" />
          <i className="block size-[4px] animate-pulse rounded-full bg-mute [animation-delay:320ms]" />
        </span>
        Pricing
      </div>
    </div>
  );
}
