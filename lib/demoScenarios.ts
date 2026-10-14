import { brand, type AgentKind, type Mode } from "@/config/brand";
import { computeQuote, formatMoney, type Quote, type QuoteInput } from "@/lib/rates";

/**
 * One source of truth for the seeded demo.
 *
 * Both the enquiries list and the conversations inbox are built from these, so
 * a customer can never show one figure on one page and a different figure on
 * the other — which is exactly the sort of thing a prospect spots.
 */

export type ScenarioOutcome = "captured" | "quoted" | "broker" | "abandoned";
export type ScenarioLeadStatus = "new" | "quoted" | "won";

export type ScenarioLine = {
  role: "agent" | "visitor";
  /** Seconds after the conversation opened. */
  at: number;
  text: string;
  /** Marks the turn that carried the priced slip. */
  showQuote?: boolean;
};

export type Scenario = {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  /** Which of the three agents held this chat. Only `quote` ever prices. */
  agent: AgentKind;
  location: string;
  origin: string | null;
  destination: string | null;
  mode: Mode | null;
  quote: Quote | null;
  outcome: ScenarioOutcome;
  /** Absent when the visitor never left contact details. */
  leadStatus: ScenarioLeadStatus | null;
  minutesAgo: number;
  lines: ScenarioLine[];
};

/** Each agent opens the way it really does, straight from the brand config. */
const GREETING = brand.agents.quote.greeting;
const SUPPORT_GREETING = brand.agents.support.greeting;
const CAPTURE_GREETING = brand.agents.capture.greeting;

function price(reference: string, input: QuoteInput): Quote {
  return computeQuote({ ...input, reference });
}

/** Handed the quote so every figure in the copy comes from the same number. */
function offer(quote: Quote): string {
  return `That is ${formatMoney(quote.total, quote.currency)} all-in, ${quote.transitMin}–${quote.transitMax} days port to port. Want a broker to confirm it and send a sailing schedule? Just your name to start.`;
}

const priyaQuote = price("KL-Q-4821", {
  origin: "Singapore", destination: "Rotterdam", mode: "fcl", containers: 1, containerType: "40HC",
});
const anonShaQuote = price("KL-Q-6081", {
  origin: "Shanghai", destination: "Los Angeles", mode: "fcl", containers: 2, containerType: "40HC",
});
const tomasQuote = price("KL-Q-2094", {
  origin: "Hong Kong", destination: "London", mode: "air", weightKg: 1200,
});
const isabelleQuote = price("KL-Q-7310", {
  origin: "Amsterdam", destination: "Milan", mode: "road", weightKg: 3000,
});
const danielQuote = price("KL-Q-3355", {
  origin: "Santos", destination: "Rotterdam", mode: "fcl", containers: 1, containerType: "40HC",
});
const meiQuote = price("KL-Q-6602", {
  origin: "Ningbo", destination: "Hamburg", mode: "lcl", volumeCbm: 12,
});
const georgQuote = price("KL-Q-1188", {
  origin: "Shanghai", destination: "Los Angeles", mode: "fcl", containers: 1, containerType: "40GP",
});

export const SCENARIOS: Scenario[] = [
  {
    id: "cv-1183",
    agent: "quote",
    name: "Priya Raman",
    email: "p.raman@meridiancomponents.com",
    company: "Meridian Components",
    location: "Singapore, SG · Chrome on macOS",
    origin: "Singapore",
    destination: "Rotterdam",
    mode: "fcl",
    quote: priyaQuote,
    outcome: "captured",
    leadStatus: "new",
    minutesAgo: 14,
    lines: [
      { role: "agent", at: 0, text: GREETING },
      { role: "visitor", at: 19, text: "Singapore" },
      { role: "agent", at: 21, text: "Singapore — and where is it heading?" },
      { role: "visitor", at: 31, text: "Rotterdam" },
      { role: "agent", at: 33, text: "Singapore to Rotterdam. How would you like it moved?" },
      { role: "visitor", at: 38, text: "Ocean FCL" },
      { role: "agent", at: 40, text: "How many containers, and which size?" },
      { role: "visitor", at: 52, text: "just one 40HC" },
      { role: "agent", at: 55, text: "Ocean FCL on our SIN–RTM lane, per 40HC. Here is where that prices:", showQuote: true },
      { role: "agent", at: 57, text: offer(priyaQuote) },
      { role: "visitor", at: 74, text: "Priya Raman" },
      { role: "agent", at: 76, text: "Thanks Priya. What is the best email to send the confirmed rate to?" },
      { role: "visitor", at: 88, text: "p.raman@meridiancomponents.com" },
      { role: "agent", at: 90, text: `Done, Priya. I have passed KL-Q-4821 to the Keelson desk with your details — someone will come back with the confirmed rate and a sailing schedule, usually within the hour.` },
    ],
  },
  {
    id: "cv-1184",
    agent: "support",
    name: "Hendrik Vos",
    email: "h.vos@koppelandsons.de",
    company: "Koppel & Sons",
    location: "Bremen, DE · Chrome on Windows",
    origin: null,
    destination: null,
    mode: null,
    quote: null,
    outcome: "captured",
    leadStatus: "new",
    minutesAgo: 26,
    lines: [
      { role: "agent", at: 0, text: SUPPORT_GREETING },
      { role: "visitor", at: 15, text: "Where has my container got to? Booking NLX-88213, Ningbo to Hamburg" },
      { role: "agent", at: 18, text: "Our Ningbo–Hamburg LCL runs 30–34 days on a weekly departure. I cannot see live milestones from this chat, but a colleague can pull NLX-88213 up for you — what is your name?" },
      { role: "visitor", at: 37, text: "Hendrik Vos" },
      { role: "agent", at: 39, text: "Thanks Hendrik. What email should they come back to?" },
      { role: "visitor", at: 51, text: "h.vos@koppelandsons.de" },
      { role: "agent", at: 53, text: "Passed to the desk, Hendrik. Someone will email you the latest milestones on NLX-88213 shortly." },
    ],
  },
  {
    id: "cv-1182",
    agent: "quote",
    name: null,
    email: null,
    company: null,
    location: "Hamburg, DE · Safari on iPhone",
    origin: "Shanghai",
    destination: "Los Angeles",
    mode: "fcl",
    quote: anonShaQuote,
    outcome: "quoted",
    leadStatus: null,
    minutesAgo: 38,
    lines: [
      { role: "agent", at: 0, text: GREETING },
      { role: "visitor", at: 24, text: "shanghai to LA, 2 x 40hc" },
      { role: "agent", at: 27, text: "Ocean FCL on our SHA–LAX lane, 2 × 40HC. Here is where that prices:", showQuote: true },
      { role: "agent", at: 29, text: offer(anonShaQuote) },
    ],
  },
  {
    id: "cv-1181",
    agent: "quote",
    name: "Tomas Berg",
    email: "tomas@nordkraft.se",
    company: "Nordkraft AB",
    location: "Stockholm, SE · Chrome on Windows",
    origin: "Hong Kong",
    destination: "London",
    mode: "air",
    quote: tomasQuote,
    outcome: "captured",
    leadStatus: "quoted",
    minutesAgo: 51,
    lines: [
      { role: "agent", at: 0, text: GREETING },
      { role: "visitor", at: 16, text: "HKG to Heathrow, 1200 kg air" },
      { role: "agent", at: 19, text: "Air freight on our HKG–LHR lane, 1,200 kg chargeable. Here is where that prices:", showQuote: true },
      { role: "agent", at: 21, text: offer(tomasQuote) },
      { role: "visitor", at: 41, text: "Tomas Berg" },
      { role: "agent", at: 43, text: "Thanks Tomas. What is the best email to send the confirmed rate to?" },
      { role: "visitor", at: 58, text: "tomas@nordkraft.se" },
      { role: "agent", at: 60, text: "Done, Tomas. I have passed KL-Q-2094 to the Keelson desk with your details — someone will come back with the confirmed rate and a sailing schedule, usually within the hour." },
    ],
  },
  {
    id: "cv-1185",
    agent: "capture",
    name: "Sofia Marchetti",
    email: "s.marchetti@lombardaforni.it",
    company: "Lombarda Forni",
    location: "Milan, IT · Safari on macOS",
    origin: null,
    destination: null,
    mode: null,
    quote: null,
    outcome: "captured",
    leadStatus: "quoted",
    minutesAgo: 63,
    lines: [
      { role: "agent", at: 0, text: CAPTURE_GREETING },
      { role: "visitor", at: 20, text: "We ship oven components out of Shanghai" },
      { role: "agent", at: 23, text: "Oven components out of Shanghai — where are they heading, and do you move them by ocean or air?" },
      { role: "visitor", at: 41, text: "Los Angeles mostly, two containers a month" },
      { role: "agent", at: 44, text: "We run ocean FCL on Shanghai to Los Angeles regularly, 16–20 days. When are you looking to start, and who handles the freight for you today?" },
      { role: "visitor", at: 66, text: "Depends what it costs really" },
      { role: "agent", at: 69, text: "Our brokers price it properly once they have the detail, so I would rather not guess at it here. May I take your name and email and have one of them come back with a rate?" },
      { role: "visitor", at: 88, text: "Sofia Marchetti, s.marchetti@lombardaforni.it" },
      { role: "agent", at: 91, text: "Thanks Sofia. Your enquiry has gone to the team — someone will be in touch by email with a rate for Shanghai to Los Angeles." },
    ],
  },
  {
    id: "cv-1188",
    agent: "support",
    name: "Marta Nowak",
    email: "m.nowak@vantagroup.fr",
    company: "Vanta Group",
    location: "Gdańsk, PL · Edge on Windows",
    origin: null,
    destination: null,
    mode: null,
    quote: null,
    outcome: "captured",
    leadStatus: "new",
    minutesAgo: 96,
    lines: [
      { role: "agent", at: 0, text: SUPPORT_GREETING },
      { role: "visitor", at: 21, text: "Customs are asking for a certificate of origin on a Shanghai shipment. Do you issue that?" },
      { role: "agent", at: 24, text: "The certificate comes from the chamber of commerce at origin — our Shanghai office arranges it with the shipper, but I am not going to guess at what your clearance needs. Can I put you on to the documentation desk?" },
      { role: "visitor", at: 47, text: "Yes please. Marta Nowak" },
      { role: "agent", at: 49, text: "Thanks Marta. What email should they use?" },
      { role: "visitor", at: 60, text: "m.nowak@vantagroup.fr" },
      { role: "agent", at: 62, text: "Passed on, Marta. Documentation will email you today — have the booking reference to hand and they can check what is already on file." },
    ],
  },
  {
    id: "cv-1189",
    agent: "capture",
    name: "Owen Hargreaves",
    email: "owen@northgatetextiles.co.uk",
    company: "Northgate Textiles",
    location: "Manchester, UK · Chrome on Windows",
    origin: null,
    destination: null,
    mode: null,
    quote: null,
    outcome: "captured",
    leadStatus: "new",
    minutesAgo: 118,
    lines: [
      { role: "agent", at: 0, text: CAPTURE_GREETING },
      { role: "visitor", at: 26, text: "Textiles, we're moving off our current forwarder next quarter" },
      { role: "agent", at: 29, text: "Understood. Which lanes are you running today, and roughly what volume a month?" },
      { role: "visitor", at: 54, text: "Dhaka and Ho Chi Minh into Felixstowe, maybe 15 containers a month" },
      { role: "agent", at: 57, text: "That is squarely the sort of volume our brokers like to price properly rather than off a rate card. Are you looking to move by the end of the quarter?" },
      { role: "visitor", at: 79, text: "Yes, we want tenders in by then" },
      { role: "agent", at: 82, text: "Then the right thing is a person, not a chat window. May I take your name and email so someone from the tender desk can come back to you?" },
      { role: "visitor", at: 101, text: "Owen Hargreaves, owen@northgatetextiles.co.uk" },
      { role: "agent", at: 104, text: "Thanks Owen. Your enquiry has gone to the team — someone will be in touch about Dhaka and Ho Chi Minh into Felixstowe." },
    ],
  },
  {
    id: "cv-1180",
    agent: "quote",
    name: null,
    email: null,
    company: null,
    location: "Antwerp, BE · Chrome on Windows",
    origin: "Ningbo",
    destination: null,
    mode: null,
    quote: null,
    outcome: "abandoned",
    leadStatus: null,
    minutesAgo: 132,
    lines: [
      { role: "agent", at: 0, text: GREETING },
      { role: "visitor", at: 34, text: "Ningbo" },
      { role: "agent", at: 36, text: "Ningbo — and where is it heading?" },
    ],
  },
  {
    id: "cv-1186",
    agent: "support",
    name: "Ruth Cardoso",
    email: "r.cardoso@atlasagri.com",
    company: "Atlas Agri",
    location: "Porto, PT · Chrome on Android",
    origin: null,
    destination: null,
    mode: null,
    quote: null,
    outcome: "broker",
    leadStatus: "new",
    minutesAgo: 148,
    lines: [
      { role: "agent", at: 0, text: SUPPORT_GREETING },
      { role: "visitor", at: 24, text: "Two pallets came off the Amsterdam to Milan run damaged. Who covers that?" },
      { role: "agent", at: 27, text: "I am sorry to hear that. Claims and liability are handled by a colleague of ours, and I am not going to offer a view on fault or cost from here. Can I take your name so they can pick it up?" },
      { role: "visitor", at: 49, text: "Ruth Cardoso" },
      { role: "agent", at: 51, text: "Thanks Ruth. What email should they use?" },
      { role: "visitor", at: 63, text: "r.cardoso@atlasagri.com" },
      { role: "agent", at: 65, text: "Passed on, Ruth. Our claims colleague will email you today — it helps if you have the photographs and the delivery note to hand." },
    ],
  },
  {
    id: "cv-1179",
    agent: "quote",
    name: "Isabelle Rousseau",
    email: "i.rousseau@vantagroup.fr",
    company: "Vanta Group",
    location: "Lyon, FR · Firefox on macOS",
    origin: "Amsterdam",
    destination: "Milan",
    mode: "road",
    quote: isabelleQuote,
    outcome: "captured",
    leadStatus: "quoted",
    minutesAgo: 202,
    lines: [
      { role: "agent", at: 0, text: GREETING },
      { role: "visitor", at: 22, text: "Amsterdam to Milan" },
      { role: "agent", at: 24, text: "Amsterdam to Milan. How would you like it moved?" },
      { role: "visitor", at: 30, text: "Road" },
      { role: "agent", at: 32, text: "Roughly what weight, or how many pallets?" },
      { role: "visitor", at: 44, text: "4 pallets" },
      { role: "agent", at: 47, text: "Road freight on our AMS–MIL lane, 4 pallets. Here is where that prices:", showQuote: true },
      { role: "agent", at: 49, text: offer(isabelleQuote) },
      { role: "visitor", at: 71, text: "Isabelle Rousseau" },
      { role: "agent", at: 73, text: "Thanks Isabelle. What is the best email to send the confirmed rate to?" },
      { role: "visitor", at: 86, text: "i.rousseau@vantagroup.fr" },
      { role: "agent", at: 88, text: "Done, Isabelle. I have passed KL-Q-7310 to the Keelson desk with your details — someone will come back with the confirmed rate and a sailing schedule, usually within the hour." },
    ],
  },
  {
    id: "cv-1190",
    agent: "capture",
    name: null,
    email: null,
    company: null,
    location: "Casablanca, MA · Safari on iPhone",
    origin: null,
    destination: null,
    mode: null,
    quote: null,
    outcome: "abandoned",
    leadStatus: null,
    minutesAgo: 245,
    lines: [
      { role: "agent", at: 0, text: CAPTURE_GREETING },
      { role: "visitor", at: 33, text: "do you do refrigerated" },
      { role: "agent", at: 36, text: "We do — reefer containers on most of our ocean lanes. What are you moving, and where from?" },
    ],
  },
  {
    id: "cv-1178",
    agent: "quote",
    name: "Daniel Okoro",
    email: "d.okoro@atlasagri.com",
    company: "Atlas Agri",
    location: "Lagos, NG · Chrome on Android",
    origin: "Santos",
    destination: "Rotterdam",
    mode: "fcl",
    quote: danielQuote,
    outcome: "broker",
    leadStatus: "new",
    minutesAgo: 308,
    lines: [
      { role: "agent", at: 0, text: GREETING },
      { role: "visitor", at: 28, text: "Santos, Brazil to Rotterdam. 1 x 40HC" },
      { role: "agent", at: 31, text: "Ocean FCL on our SSZ–RTM lane, per 40HC. Here is where that prices:", showQuote: true },
      { role: "agent", at: 33, text: "Santos–Rotterdam is one our broker desk prices by hand, so treat that as a guide rather than a firm number. I can get a person on it straight away — what is your name?" },
      { role: "visitor", at: 55, text: "Daniel Okoro" },
      { role: "agent", at: 57, text: "Thanks Daniel. What is the best email to send the confirmed rate to?" },
      { role: "visitor", at: 69, text: "d.okoro@atlasagri.com" },
      { role: "agent", at: 71, text: "Done, Daniel. I have passed KL-Q-3355 to the Keelson desk with your details — someone will come back with the confirmed rate and a sailing schedule, usually within the hour." },
    ],
  },
  {
    id: "cv-1187",
    agent: "support",
    name: null,
    email: null,
    company: null,
    location: "Dubai, AE · Chrome on Android",
    origin: null,
    destination: null,
    mode: null,
    quote: null,
    outcome: "abandoned",
    leadStatus: null,
    minutesAgo: 410,
    lines: [
      { role: "agent", at: 0, text: SUPPORT_GREETING },
      { role: "visitor", at: 29, text: "whats the cut off for jebel ali rotterdam" },
      { role: "agent", at: 32, text: "Monday 15:00 for our weekly Jebel Ali–Rotterdam sailing, 18–22 days port to port. Is there a particular booking you are working to?" },
    ],
  },
  {
    id: "cv-1177",
    agent: "quote",
    name: "Mei Lin Chua",
    email: "meilin@sevenoaks.sg",
    company: "Sevenoaks Trading",
    location: "Singapore, SG · Chrome on Windows",
    origin: "Ningbo",
    destination: "Hamburg",
    mode: "lcl",
    quote: meiQuote,
    outcome: "captured",
    leadStatus: "won",
    minutesAgo: 580,
    lines: [
      { role: "agent", at: 0, text: GREETING },
      { role: "visitor", at: 18, text: "Ningbo to Hamburg, 12 cbm LCL" },
      { role: "agent", at: 21, text: "Ocean LCL on our NSA–HAM lane, 12.0 w/m. Here is where that prices:", showQuote: true },
      { role: "agent", at: 23, text: offer(meiQuote) },
      { role: "visitor", at: 46, text: "Mei Lin Chua" },
      { role: "agent", at: 48, text: "Thanks Mei. What is the best email to send the confirmed rate to?" },
      { role: "visitor", at: 61, text: "meilin@sevenoaks.sg" },
      { role: "agent", at: 63, text: "Done, Mei. I have passed KL-Q-6602 to the Keelson desk with your details — someone will come back with the confirmed rate and a sailing schedule, usually within the hour." },
    ],
  },
  {
    id: "cv-1176",
    agent: "quote",
    name: "Georg Koppel",
    email: "g.koppel@koppelandsons.de",
    company: "Koppel & Sons",
    location: "Bremen, DE · Edge on Windows",
    origin: "Shanghai",
    destination: "Los Angeles",
    mode: "fcl",
    quote: georgQuote,
    outcome: "captured",
    leadStatus: "won",
    minutesAgo: 1560,
    lines: [
      { role: "agent", at: 0, text: GREETING },
      { role: "visitor", at: 21, text: "Shanghai to Los Angeles, one 40ft" },
      { role: "agent", at: 24, text: "Ocean FCL on our SHA–LAX lane, per 40GP. Here is where that prices:", showQuote: true },
      { role: "agent", at: 26, text: offer(georgQuote) },
      { role: "visitor", at: 52, text: "Georg Koppel" },
      { role: "agent", at: 54, text: "Thanks Georg. What is the best email to send the confirmed rate to?" },
      { role: "visitor", at: 67, text: "g.koppel@koppelandsons.de" },
      { role: "agent", at: 69, text: "Done, Georg. I have passed KL-Q-1188 to the Keelson desk with your details — someone will come back with the confirmed rate and a sailing schedule, usually within the hour." },
    ],
  },
];
