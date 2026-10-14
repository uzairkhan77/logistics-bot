"use client";

import { brand } from "@/config/brand";
import { Container } from "@/components/ui/Container";
import { useQuoteAgent } from "@/components/chat/QuoteAgentProvider";

export function CallToAction() {
  const { open } = useQuoteAgent();

  return (
    <section id="contact" className="bg-ink text-paper">
      <Container>
        <div className="grid grid-cols-1 items-end gap-10 py-16 sm:py-24 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="label text-accent">Get in touch</p>
            <h2 className="display mt-5 text-[clamp(2rem,4.4vw,3.2rem)]">
              Tell us what you are moving.
            </h2>
            <address className="label-sm mt-8 not-italic leading-[1.9] text-paper/50">
              {brand.contact.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          </div>

          <div className="lg:col-span-5 lg:pl-8">
            <p className="max-w-[38ch] text-[15px] leading-[1.65] text-paper/60">
              Our Rotterdam desk answers within the hour during European working hours. For a figure
              right now, the assistant on this page prices most of our lanes on the spot.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={open}
                className="label inline-flex h-12 items-center gap-2.5 rounded-[2px] bg-accent px-6 text-accent-ink transition-[filter,transform] duration-150 hover:brightness-[0.92] active:translate-y-px"
              >
                {brand.hero.primaryCta}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <a
                href={`tel:${brand.contact.phone.replace(/\s/g, "")}`}
                className="label inline-flex h-12 items-center rounded-[2px] border border-paper/25 px-6 text-paper transition-colors duration-150 hover:border-paper hover:bg-paper hover:text-ink"
              >
                {brand.contact.phone}
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
