import { brand } from "@/config/brand";

/**
 * Logo. Swap the mark for an <Image> when a prospect gives us their own —
 * everything else in the system reads the name from config.
 */
export function Wordmark({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-baseline gap-2">
      <span
        className={`text-[19px] font-bold leading-none tracking-[-0.03em] ${
          inverted ? "text-paper" : "text-ink"
        }`}
      >
        {brand.company.name}
      </span>
      <span className={`label-sm hidden sm:inline ${inverted ? "text-paper/55" : "text-mute"}`}>
        {brand.company.descriptor}
      </span>
    </span>
  );
}
