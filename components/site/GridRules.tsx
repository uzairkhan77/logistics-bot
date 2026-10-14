/** The 12 hairline column rules the whole layout is set on. Decorative. */
export function GridRules({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 hidden grid-cols-12 lg:grid ${className}`}
    >
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className={`border-r border-ink/[0.055] ${i === 0 ? "border-l" : ""}`}
        />
      ))}
    </div>
  );
}
