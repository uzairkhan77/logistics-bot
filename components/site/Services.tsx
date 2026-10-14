import { brand } from "@/config/brand";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
export function Services() {
  return (
    <section id="services" className="border-b border-line">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6 py-14 sm:py-20">
          <div>
            <p className="label text-accent">What we move</p>
            <h2 className="display mt-4 max-w-[18ch] text-[clamp(1.9rem,4vw,2.9rem)]">
              Six desks, one file reference.
            </h2>
          </div>
          <p className="max-w-[42ch] text-[15px] leading-[1.6] text-mute">
            Every mode is run in-house, so a shipment that changes plan mid-route does not change
            hands, and one file reference follows it the whole way.
          </p>
        </div>

        <div className="grid grid-cols-1 border-l border-t border-line sm:grid-cols-2 lg:grid-cols-3">
          {brand.services.map((service, index) => (
            <Reveal key={service.code} delay={index * 60}>
              <article className="group relative flex h-full flex-col border-b border-r border-line bg-surface p-6 transition-colors duration-200 hover:bg-paper sm:p-7">
                <span
                  aria-hidden
                  className="absolute left-0 top-0 h-[2px] w-0 bg-accent transition-[width] duration-300 ease-out group-hover:w-full"
                />
                <span className="label self-start rounded-[2px] border border-line px-2 py-1.5 text-mute transition-colors group-hover:border-accent group-hover:text-accent">
                  {service.code}
                </span>

                <h3 className="mt-7 text-[19px] font-bold leading-tight tracking-[-0.02em]">
                  {service.name}
                </h3>
                <p className="mt-2.5 text-[14.5px] leading-[1.6] text-mute">{service.blurb}</p>

                <ul className="mt-6 border-t border-line-soft">
                  {service.points.map((point) => (
                    <li
                      key={point}
                      className="label-sm flex items-center gap-2 border-b border-line-soft py-2.5 text-mute"
                    >
                      <span className="text-line" aria-hidden>
                        —
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>

              </article>
            </Reveal>
          ))}
        </div>
        <div className="h-14 sm:h-20" />
      </Container>
    </section>
  );
}
