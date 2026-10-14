import { brand } from "@/config/brand";
import { Container } from "@/components/ui/Container";

export function Clients() {
  return (
    <section className="border-b border-line">
      <Container>
        <div className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:gap-10">
          <p className="label-sm shrink-0 text-mute">Moving freight for</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:flex-1 sm:items-center sm:justify-between">
            {brand.clients.map((client) => (
              <li
                key={client}
                className="label text-[12px] tracking-[0.16em] text-mute/70 transition-colors duration-200 hover:text-ink"
              >
                {client}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
