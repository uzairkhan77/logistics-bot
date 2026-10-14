import Link from "next/link";
import { brand } from "@/config/brand";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/site/Wordmark";

const COLUMNS = [
  {
    title: "Services",
    links: brand.services.map((service) => service.name),
  },
  {
    title: "Company",
    links: ["About us", "Our network", "Compliance", "Careers", "Press"],
  },
  {
    title: "Resources",
    links: ["Incoterms guide", "Customs updates", "Transit calculator", "Track a shipment"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <Container>
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 py-14 sm:py-16 lg:grid-cols-12">
          <div className="col-span-2 lg:col-span-4">
            <Wordmark />
            <p className="mt-5 max-w-[30ch] text-[14.5px] leading-[1.6] text-mute">
              {brand.company.tagline}
            </p>
            <address className="label-sm mt-7 not-italic leading-[1.9] text-mute">
              {brand.contact.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <div className="mt-6 flex flex-col gap-1.5">
              <a href={`mailto:${brand.contact.email}`} className="label-sm text-ink transition-colors hover:text-accent">
                {brand.contact.email}
              </a>
              <a href={`tel:${brand.contact.phone.replace(/\s/g, "")}`} className="label-sm text-ink transition-colors hover:text-accent">
                {brand.contact.phone}
              </a>
            </div>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} className="lg:col-span-2" aria-label={column.title}>
              <h3 className="label-sm text-mute">{column.title}</h3>
              <ul className="mt-5 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#top" className="text-[14px] text-ink-soft transition-colors hover:text-accent">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 lg:col-span-2">
            <h3 className="label-sm text-mute">Certifications</h3>
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {["AEO-F", "IATA", "FIATA", "ISO 9001", "TAPA"].map((cert) => (
                <li key={cert} className="label-sm rounded-[2px] border border-line px-2 py-1.5 text-mute">
                  {cert}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="label-sm flex flex-col gap-3 border-t border-line py-6 text-mute sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {brand.company.founded}–2026 {brand.company.legalName}
          </span>
          <span className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="#top" className="transition-colors hover:text-ink">Terms of carriage</a>
            <a href="#top" className="transition-colors hover:text-ink">Privacy</a>
            <Link href="/admin" className="transition-colors hover:text-ink">Admin view</Link>
          </span>
        </div>
      </Container>
    </footer>
  );
}
