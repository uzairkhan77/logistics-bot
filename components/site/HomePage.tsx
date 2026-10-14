import type { AgentKind } from "@/config/brand";
import { QuoteAgentProvider } from "@/components/chat/QuoteAgentProvider";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Clients } from "@/components/site/Clients";
import { Services } from "@/components/site/Services";
import { Stats } from "@/components/site/Stats";
import { TradeLanes } from "@/components/site/TradeLanes";
import { Network } from "@/components/site/Network";
import { CallToAction } from "@/components/site/CallToAction";
import { Footer } from "@/components/site/Footer";

/**
 * The whole site, shared by every agent route.
 *
 * Each of the three demo pages renders this with a different `agent`. The
 * markup is identical by design — the point of the demo is that only the agent
 * in the corner changes, so the page itself must not.
 */
export function HomePage({ agent }: { agent: AgentKind }) {
  return (
    <QuoteAgentProvider agent={agent}>
      <Header />
      <main>
        <Hero />
        <Clients />
        <Services />
        <Stats />
        <TradeLanes />
        <Network />
        <CallToAction />
      </main>
      <Footer />
    </QuoteAgentProvider>
  );
}
