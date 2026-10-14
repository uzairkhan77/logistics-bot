/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE ONLY FILE YOU EDIT TO REBRAND THIS DEMO.
 *  Change the company, palette, services and lanes below and the entire
 *  site, chat widget and admin dashboard follow.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Mode = "air" | "fcl" | "lcl" | "road";

/**
 * Which agent is on the page. One per route — the site, the widget and the
 * admin are identical across all three; only the persona and its prompt differ.
 */
export type AgentKind = "quote" | "support" | "capture";

export type Agent = {
  name: string;
  greeting: string;
  /** Shown on the launcher pill and the widget header. */
  status: string;
};

export type Service = {
  /** Short freight code shown as the card's label. Meaningful, not decorative. */
  code: string;
  name: string;
  blurb: string;
  points: string[];
  /** Maps the card to a quotable mode, or null for non-quotable services. */
  mode: Mode | null;
};

export type Lane = {
  id: string;
  originCode: string;
  originCity: string;
  destCode: string;
  destCity: string;
  mode: Mode;
  transitMin: number;
  transitMax: number;
  /** How often the service runs, as it would appear on a schedule. */
  frequency: string;
  /** Booking cut-off, the other half of a real schedule line. */
  cutOff: string;
  /** Base rate: per container (fcl), per kg (air), per cbm (lcl), per pallet (road). */
  baseRate: number;
  currency: "USD" | "EUR";
  /**
   * Whether the agent quotes this lane itself or hands it to a human broker.
   * This is the starting value only — the Automation page in the admin can
   * override it per lane, and that override is what the demo reads at runtime.
   */
  automated: boolean;
};

export type Brand = {
  company: {
    name: string;
    /** Second word of the wordmark, set in a lighter weight. Empty string for one-word names. */
    nameSuffix: string;
    legalName: string;
    tagline: string;
    descriptor: string;
    founded: number;
    domain: string;
  };
  contact: {
    email: string;
    phone: string;
    addressLines: string[];
  };
  /** Every colour in the product resolves from here. */
  palette: {
    paper: string;
    surface: string;
    ink: string;
    inkSoft: string;
    mute: string;
    line: string;
    lineSoft: string;
    accent: string;
    accentInk: string;
    accentWash: string;
    positive: string;
    caution: string;
  };
  network: {
    countries: number;
    lanes: number;
    ownOffices: number;
    agentCountries: number;
  };
  hero: {
    eyebrow: string;
    headline: string;
    headlineMuted: string;
    sub: string;
    primaryCta: string;
    secondaryCta: string;
  };
  credentials: string[];
  stats: { value: string; label: string; note: string }[];
  services: Service[];
  lanes: Lane[];
  coverage: { region: string; hubs: string[] }[];
  clients: string[];
  agents: Record<AgentKind, Agent>;
};

export const brand: Brand = {
  company: {
    name: "Keelson",
    nameSuffix: "Freight",
    legalName: "Keelson Freight Group B.V.",
    tagline: "Ocean, air and road freight, forwarded end to end.",
    descriptor: "Freight forwarding",
    founded: 2009,
    domain: "keelsonfreight.com",
  },

  contact: {
    email: "quotes@keelsonfreight.com",
    phone: "+31 10 340 2288",
    addressLines: ["Waalhaven Oostzijde 81", "3087 BM Rotterdam", "Netherlands"],
  },

  palette: {
    paper: "#F7F6F3",
    surface: "#FFFFFF",
    ink: "#101113",
    inkSoft: "#3A3B3F",
    mute: "#6B6C70",
    line: "#DAD7D0",
    lineSoft: "#E8E6E1",
    accent: "#FF4A17",
    accentInk: "#FFFFFF",
    accentWash: "#FFF0EA",
    positive: "#0F7355",
    caution: "#9A6300",
  },

  network: {
    countries: 94,
    lanes: 340,
    ownOffices: 11,
    agentCountries: 83,
  },

  hero: {
    eyebrow: "Freight forwarding since 2009",
    headline: "Cargo moved with certainty,",
    headlineMuted: "origin to door.",
    sub: "Ocean, air, road and customs, all handled in-house, on contracted lanes into 94 countries.",
    primaryCta: "Get an instant quote",
    secondaryCta: "Talk to our team",
  },

  /** Sits under the hero buttons. Credentials, not product claims. */
  credentials: ["AEO-F certified", "IATA & FIATA member", "ISO 9001:2015", "Own offices in 11 countries"],

  stats: [
    { value: "94", label: "Countries served", note: "Own offices in 11" },
    { value: "210k", label: "Shipments a year", note: "Ocean, air and road" },
    { value: "340", label: "Contracted lanes", note: "Reviewed weekly" },
    { value: "99.2%", label: "On-time collection", note: "Rolling 12 months" },
  ],

  services: [
    {
      code: "AIR",
      name: "Air freight",
      blurb: "Consolidated and direct uplift on scheduled and charter capacity.",
      points: ["Next-flight-out", "Consolidations", "Temperature control"],
      mode: "air",
    },
    {
      code: "FCL",
      name: "Ocean FCL",
      blurb: "Contracted allocation on the main east–west and north–south trades.",
      points: ["20', 40', 40HC", "Reefer & special", "Weekly sailings"],
      mode: "fcl",
    },
    {
      code: "LCL",
      name: "Ocean LCL",
      blurb: "Own-controlled boxes on the high-volume lanes, weekly cut-offs.",
      points: ["Per CBM pricing", "Fixed cut-offs", "Direct deconsolidation"],
      mode: "lcl",
    },
    {
      code: "RD",
      name: "Road freight",
      blurb: "Full and part loads across Europe with live milestone tracking.",
      points: ["FTL & LTL", "Cross-dock", "ADR certified"],
      mode: "road",
    },
    {
      code: "WH",
      name: "Warehousing",
      blurb: "Bonded and free-circulation storage at port and inland sites.",
      points: ["Bonded storage", "Pick & pack", "Inventory API"],
      mode: null,
    },
    {
      code: "CUS",
      name: "Customs brokerage",
      blurb: "In-house declarations, classification and duty-deferment advice.",
      points: ["Import & export", "AEO certified", "Duty deferment"],
      mode: null,
    },
  ],

  lanes: [
    { id: "sin-rtm-fcl", originCode: "SGSIN", originCity: "Singapore",  destCode: "NLRTM", destCity: "Rotterdam",   mode: "fcl",  transitMin: 26, transitMax: 30, frequency: "Weekly",    cutOff: "Tue 14:00", baseRate: 2140, currency: "USD", automated: true },
    { id: "hkg-lhr-air", originCode: "HKHKG", originCity: "Hong Kong",  destCode: "GBLHR", destCity: "London",      mode: "air",  transitMin: 3,  transitMax: 5,  frequency: "Daily",     cutOff: "24 h",      baseRate: 3.85, currency: "USD", automated: true },
    { id: "sha-lax-fcl", originCode: "CNSHA", originCity: "Shanghai",   destCode: "USLAX", destCity: "Los Angeles", mode: "fcl",  transitMin: 16, transitMax: 20, frequency: "2× weekly", cutOff: "Wed 12:00", baseRate: 1690, currency: "USD", automated: true },
    { id: "ams-mil-road",originCode: "NLAMS", originCity: "Amsterdam",  destCode: "ITMIL", destCity: "Milan",       mode: "road", transitMin: 2,  transitMax: 3,  frequency: "Daily",     cutOff: "16:00",     baseRate: 780,  currency: "EUR", automated: true },
    { id: "nsa-ham-lcl", originCode: "CNNSA", originCity: "Ningbo",     destCode: "DEHAM", destCity: "Hamburg",     mode: "lcl",  transitMin: 30, transitMax: 34, frequency: "Weekly",    cutOff: "Thu 10:00", baseRate: 96,   currency: "USD", automated: true },
    { id: "jeb-rtm-fcl", originCode: "AEJEA", originCity: "Jebel Ali",  destCode: "NLRTM", destCity: "Rotterdam",   mode: "fcl",  transitMin: 18, transitMax: 22, frequency: "Weekly",    cutOff: "Mon 15:00", baseRate: 1480, currency: "USD", automated: true },
    { id: "bom-jfk-air", originCode: "INBOM", originCity: "Mumbai",     destCode: "USJFK", destCity: "New York",    mode: "air",  transitMin: 4,  transitMax: 6,  frequency: "5× weekly", cutOff: "24 h",      baseRate: 4.40, currency: "USD", automated: false },
    { id: "sao-rtm-fcl", originCode: "BRSSZ", originCity: "Santos",     destCode: "NLRTM", destCity: "Rotterdam",   mode: "fcl",  transitMin: 21, transitMax: 25, frequency: "Weekly",    cutOff: "Fri 11:00", baseRate: 1920, currency: "USD", automated: false },
  ],

  coverage: [
    { region: "Asia Pacific",   hubs: ["SGSIN", "HKHKG", "CNSHA", "CNNSA", "CNSZX", "VNSGN", "JPTYO", "KRPUS"] },
    { region: "Europe",         hubs: ["NLRTM", "DEHAM", "BEANR", "GBFXT", "ESVLC", "ITGOA", "FRLEH", "PLGDN"] },
    { region: "Middle East",    hubs: ["AEJEA", "SAJED", "OMSLL", "TRIST", "QAHMD"] },
    { region: "Americas",       hubs: ["USLAX", "USNYC", "USSAV", "BRSSZ", "MXZLO", "CAVAN"] },
  ],

  clients: ["MERIDIAN", "KOPPEL & SONS", "VANTA GROUP", "ATLAS AGRI", "NORDKRAFT", "SEVENOAKS"],

  agents: {
    quote: {
      name: "Keelson Assistant",
      greeting:
        "Hi — I can price a shipment for you right now. Which port or city is it moving from?",
      status: "Replies instantly",
    },
    support: {
      name: "Keelson Support",
      greeting:
        "Hi — I can help with tracking, transit times, cut-offs and paperwork. What do you need a hand with?",
      status: "Replies instantly",
    },
    capture: {
      name: "Keelson Enquiries",
      greeting:
        "Hi — tell me a little about what you move and I'll get the right person onto it. What are you shipping, and where to?",
      status: "Replies instantly",
    },
  },
};

export const MODE_LABEL: Record<Mode, string> = {
  air: "Air freight",
  fcl: "Ocean FCL",
  lcl: "Ocean LCL",
  road: "Road freight",
};

export const MODE_SHORT: Record<Mode, string> = {
  air: "Air",
  fcl: "FCL",
  lcl: "LCL",
  road: "Road",
};

/** CSS custom properties written onto <html> so every surface reads the palette. */
export function brandCssVars(b: Brand = brand): Record<string, string> {
  return {
    "--brand-paper": b.palette.paper,
    "--brand-surface": b.palette.surface,
    "--brand-ink": b.palette.ink,
    "--brand-ink-soft": b.palette.inkSoft,
    "--brand-mute": b.palette.mute,
    "--brand-line": b.palette.line,
    "--brand-line-soft": b.palette.lineSoft,
    "--brand-accent": b.palette.accent,
    "--brand-accent-ink": b.palette.accentInk,
    "--brand-accent-wash": b.palette.accentWash,
    "--brand-positive": b.palette.positive,
    "--brand-caution": b.palette.caution,
  };
}
