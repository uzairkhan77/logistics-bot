import type { Metadata } from "next";
import { Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { brand, brandCssVars } from "@/config/brand";
import "./globals.css";

const display = Schibsted_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const fullName = `${brand.company.name} ${brand.company.nameSuffix}`.trim();

export const metadata: Metadata = {
  title: {
    default: `${fullName} — ${brand.company.tagline}`,
    template: `%s — ${fullName}`,
  },
  description: brand.hero.sub,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable} h-full antialiased`}
      style={brandCssVars() as React.CSSProperties}
    >
      <body className="min-h-full bg-paper text-ink">{children}</body>
    </html>
  );
}
