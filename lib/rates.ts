import { brand, type Lane, type Mode } from "@/config/brand";

export type QuoteInput = {
  origin: string;
  destination: string;
  mode: Mode;
  /** Air / LCL / road: gross weight in kg. */
  weightKg?: number;
  /** LCL: volume in cubic metres. */
  volumeCbm?: number;
  /** FCL: number of containers. */
  containers?: number;
  containerType?: "20GP" | "40GP" | "40HC";
  /** Overrides the derived reference outright — used by the seeded scenarios. */
  reference?: string;
  /**
   * Identifies the enquiry this quote belongs to. Salts the reference so two
   * customers asking about the same lane are not handed the same number.
   */
  enquiryId?: string;
};

export type QuoteLine = { label: string; detail?: string; amount: number };

export type Quote = {
  reference: string;
  origin: string;
  destination: string;
  mode: Mode;
  currency: "USD" | "EUR";
  lines: QuoteLine[];
  total: number;
  /** Indicative band shown around the headline figure. */
  low: number;
  high: number;
  transitMin: number;
  transitMax: number;
  /** Basis of the figure, e.g. "per 40HC" or "1,240 kg chargeable". */
  basis: string;
  matchedLane: Lane | null;
  /** False when the lane is routed to a human broker instead. */
  automated: boolean;
};

/** Stable pseudo-random in [0,1) from a string — keeps unmatched lanes consistent. */
function hash01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function normalise(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z]/g, "");
}

/** Matches free text like "Singapore", "SGSIN" or "singapore port" to a known lane. */
export function findLane(origin: string, destination: string, mode: Mode): Lane | null {
  const o = normalise(origin);
  const d = normalise(destination);
  if (!o || !d) return null;

  const hits = brand.lanes.filter((lane) => {
    const laneO = `${normalise(lane.originCity)} ${normalise(lane.originCode)}`;
    const laneD = `${normalise(lane.destCity)} ${normalise(lane.destCode)}`;
    return laneO.includes(o) && laneD.includes(d);
  });

  return hits.find((lane) => lane.mode === mode) ?? hits[0] ?? null;
}

const MODE_DEFAULTS: Record<Mode, { rate: number; transit: [number, number]; currency: "USD" | "EUR" }> = {
  air: { rate: 4.2, transit: [4, 7], currency: "USD" },
  fcl: { rate: 1850, transit: [22, 28], currency: "USD" },
  lcl: { rate: 104, transit: [28, 36], currency: "USD" },
  road: { rate: 62, transit: [2, 5], currency: "EUR" },
};

const CONTAINER_FACTOR: Record<NonNullable<QuoteInput["containerType"]>, number> = {
  "20GP": 0.78,
  "40GP": 1,
  "40HC": 1.06,
};

function round(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Deterministic estimate. Same inputs always produce the same figure, so the
 * demo never contradicts itself between the chat widget and the admin view.
 */
export function computeQuote(input: QuoteInput): Quote {
  const lane = findLane(input.origin, input.destination, input.mode);
  const defaults = MODE_DEFAULTS[input.mode];
  const seed = hash01(`${normalise(input.origin)}|${normalise(input.destination)}|${input.mode}`);

  const currency = lane?.currency ?? defaults.currency;
  // Unmatched lanes vary ±18% off the mode default so figures stay plausible.
  const baseRate = lane ? lane.baseRate : defaults.rate * (0.82 + seed * 0.36);
  const transitMin = lane ? lane.transitMin : defaults.transit[0] + Math.round(seed * 3);
  const transitMax = lane ? lane.transitMax : defaults.transit[1] + Math.round(seed * 4);

  const lines: QuoteLine[] = [];
  let basis = "";
  let freight = 0;

  if (input.mode === "fcl") {
    const containers = Math.max(1, input.containers ?? 1);
    const type = input.containerType ?? "40HC";
    const perBox = round(baseRate * CONTAINER_FACTOR[type], 5);
    freight = perBox * containers;
    basis = containers > 1 ? `${containers} × ${type}` : `per ${type}`;
    lines.push({ label: "Ocean freight", detail: `${containers} × ${type}`, amount: freight });
    lines.push({ label: "Terminal handling", detail: "Origin + destination", amount: round(285 * containers, 5) });
    lines.push({ label: "Documentation", detail: "B/L, manifest", amount: 95 });
  }

  if (input.mode === "air") {
    // Chargeable weight: the greater of gross weight and volumetric at 1:6.
    const gross = Math.max(1, input.weightKg ?? 500);
    const volumetric = input.volumeCbm ? input.volumeCbm * 167 : 0;
    const chargeable = Math.max(gross, volumetric);
    freight = round(chargeable * baseRate, 5);
    basis = `${chargeable.toLocaleString("en-US")} kg chargeable`;
    lines.push({ label: "Air freight", detail: `${chargeable.toLocaleString("en-US")} kg @ ${currency === "EUR" ? "€" : "$"}${baseRate.toFixed(2)}/kg`, amount: freight });
    lines.push({ label: "Security & screening", detail: "Per consignment", amount: round(Math.max(65, chargeable * 0.12), 5) });
    lines.push({ label: "AWB & handling", amount: 110 });
  }

  if (input.mode === "lcl") {
    const cbm = input.volumeCbm ?? Math.max(1, (input.weightKg ?? 1000) / 333);
    // LCL prices on the greater of volume or weight-tonnes (1 cbm : 1000 kg).
    const revenueTons = Math.max(cbm, (input.weightKg ?? 0) / 1000, 1);
    freight = round(revenueTons * baseRate, 5);
    basis = `${revenueTons.toFixed(1)} w/m`;
    lines.push({ label: "Ocean freight", detail: `${revenueTons.toFixed(1)} w/m @ ${currency === "EUR" ? "€" : "$"}${baseRate.toFixed(0)}`, amount: freight });
    lines.push({ label: "CFS handling", detail: "Origin + deconsolidation", amount: round(Math.max(120, revenueTons * 28), 5) });
    lines.push({ label: "Documentation", amount: 85 });
  }

  if (input.mode === "road") {
    const weight = Math.max(1, input.weightKg ?? 2000);
    const pallets = Math.max(1, Math.ceil(weight / 750));
    freight = lane ? round(baseRate * (pallets > 26 ? 1 : Math.max(0.45, pallets / 26)), 5) : round(pallets * baseRate, 5);
    basis = pallets >= 26 ? "Full load" : `${pallets} pallet${pallets > 1 ? "s" : ""}`;
    lines.push({ label: "Road freight", detail: basis, amount: freight });
    lines.push({ label: "Loading & securing", amount: round(Math.max(45, pallets * 12), 5) });
    lines.push({ label: "Tolls & road charges", amount: round(Math.max(38, pallets * 9), 5) });
  }

  const total = lines.reduce((sum, line) => sum + line.amount, 0);

  return {
    reference: input.reference ?? quoteReference(input),
    origin: input.origin,
    destination: input.destination,
    mode: input.mode,
    currency,
    lines,
    total,
    low: round(total * 0.94, 5),
    high: round(total * 1.09, 5),
    transitMin,
    transitMax,
    basis,
    matchedLane: lane,
    automated: lane ? lane.automated : true,
  };
}

/**
 * Deterministic reference for one enquiry.
 *
 * The lane alone is not enough to identify an enquiry — two unrelated visitors
 * shipping Shanghai → Rotterdam are two enquiries, and a reference that cannot
 * tell them apart is no use to the desk. So the shipment details and the
 * enquiry id are folded in as well. Re-pricing the same shipment inside one
 * conversation still lands on the same number.
 */
export function quoteReference(input: QuoteInput): string {
  const shipment = [input.weightKg, input.volumeCbm, input.containers, input.containerType]
    .map((value) => value ?? "")
    .join(",");
  const seed = hash01(
    `${normalise(input.origin)}|${normalise(input.destination)}|${input.mode}|${shipment}|${input.enquiryId ?? ""}`,
  );
  const n = 1000 + Math.floor(seed * 8999);
  return `KL-Q-${n}`;
}

export function formatMoney(amount: number, currency: "USD" | "EUR"): string {
  const symbol = currency === "EUR" ? "€" : "$";
  return `${symbol}${Math.round(amount).toLocaleString("en-US")}`;
}
