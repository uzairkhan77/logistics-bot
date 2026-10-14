"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { brand } from "@/config/brand";
import { Container } from "@/components/ui/Container";
import { resetDemoData } from "@/lib/leads";
import { resetConversations } from "@/lib/conversations";

export type AdminTab = "enquiries" | "conversations" | "automation";

/** Three tabs, each doing one thing, so the page never has to be explained. */
const TABS: { key: AdminTab; label: string; href: string }[] = [
  { key: "enquiries", label: "Enquiries", href: "/admin" },
  { key: "conversations", label: "Conversations", href: "/admin/conversations" },
  { key: "automation", label: "Automation", href: "/admin/automation" },
];

export function AdminShell({ children, active }: { children: ReactNode; active: AdminTab }) {
  // A clean reset restores the same seeded rows it started with, so without a
  // word of confirmation the button looks as though it did nothing.
  const [justReset, setJustReset] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const resetAll = useCallback(() => {
    resetDemoData();
    resetConversations();
    setJustReset(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setJustReset(false), 2600);
  }, []);

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <Container size="wide" className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-baseline gap-3">
            <span className="text-[18px] font-bold tracking-[-0.03em]">{brand.company.name}</span>
            {/* Three agents feed this desk now, so it cannot be named after one. */}
            <span className="text-[14px] text-mute">Agent desk</span>
          </div>

          <div className="flex items-center gap-3">
            <span
              role="status"
              aria-live="polite"
              className={`hidden text-[13px] text-positive transition-opacity duration-200 sm:inline ${
                justReset ? "opacity-100" : "opacity-0"
              }`}
            >
              {justReset ? "Demo reset to its starting state" : ""}
            </span>
            <button
              type="button"
              onClick={resetAll}
              className="hidden h-9 items-center rounded-[2px] border border-line px-3 text-[13px] text-mute transition-colors hover:border-ink hover:text-ink sm:inline-flex"
            >
              Reset demo
            </button>
            <Link
              href="/"
              className="inline-flex h-9 items-center rounded-[2px] border border-line px-3 text-[13px] text-mute transition-colors hover:border-ink hover:text-ink"
            >
              View website
            </Link>
          </div>
        </Container>

        <Container size="wide">
          <nav className="-mb-px flex gap-7 overflow-x-auto" aria-label="Sections">
            {TABS.map((tab) => (
              <Link
                key={tab.key}
                href={tab.href}
                aria-current={active === tab.key ? "page" : undefined}
                className={`whitespace-nowrap border-b-2 pb-3 pt-1 text-[14.5px] transition-colors ${
                  active === tab.key
                    ? "border-accent font-medium text-ink"
                    : "border-transparent text-mute hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </Container>
      </header>
      {children}
    </div>
  );
}
