"use client";

import { useCallback, useSyncExternalStore } from "react";
import { brand, MODE_LABEL } from "@/config/brand";
import { Container } from "@/components/ui/Container";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageIntro } from "@/components/admin/PageIntro";
import { Toggle } from "@/components/ui/Toggle";
import {
  getLanesServerSnapshot,
  getLanesSnapshot,
  setLaneOverride,
  subscribeToDesk,
} from "@/lib/leads";

export function AutomationView() {
  const overrides = useSyncExternalStore(subscribeToDesk, getLanesSnapshot, getLanesServerSnapshot);

  const handleToggle = useCallback((id: string, automated: boolean) => {
    setLaneOverride(id, automated);
  }, []);

  const routes = brand.lanes.map((lane) => ({
    lane,
    automated: overrides[lane.id] ?? lane.automated,
  }));
  const on = routes.filter((route) => route.automated).length;

  // This page governs pricing, and only one of the three agents prices.
  const quoteAgent = brand.agents.quote.name;

  return (
    <AdminShell active="automation">
      <Container size="wide">
        <PageIntro
          title="Automation"
          blurb={`Choose which routes ${quoteAgent} is allowed to price on its own. Anything you switch off still gets captured — it just goes to your team to price instead.`}
        />

        <div className="max-w-[820px] pb-16">
          <div className="flex items-center justify-between gap-4 border border-line bg-surface px-6 py-5">
            <p className="text-[15px]">
              <span className="font-medium">{on} of {routes.length} routes</span>{" "}
              <span className="text-mute">are priced by {quoteAgent}</span>
            </p>
            <span className="inline-flex items-center gap-2 rounded-[2px] border border-positive/30 px-2.5 py-1.5 text-[12.5px] text-positive">
              <i className="block size-[5px] rounded-full bg-current" aria-hidden />
              Live on your website
            </span>
          </div>

          <ul className="mt-6 list-none border border-line bg-surface p-0">
            {routes.map(({ lane, automated }) => (
              <li
                key={lane.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-line-soft px-6 py-5 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-[15.5px] font-medium leading-tight">
                    {lane.originCity} → {lane.destCity}
                  </p>
                  <p className="mt-2 text-[13.5px] text-mute">
                    {MODE_LABEL[lane.mode]} · {lane.transitMin}–{lane.transitMax} days
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <span className={`text-[13.5px] ${automated ? "text-ink" : "text-mute"}`}>
                    {automated ? "Quoted automatically" : "Send to my team"}
                  </span>
                  <Toggle
                    checked={automated}
                    onChange={(next) => handleToggle(lane.id, next)}
                    label={`Let ${quoteAgent} quote ${lane.originCity} to ${lane.destCity}`}
                  />
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-5 text-[13.5px] leading-[1.7] text-mute">
            A route you have not listed here is quoted by {quoteAgent} using your default rates, and
            flagged for your team to confirm. Your other two agents never quote, so nothing on this
            page changes what they do.
          </p>
        </div>
      </Container>
    </AdminShell>
  );
}
