"use client";

import { brand } from "@/config/brand";
import { Container } from "@/components/ui/Container";
import { GridRules } from "@/components/site/GridRules";
import { ScheduleBoard } from "@/components/site/ScheduleBoard";
import { useQuoteAgent } from "@/components/chat/QuoteAgentProvider";

export function Hero() {
  const { open } = useQuoteAgent();

  return (
    <section id="top" className="relative border-b border-line">
      <Container className="relative">
        <GridRules />

        <div className="relative grid grid-cols-12 items-center py-14 sm:py-20 lg:py-28">
          <div className="col-span-12 lg:col-span-7 lg:pr-12">
            <p className="label anim-rise text-mute">
              {brand.hero.eyebrow}
              <span className="hidden sm:inline"> · {brand.network.countries} countries</span>
            </p>

            <h1 className="display anim-rise mt-7 text-[clamp(2.5rem,6.6vw,4.4rem)] [animation-delay:60ms]">
              {brand.hero.headline}
              <br />
              <span className="text-mute">{brand.hero.headlineMuted}</span>
            </h1>

            <p className="anim-rise mt-6 max-w-[44ch] text-[clamp(1rem,1.35vw,1.1rem)] leading-[1.55] text-mute [animation-delay:120ms]">
              {brand.hero.sub}
            </p>

            <div className="anim-rise mt-9 flex flex-wrap items-center gap-3 [animation-delay:180ms]">
              <button
                type="button"
                onClick={open}
                className="label inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-[2px] bg-accent px-6 text-accent-ink transition-[filter,transform] duration-150 hover:brightness-[0.92] active:translate-y-px sm:w-auto"
              >
                {brand.hero.primaryCta}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <a
                href={`mailto:${brand.contact.email}`}
                className="label inline-flex h-12 w-full items-center justify-center rounded-[2px] border border-ink px-6 text-ink transition-colors duration-150 hover:bg-ink hover:text-paper sm:w-auto"
              >
                {brand.hero.secondaryCta}
              </a>
            </div>

            <ul className="anim-rise mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-line-soft pt-6 [animation-delay:240ms]">
              {brand.credentials.map((item) => (
                <li key={item} className="label-sm text-mute">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="anim-rise col-span-12 mt-12 lg:col-span-5 lg:mt-0 lg:pl-10 [animation-delay:300ms]">
            <ScheduleBoard />
          </div>
        </div>
      </Container>
    </section>
  );
}
