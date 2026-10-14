import { brand } from "@/config/brand";
import { Container } from "@/components/ui/Container";
import { CountUp } from "@/components/ui/CountUp";

export function Stats() {
  return (
    <section className="border-b border-line bg-surface">
      <Container>
        <dl className="grid grid-cols-2 gap-px bg-line-soft lg:grid-cols-4">
          {brand.stats.map((stat) => (
            <div key={stat.label} className="bg-surface px-1 py-10 sm:px-2 lg:px-6">
              <dd className="display text-[clamp(2.4rem,5vw,3.4rem)]">
                <CountUp value={stat.value} />
              </dd>
              <dt className="mt-3 text-[15px] font-medium">{stat.label}</dt>
              <p className="label-sm mt-2 text-mute">{stat.note}</p>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
