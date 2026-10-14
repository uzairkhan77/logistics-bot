"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { brand } from "@/config/brand";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/site/Wordmark";
import { useQuoteAgent } from "@/components/chat/QuoteAgentProvider";

const NAV = [
  { label: "Services", href: "#services" },
  { label: "Trade lanes", href: "#lanes" },
  { label: "Network", href: "#network" },
  { label: "Contact", href: "#contact" },
];

export function Header() {
  const { open } = useQuoteAgent();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Utility strip — the detail that makes a forwarder's site read as operational. */}
      <div className="hidden border-b border-line bg-paper lg:block">
        <Container className="label-sm flex h-9 items-center justify-between text-mute">
          <span className="flex items-center gap-2">
            <i className="block size-[5px] rounded-full bg-accent anim-blink" aria-hidden />
            Operations desk open 24/7
          </span>
          <span className="flex items-center gap-5">
            <a href={`tel:${brand.contact.phone.replace(/\s/g, "")}`} className="transition-colors hover:text-ink">
              {brand.contact.phone}
            </a>
            <a href={`mailto:${brand.contact.email}`} className="transition-colors hover:text-ink">
              {brand.contact.email}
            </a>
          </span>
        </Container>
      </div>

      <header
        className={`sticky top-0 z-40 border-b bg-paper/92 backdrop-blur-md transition-[border-color,box-shadow] duration-200 ${
          scrolled ? "border-line shadow-[0_1px_0_rgba(16,17,19,0.04)]" : "border-line-soft"
        }`}
      >
        <Container className="flex h-16 items-center justify-between gap-6">
          <a href="#top" className="shrink-0" aria-label={`${brand.company.name} home`}>
            <Wordmark />
          </a>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="label relative text-mute transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-accent after:transition-[width] after:duration-200 hover:text-ink hover:after:w-full"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="label hidden h-10 items-center rounded-[2px] border border-line px-3 text-mute transition-colors hover:border-ink hover:text-ink lg:inline-flex"
            >
              Admin
            </Link>
            <button
              type="button"
              onClick={open}
              className="label inline-flex h-10 items-center gap-2 rounded-[2px] bg-accent px-4 text-accent-ink transition-[filter,transform] duration-150 hover:brightness-[0.92] active:translate-y-px"
            >
              Instant quote
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              className="grid size-10 place-items-center rounded-[2px] border border-line text-ink md:hidden"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                {menuOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </Container>

        {menuOpen ? (
          <div className="border-t border-line bg-paper md:hidden">
            <Container className="flex flex-col py-2">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="label border-b border-line-soft py-4 text-ink-soft"
                >
                  {item.label}
                </a>
              ))}
              <Link href="/admin" className="label py-4 text-mute">
                Admin view
              </Link>
            </Container>
          </div>
        ) : null}
      </header>
    </>
  );
}
