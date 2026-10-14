import { brand } from "@/config/brand";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { NetworkChart } from "@/components/site/NetworkChart";

export function Network() {
  return (
    <section id="network" className="border-b border-line">
      <Container>
        <div className="grid grid-cols-1 gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <p className="label text-accent">Network</p>
            <h2 className="display mt-4 max-w-[16ch] text-[clamp(1.9rem,4vw,2.9rem)]">
              Own offices where it matters, agents where it does not.
            </h2>
            <p className="mt-5 max-w-[48ch] text-[15px] leading-[1.65] text-mute">
              {brand.network.ownOffices} of our own offices sit on the lanes that carry most of our
              volume. Everywhere else we work with agents we have used for a decade or more.
            </p>
            <Reveal className="mt-10">
              <NetworkChart />
            </Reveal>
          </div>

          <div className="lg:col-span-5 lg:pl-8">
            <div className="border-t border-line">
              {brand.coverage.map((region) => (
                <div key={region.region} className="border-b border-line py-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-[15px] font-medium">{region.region}</h3>
                    <span className="label-sm tnum text-mute">{region.hubs.length} hubs</span>
                  </div>
                  <ul className="mt-3.5 flex flex-wrap gap-1.5">
                    {region.hubs.map((hub) => (
                      <li
                        key={hub}
                        className="label-sm rounded-[2px] border border-line-soft bg-surface px-2 py-1.5 text-mute"
                      >
                        {hub}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="label-sm mt-5 text-mute">
              Plus agent coverage in a further {brand.network.agentCountries} countries
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
