"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { Container } from "@/components/ui/Container";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageIntro } from "@/components/admin/PageIntro";
import { SummaryTiles } from "@/components/admin/SummaryTiles";
import { LeadsTable } from "@/components/admin/LeadsTable";
import { LeadDrawer } from "@/components/admin/LeadDrawer";
import {
  getLeadsServerSnapshot,
  getLeadsSnapshot,
  subscribeToDesk,
  updateLeadStatus,
  type Lead,
  type LeadStatus,
} from "@/lib/leads";

export function AdminDashboard() {
  // The demo store lives in localStorage, so the server renders an empty desk
  // and the real rows arrive on hydration.
  const leads = useSyncExternalStore(subscribeToDesk, getLeadsSnapshot, getLeadsServerSnapshot);
  const ready = leads.length > 0;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = leads.find((lead) => lead.id === selectedId) ?? null;

  const handleStatus = useCallback((id: string, status: LeadStatus) => {
    updateLeadStatus(id, status);
  }, []);

  return (
    <AdminShell active="enquiries">
      <Container size="wide">
        <PageIntro
          title="Enquiries"
          blurb="Everyone your agents took details from — priced quotes, tracking queries and new enquiries alike — with what came of it and how to reach them."
        />

        <SummaryTiles leads={leads} ready={ready} />

        <div className="mt-6 pb-16">
          <LeadsTable
            leads={leads}
            ready={ready}
            selectedId={selectedId}
            onSelect={(lead: Lead) => setSelectedId(lead.id)}
          />
        </div>
      </Container>

      <LeadDrawer lead={selected} onClose={() => setSelectedId(null)} onStatus={handleStatus} />
    </AdminShell>
  );
}
