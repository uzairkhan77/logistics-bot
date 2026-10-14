/**
 * A plotting chart rather than a map: hairline graticule, plotted hubs and the
 * great-circle arcs between them. Deliberately abstract — a half-accurate world
 * map would read as clip art, and this direction has no photography in it.
 */
const HUBS = [
  { code: "USLAX", x: 92, y: 152 },
  { code: "USNYC", x: 156, y: 128 },
  { code: "BRSSZ", x: 190, y: 258 },
  { code: "NLRTM", x: 302, y: 104 },
  { code: "DEHAM", x: 322, y: 92 },
  { code: "AEJEA", x: 378, y: 176 },
  { code: "CNSHA", x: 512, y: 152 },
  { code: "HKHKG", x: 492, y: 180 },
  { code: "SGSIN", x: 474, y: 214 },
];

const ARCS = [
  { d: "M474 214 C 430 120, 360 74, 302 104", delay: 0 },
  { d: "M512 152 C 400 40, 190 60, 92 152", delay: 260 },
  { d: "M378 176 C 350 130, 330 112, 302 104", delay: 520 },
  { d: "M190 258 C 230 180, 268 128, 302 104", delay: 780 },
  { d: "M492 180 C 420 96, 240 88, 156 128", delay: 1040 },
];

export function NetworkChart() {
  return (
    <svg
      viewBox="0 0 620 320"
      className="h-auto w-full"
      role="img"
      aria-label="Schematic of the trade lanes between our main hubs"
    >
      <defs>
        <style>{`
          @keyframes tg-draw { to { stroke-dashoffset: 0; } }
          .tg-arc { stroke-dasharray: 620; stroke-dashoffset: 620; animation: tg-draw 1.8s cubic-bezier(0.2,0.7,0.3,1) forwards; }
          @media (prefers-reduced-motion: reduce) { .tg-arc { stroke-dashoffset: 0; animation: none; } }
        `}</style>
      </defs>

      {/* graticule */}
      <g stroke="var(--brand-ink)" strokeOpacity="0.07">
        {Array.from({ length: 16 }, (_, i) => (
          <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="320" />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 40} x2="620" y2={i * 40} />
        ))}
      </g>

      {/* the plate the hubs sit on */}
      <ellipse cx="310" cy="164" rx="270" ry="128" fill="none" stroke="var(--brand-ink)" strokeOpacity="0.1" />
      <ellipse cx="310" cy="164" rx="270" ry="52" fill="none" stroke="var(--brand-ink)" strokeOpacity="0.07" />

      {ARCS.map((arc) => (
        <path
          key={arc.d}
          d={arc.d}
          fill="none"
          stroke="var(--brand-accent)"
          strokeWidth="1.4"
          strokeLinecap="round"
          className="tg-arc"
          style={{ animationDelay: `${arc.delay}ms` }}
        />
      ))}

      {HUBS.map((hub) => (
        <g key={hub.code}>
          <rect
            x={hub.x - 3}
            y={hub.y - 3}
            width="6"
            height="6"
            fill="var(--brand-surface)"
            stroke="var(--brand-ink)"
            strokeWidth="1.4"
          />
          <text
            x={hub.x + 9}
            y={hub.y + 3.5}
            fill="var(--brand-mute)"
            fontFamily="var(--font-plex-mono), monospace"
            fontSize="9"
            letterSpacing="0.12em"
          >
            {hub.code}
          </text>
        </g>
      ))}
    </svg>
  );
}
